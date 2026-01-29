
import { StatusBarData, StatusBarItem, SnapshotEvent, CharacterData, ItemDefinition } from '../types';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

/**
 * 叙事生成器 (Narrative Engine)
 * 负责对比状态数据的变化，并生成自然语言描述。
 * v10.1 Refactor: Atomic Bilingual Variables & Mock Support
 */

// 叙事配置接口
export interface NarrativeConfig {
  id: string;
  name: string;
  templates: Record<string, string>; // 仅存储覆盖项，未定义的key回退到默认
  isBuiltIn?: boolean;
}

// 常量定义
const SINGLE_STRUCTURE_CATEGORIES = new Set(['CP', 'CR', 'CS', 'AE']);
const NUMERIC_RELATIVE_THRESHOLD = 0.3; // 判定为“剧烈变化”的阈值 (30%)

const STORAGE_KEY_CONFIGS = 'th_narrative_configs_v1';
const STORAGE_KEY_ACTIVE_ID = 'th_narrative_active_id_v1';
const LEGACY_STORAGE_KEY = 'th_narrative_templates_v1';

// --- 默认叙事模板库 (v10.1 原子化变量) ---
export const DEFAULT_TEMPLATES: Record<string, string> = {
  // --- 数值变化 (Numeric) ---
  'numeric_dramatic_increase': '一股力量涌入，{角色名}的{键名}因为“{原因}”，从 {旧值} 激增到了 {新值}（{变化量}）！',
  'numeric_dramatic_increase_user': '犹如神迹降临，{角色名}的{键名}被强制修改，从 {旧值} 暴涨至 {新值}。',
  
  'numeric_dramatic_decrease': '{角色名}的{键名}遭遇重创，因为“{原因}”，从 {旧值} 骤降至 {新值}（{变化量}）。',
  'numeric_dramatic_decrease_user': '世界意志无情地剥夺了{角色名}的{键名}，数值从 {旧值} 跌落至 {新值}。',
  
  'numeric_subtle_increase': '{角色名}的{键名}略微上升了，变为 {新值}（{变化量}）。',
  'numeric_subtle_increase_user': '{角色名}的{键名}被微调上升，现为 {新值}。',
  
  'numeric_subtle_decrease': '{角色名}的{键名}略微下降了，变为 {新值}（{变化量}）。',
  'numeric_subtle_decrease_user': '{角色名}的{键名}被微调下降，现为 {新值}。',

  // --- 集合变化 (Array/List) ---
  'array_items_added': '{角色名}的{键名}中新增了：{新增项}。当前列表：{新列表}。',
  'array_items_added_user': '命运的剧本被改写，{角色名}获得了 {新增项}。',
  
  'array_items_removed': '{角色名}失去了以下{键名}：{移除项}。',
  'array_items_removed_user': '存在被抹去，{角色名}的{键名}中少了：{移除项}。',
  
  'array_items_replaced': '{角色名}的{键名}发生了更替：{移除项} 变为 {新增项}。',
  'array_items_replaced_user': '{角色名}的{键名}被重构：{移除项} 被替换为 {新增项}。',

  // --- 文本变化 (Text) ---
  'text_change': '{角色名}的“{键名}”状态更新为：“{新值}”（原为：{旧值}）。',
  'text_change_user': '现实被重塑，{角色名}的“{键名}”现在是：“{新值}”。',

  // --- 角色/物品进出场 (Meta/Lifecycle) ---
  'character_enters': '场景中，{角色名}的身影出现了。',
  'character_enters_user': '导演将镜头转向了{角色名}，他/她已在场。',
  
  'character_leaves': '{角色名}离开了这里，消失在视野中。',
  'character_leaves_user': '{角色名}被移出了当前舞台。',
  
  'item_added': '{角色名}拥有了新的{键名}，初始值为：{新值}。',
  'item_added_user': '随着{角色名}的登场，{键名}被设定为：{新值}。',
  
  'item_removed': '{角色名}的{键名}（{旧值}）已移除。',
  'item_removed_user': '{角色名}的{键名}（{旧值}）被强制清除。',
  
  'data_type_changed': '{角色名}的{键名}数据结构发生了根本性的变化。',
};

// 变量定义元数据 (用于 UI 提示与 Mock)
const VARS_COMMON = ['角色名', '键名', 'name', 'key'];
const VARS_NUMERIC = ['旧值', '新值', '变化量', '变化量绝对值', '原因', 'old', 'new', 'diff', 'diff_abs', 'reason'];
const VARS_ARRAY = ['新增项', '移除项', '新列表', '旧列表', 'added', 'removed', 'list_new', 'list_old'];
const VARS_TEXT = ['旧值', '新值', 'old', 'new'];

// 模板元数据 (用于 UI 显示)
export const TEMPLATE_INFO: Record<string, { label: string, vars: string[] }> = {
    'numeric_dramatic_increase': { label: '数值剧增 (AI)', vars: [...VARS_COMMON, ...VARS_NUMERIC] },
    'numeric_dramatic_increase_user': { label: '数值剧增 (用户)', vars: [...VARS_COMMON, ...VARS_NUMERIC] },
    'numeric_dramatic_decrease': { label: '数值骤降 (AI)', vars: [...VARS_COMMON, ...VARS_NUMERIC] },
    'numeric_dramatic_decrease_user': { label: '数值骤降 (用户)', vars: [...VARS_COMMON, ...VARS_NUMERIC] },
    'numeric_subtle_increase': { label: '数值微升 (AI)', vars: [...VARS_COMMON, ...VARS_NUMERIC] },
    'numeric_subtle_increase_user': { label: '数值微升 (用户)', vars: [...VARS_COMMON, ...VARS_NUMERIC] },
    'numeric_subtle_decrease': { label: '数值微降 (AI)', vars: [...VARS_COMMON, ...VARS_NUMERIC] },
    'numeric_subtle_decrease_user': { label: '数值微降 (用户)', vars: [...VARS_COMMON, ...VARS_NUMERIC] },
    
    'array_items_added': { label: '获得物品/标签 (AI)', vars: [...VARS_COMMON, ...VARS_ARRAY] },
    'array_items_added_user': { label: '获得物品/标签 (用户)', vars: [...VARS_COMMON, ...VARS_ARRAY] },
    'array_items_removed': { label: '失去物品/标签 (AI)', vars: [...VARS_COMMON, ...VARS_ARRAY] },
    'array_items_removed_user': { label: '失去物品/标签 (用户)', vars: [...VARS_COMMON, ...VARS_ARRAY] },
    'array_items_replaced': { label: '物品/标签更替 (AI)', vars: [...VARS_COMMON, ...VARS_ARRAY] },
    'array_items_replaced_user': { label: '物品/标签更替 (用户)', vars: [...VARS_COMMON, ...VARS_ARRAY] },
    
    'text_change': { label: '文本描述变更 (AI)', vars: [...VARS_COMMON, ...VARS_TEXT] },
    'text_change_user': { label: '文本描述变更 (用户)', vars: [...VARS_COMMON, ...VARS_TEXT] },
    
    'character_enters': { label: '角色进场 (AI)', vars: ['角色名', 'name'] },
    'character_enters_user': { label: '角色进场 (用户)', vars: ['角色名', 'name'] },
    'character_leaves': { label: '角色退场 (AI)', vars: ['角色名', 'name'] },
    'character_leaves_user': { label: '角色退场 (用户)', vars: ['角色名', 'name'] },
};

// --- Config Management ---

function loadConfigs(): NarrativeConfig[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_CONFIGS);
        if (stored) return JSON.parse(stored);
    } catch(e) { console.error(e); }
    return [];
}

function saveConfigsList(configs: NarrativeConfig[]) {
    localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(configs));
}

/**
 * 获取所有可用配置 (包含迁移逻辑)
 */
export function getNarrativeConfigs(): NarrativeConfig[] {
    let configs = loadConfigs();
    if (configs.length === 0) {
        // Init Defaults & Migrate
        const defaultConfig: NarrativeConfig = {
            id: 'default',
            name: '系统默认 (System)',
            templates: {},
            isBuiltIn: true
        };
        configs.push(defaultConfig);

        try {
            const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacy) {
                const legacyTemplates = JSON.parse(legacy);
                configs.push({
                    id: 'custom_legacy',
                    name: '自定义 (旧版迁移)',
                    templates: legacyTemplates,
                    isBuiltIn: false
                });
                setActiveNarrativeConfigId('custom_legacy');
                localStorage.removeItem(LEGACY_STORAGE_KEY);
                console.log('[Narrative] Migrated legacy templates.');
            } else {
                setActiveNarrativeConfigId('default');
            }
        } catch (e) { console.error(e); }
        saveConfigsList(configs);
    }
    return configs;
}

export function getActiveNarrativeConfigId(): string {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || 'default';
}

export function setActiveNarrativeConfigId(id: string) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
}

export function createNarrativeConfig(name: string, baseTemplates: Record<string, string> = {}): NarrativeConfig {
    const configs = getNarrativeConfigs();
    const newConfig: NarrativeConfig = {
        id: uuidv4(),
        name,
        templates: baseTemplates,
        isBuiltIn: false
    };
    configs.push(newConfig);
    saveConfigsList(configs);
    return newConfig;
}

export function updateNarrativeConfig(config: NarrativeConfig) {
    const configs = getNarrativeConfigs();
    const idx = configs.findIndex(c => c.id === config.id);
    if (idx >= 0) {
        if (configs[idx].isBuiltIn) return; // Protect default
        configs[idx] = config;
        saveConfigsList(configs);
    }
}

export function deleteNarrativeConfig(id: string) {
    let configs = getNarrativeConfigs();
    const configToDelete = configs.find(c => c.id === id);
    if (configToDelete?.isBuiltIn) return;

    configs = configs.filter(c => c.id !== id);
    saveConfigsList(configs);
    
    if (getActiveNarrativeConfigId() === id) {
        setActiveNarrativeConfigId('default');
    }
}

/**
 * 获取当前生效的模板 (合并默认与激活配置的覆盖项)
 */
export function getNarrativeTemplates(): Record<string, string> {
    const configs = getNarrativeConfigs();
    const activeId = getActiveNarrativeConfigId();
    const activeConfig = configs.find(c => c.id === activeId) || configs.find(c => c.id === 'default');
    
    return { ...DEFAULT_TEMPLATES, ...(activeConfig?.templates || {}) };
}

export function saveNarrativeTemplates(templates: Record<string, string>) {
    const activeId = getActiveNarrativeConfigId();
    const configs = getNarrativeConfigs();
    let config = configs.find(c => c.id === activeId);

    if (config && !config.isBuiltIn) {
        config.templates = templates;
        updateNarrativeConfig(config);
    } else {
        console.warn('Attempted to save templates to a built-in config via legacy method.');
    }
}

export function resetNarrativeTemplates() {
    setActiveNarrativeConfigId('default');
}

// --- Snapshot Logic ---

function parseSingleNumber(str: string): number | null {
    if (typeof str !== 'string' || !str.trim()) return null;
    const match = str.match(/^(-?\d+(?:\.\d+)?)/); // Match start of string number
    return match ? parseFloat(match[1]) : null;
}

function getNumericStructure(item: StatusBarItem, def?: ItemDefinition): { current: number | null, max: number | null, reason: string | null, change: number | null } {
    const values = (item.values || []) as string[];
    
    // Default Map: [Current, Max, Change, Reason]
    let currIdx = 0;
    let maxIdx = 1;
    let chgIdx = 2;
    let rsnIdx = 3;

    if (def?.structure?.parts) {
        currIdx = def.structure.parts.findIndex(p => p.key === 'current');
        if (currIdx === -1) currIdx = def.structure.parts.findIndex(p => p.key === 'value');
        maxIdx = def.structure.parts.findIndex(p => p.key === 'max');
        chgIdx = def.structure.parts.findIndex(p => p.key === 'change');
        rsnIdx = def.structure.parts.findIndex(p => p.key === 'reason');
    }

    const current = parseSingleNumber(values[currIdx] ?? '');
    const max = maxIdx > -1 ? parseSingleNumber(values[maxIdx] ?? '') : null;
    const change = chgIdx > -1 ? parseSingleNumber(values[chgIdx] ?? '') : null;
    const reason = rsnIdx > -1 ? (values[rsnIdx] || null) : null;

    return { current, max, change, reason };
}

const formatters = {
  numeric(val: number, max: number | null) {
    if (max !== null && max > 0) return `${val}/${max}`;
    return String(val);
  },
  array(value: any[]) {
    if (!Array.isArray(value)) return String(value);
    
    return value.map(item => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            const vals = Object.values(item).filter(v => v !== undefined && v !== '');
            if (vals.length === 0) return '';
            const first = vals[0];
            if (vals.length === 1) return String(first);
            return `${first}`; // Simplified for narrative
        }
        if (Array.isArray(item)) return `(${item.join('，')})`;
        return String(item);
    }).join('、');
  },
  default(value: any) {
    return Array.isArray(value) ? (value as string[]).flat().join('，') : String(value);
  },
};

function processItemChange(
  oldItem: StatusBarItem | undefined,
  newItem: StatusBarItem | undefined,
  character: string | null,
  category: string,
  key: string,
  detectedEvents: SnapshotEvent[],
  itemDefs: { [key: string]: ItemDefinition }
) {
  const def = itemDefs[key];
  
  const determineDataType = (item: StatusBarItem): 'numeric' | 'text' | 'array' => {
      if (def?.type) {
        if (def.type === 'list-of-objects') return 'array';
        return def.type;
      }
      const val0 = item.values[0];
      if (parseSingleNumber(val0 as string) !== null && item.values.length > 1) return 'numeric'; 
      if (SINGLE_STRUCTURE_CATEGORIES.has(category) || (item.values.length > 1 && !parseSingleNumber(val0 as string))) return 'array';
      return 'text';
  };

  const dataType = newItem ? determineDataType(newItem) : (oldItem ? determineDataType(oldItem) : 'text');

  // 1. 新增
  if (!oldItem && newItem) {
    const event: SnapshotEvent = {
      source: newItem.user_modified ? 'user' : 'ai',
      character, category, key, change_type: 'item_added', data_type: dataType,
      previous: null, current: newItem.values, details: { value: newItem.values },
    };
    detectedEvents.push(event);
    return;
  }

  // 2. 删除
  if (oldItem && !newItem) {
    detectedEvents.push({
      source: 'ai', character, category, key, change_type: 'item_removed', data_type: dataType,
      previous: oldItem.values, current: null, details: { value: oldItem.values },
    });
    return;
  }

  // 3. 对比
  if (!newItem || !oldItem || _.isEqual(newItem.values, oldItem.values)) return;

  const source = newItem.user_modified ? 'user' : 'ai';

  if (dataType === 'numeric') {
      const oldStruct = getNumericStructure(oldItem, def);
      const newStruct = getNumericStructure(newItem, def);
      
      if (oldStruct.current === null || newStruct.current === null) return;
      if (oldStruct.current === newStruct.current) return;

      const diff = newStruct.current - oldStruct.current;
      const base = oldStruct.current === 0 ? (newStruct.current !== 0 ? 1 : 100) : oldStruct.current;
      const max = newStruct.max || oldStruct.max;
      
      let ratio = Math.abs(diff) / Math.abs(base);
      if (max) ratio = Math.abs(diff) / max;

      let changeType = ratio >= NUMERIC_RELATIVE_THRESHOLD ? 'numeric_dramatic' : 'numeric_subtle';
      changeType += diff > 0 ? '_increase' : '_decrease';

      detectedEvents.push({
        source, character, category, key, change_type: changeType, data_type: 'numeric',
        previous: oldItem.values, current: newItem.values,
        details: { 
            from: oldStruct.current, 
            to: newStruct.current, 
            change: diff, 
            reason: newStruct.reason || (newItem.values[3] as string), // Try generic reason index
            ratio 
        }
      });
      return;
  }

  if (dataType === 'array') {
    const added = _.differenceWith(newItem.values, oldItem.values, _.isEqual).filter(v => v);
    const removed = _.differenceWith(oldItem.values, newItem.values, _.isEqual).filter(v => v);

    if (added.length > 0 || removed.length > 0) {
      let changeType = added.length > 0 && removed.length > 0 ? 'array_items_replaced' 
        : added.length > 0 ? 'array_items_added' : 'array_items_removed';
      
      detectedEvents.push({
        source, character, category, key, change_type: changeType, data_type: 'array',
        previous: oldItem.values, current: newItem.values,
        details: { added, removed },
      });
      return;
    }
  }

  // Text Change
  if (newItem.values[0] !== oldItem.values[0]) {
    detectedEvents.push({
      source, character, category, key, change_type: 'text_change', data_type: 'text',
      previous: oldItem.values, current: newItem.values,
      details: { from: oldItem.values[0], to: newItem.values[0], value: newItem.values[0] },
    });
  }
}

export function detectChanges(oldData: StatusBarData, newData: StatusBarData): SnapshotEvent[] {
  const detectedEvents: SnapshotEvent[] = [];
  const definitions = newData.item_definitions || {};

  const allSharedCats = new Set([...Object.keys(oldData.shared || {}), ...Object.keys(newData.shared || {})]);
  allSharedCats.forEach(cat => {
    const oldItems = oldData.shared?.[cat] || [];
    const newItems = newData.shared?.[cat] || [];
    const allKeys = new Set([...oldItems.map(i => i.key), ...newItems.map(i => i.key)]);
    
    allKeys.forEach(key => {
      const oldItem = oldItems.find(i => i.key === key);
      const newItem = newItems.find(i => i.key === key);
      processItemChange(oldItem, newItem, null, cat, key, detectedEvents, definitions);
    });
  });

  const allCharIds = new Set([...Object.keys(oldData.id_map || {}), ...Object.keys(newData.id_map || {})]);
  allCharIds.forEach(charId => {
    const oldMeta = oldData.character_meta?.[charId];
    const newMeta = newData.character_meta?.[charId];
    const oldPresent = oldMeta?.isPresent !== false;
    const newPresent = newMeta?.isPresent !== false;
    const charName = newData.id_map[charId] || oldData.id_map[charId] || charId;

    if (!oldPresent && newPresent) {
      detectedEvents.push({
        source: 'user', character: charName, category: 'meta', key: 'presence', change_type: 'character_enters',
        data_type: 'text', previous: false, current: true, details: { message: `${charName} enters.` }
      });
    } else if (oldPresent && !newPresent) {
      detectedEvents.push({
        source: 'user', character: charName, category: 'meta', key: 'presence', change_type: 'character_leaves',
        data_type: 'text', previous: true, current: false, details: { message: `${charName} leaves.` }
      });
    }

    const oldChar = oldData.characters?.[charId];
    const newChar = newData.characters?.[charId];
    const allCats = new Set([...Object.keys(oldChar || {}), ...Object.keys(newChar || {})]);
    
    allCats.forEach(cat => {
      const oldItems = oldChar?.[cat] || [];
      const newItems = newChar?.[cat] || [];
      const allKeys = new Set([...oldItems.map(i => i.key), ...newItems.map(i => i.key)]);
      
      allKeys.forEach(key => {
        const oldItem = oldItems.find(i => i.key === key);
        const newItem = newItems.find(i => i.key === key);
        processItemChange(oldItem, newItem, charName, cat, key, detectedEvents, definitions);
      });
    });
  });

  return detectedEvents;
}

/**
 * 格式化占位符 (v10.1 Refactor)
 * 支持中英文双语变量，逻辑扁平化
 */
function formatPlaceholder(placeholder: string, event: SnapshotEvent): string {
  const { details, character, key, current, previous, data_type } = event;
  const charName = character === 'User' ? '{{user}}' : character || '世界';
  
  // 1. 通用变量
  if (['name', '角色名'].includes(placeholder)) return charName;
  if (['key', '键名'].includes(placeholder)) return key;
  if (['prefix', '前缀'].includes(placeholder)) return character ? (character === 'User' ? '{{user}}的' : `${character}的`) : '';

  // 2. 数值型
  if (data_type === 'numeric') {
      const { from, to, change, reason } = details || {};
      if (['old', '旧值'].includes(placeholder)) return formatters.numeric(from, null);
      if (['new', '新值'].includes(placeholder)) return formatters.numeric(to, null);
      if (['diff', '变化量'].includes(placeholder)) return change > 0 ? `+${change}` : `${change}`;
      if (['diff_abs', '变化量绝对值'].includes(placeholder)) return String(Math.abs(change));
      if (['reason', '原因'].includes(placeholder)) return reason || '未知原因';
      
      // Legacy Support
      if (placeholder === 'changeClause') {
          const changeText = change > 0 ? `增加了${change}` : `减少了${Math.abs(change)}`;
          const reasonText = reason ? `因为“${reason}”，` : '';
          return `，${reasonText}从${formatters.numeric(from, null)}${changeText}，达到了${formatters.numeric(to, null)}`;
      }
  }

  // 3. 数组/列表型
  if (data_type === 'array') {
      const { added, removed } = details || {};
      const listNew = current;
      const listOld = previous;
      
      if (['added', '新增项'].includes(placeholder)) return formatters.array(added || []);
      if (['removed', '移除项'].includes(placeholder)) return formatters.array(removed || []);
      if (['list_new', '新列表'].includes(placeholder)) return formatters.array(listNew || []);
      if (['list_old', '旧列表'].includes(placeholder)) return formatters.array(listOld || []);
  }

  // 4. 文本型
  if (['old', '旧值', 'previousValue'].includes(placeholder)) return formatters.default(previous);
  if (['new', '新值', 'value'].includes(placeholder)) return formatters.default(current);

  return `{${placeholder}}`;
}

/**
 * 核心函数：生成叙事文本
 */
export function generateNarrative(events: SnapshotEvent[]): string {
  const EXCLUDED_KEYS = new Set(['剧情发展', '可移动地点', '可互动对象', '吐槽']);
  const descriptions: string[] = [];
  const templates = getNarrativeTemplates();

  events.forEach(event => {
    if (EXCLUDED_KEYS.has(event.key)) return;
    
    let templateKey = `${event.change_type}_${event.source}`;
    let template = templates[templateKey];
    
    if (!template) {
        templateKey = event.change_type;
        template = templates[templateKey];
    }

    if (!template) return;

    // 支持 Unicode 字符作为变量名 (e.g., {旧值})
    const description = template.replace(/\{([\u4e00-\u9fa5a-zA-Z0-9_]+)\}/g, (match, placeholder) => 
      formatPlaceholder(placeholder, event)
    );
    descriptions.push(description);
  });

  return descriptions.join('\n');
}
