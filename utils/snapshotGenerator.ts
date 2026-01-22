import { StatusBarData, StatusBarItem, SnapshotEvent, CharacterData, ItemDefinition } from '../types';
import _ from 'lodash';

/**
 * 叙事生成器 (Narrative Engine)
 * 负责对比状态数据的变化，并生成自然语言描述。
 * v6.7 Refactor: Supports Flat Array Structure (Definition-Driven)
 */

// 常量定义
const SINGLE_STRUCTURE_CATEGORIES = new Set(['CP', 'CR', 'CS', 'AE']);
const NUMERIC_RELATIVE_THRESHOLD = 0.3; // 判定为“剧烈变化”的阈值 (30%)

// 默认叙事模板
const defaultTemplates: Record<string, string> = {
  numeric_dramatic_increase: '一股强大的力量涌入，{prefix}{key}{changeClause}！',
  numeric_dramatic_decrease: '某种重要的东西被剥离了，{prefix}{key}{changeClause}。',
  numeric_subtle_increase: '{prefix}{key}似乎有了一些提升，{changeClause}。',
  numeric_subtle_decrease: '{prefix}{key}好像被消耗了少许，{changeClause}。',
  array_items_added: '{prefix}{key}中，增添了新的内容：{addedItems}。',
  array_items_removed: '一些{key}从{prefix}生命中消失了，似乎是：{removedItems}。',
  array_items_replaced: '{prefix}{key}发生了变化：旧的 {removedItems} 不见了，取而代之的是新的 {addedItems}。',
  text_change: '{prefix}关于“{key}”的状态描述更新为：“{value}”。',
  character_enters: '场景中，{character}的身影出现了。',
  character_leaves: '{character}离开了这里，消失在视野中。',
  item_added: '{character}出现了，{initialChangeClause}{prefix}{key}的初始状态被设定为：{value}。',
  item_removed: '{prefix}的{key}（{previousValue}）被移除了。',
  data_type_changed: '{prefix}{key}的数据类型发生了根本性的变化。',
};

/**
 * 纯数值解析器
 * 不再处理 @ 分隔，只处理单个字符串是否为数字
 */
function parseSingleNumber(str: string): number | null {
    if (typeof str !== 'string' || !str.trim()) return null;
    const match = str.match(/^(-?\d+(?:\.\d+)?)/); // Match start of string number
    return match ? parseFloat(match[1]) : null;
}

/**
 * 获取数值结构映射
 */
function getNumericStructure(item: StatusBarItem, def?: ItemDefinition): { current: number | null, max: number | null, reason: string | null, change: number | null } {
    const values = (item.values || []) as string[];
    
    // Default Map: [Current, Max, Change, Reason]
    let currIdx = 0;
    let maxIdx = 1;
    let chgIdx = 2;
    let rsnIdx = 3;

    if (def?.structure?.parts) {
        // FIX: Use findIndex on ItemDefinitionPart[]
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

/**
 * 辅助格式化器
 */
const formatters = {
  numeric(val: number, max: number | null) {
    if (max !== null && max > 0) return `${val}/${max}`;
    return String(val);
  },
  array(value: any, category: string) {
    if (!Array.isArray(value)) return String(value);
    if (SINGLE_STRUCTURE_CATEGORIES.has(category)) {
      return (value as string[]).flat().join('、');
    } else {
      return value.map(item => (Array.isArray(item) ? `(${(item as string[]).join('，')})` : (typeof item === 'object' ? Object.values(item).join('/') : item))).join('、');
    }
  },
  default(value: any) {
    return Array.isArray(value) ? (value as string[]).flat().join('，') : String(value);
  },
};

/**
 * 处理单个条目的变化
 */
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
  
  // 判定数据类型 (Priority: Definition > Heuristic)
  const determineDataType = (item: StatusBarItem): 'numeric' | 'text' | 'array' => {
      // FIX: The snapshot generator treats 'list-of-objects' as a type of 'array' for narrative purposes.
      if (def?.type) {
        if (def.type === 'list-of-objects') {
            return 'array';
        }
        return def.type;
      }
      // Fallback heuristics
      const val0 = item.values[0];
      if (parseSingleNumber(val0 as string) !== null && item.values.length > 1) return 'numeric'; // Likely numeric structure
      if (SINGLE_STRUCTURE_CATEGORIES.has(category) || (item.values.length > 1 && !parseSingleNumber(val0 as string))) return 'array';
      return 'text';
  };

  const dataType = newItem ? determineDataType(newItem) : (oldItem ? determineDataType(oldItem) : 'text');

  // 1. 新增条目
  if (!oldItem && newItem) {
    const event: SnapshotEvent = {
      source: newItem.user_modified ? 'user' : 'ai',
      character,
      category,
      key,
      change_type: 'item_added',
      data_type: dataType,
      previous: null,
      current: newItem.values,
      details: { value: newItem.values },
    };
    
    if (dataType === 'numeric') {
        const { change, reason } = getNumericStructure(newItem, def);
        if (change !== null) event.details!.change = change;
        if (reason) event.details!.reason = reason;
    }
    detectedEvents.push(event);
    return;
  }

  // 2. 删除条目
  if (oldItem && !newItem) {
    detectedEvents.push({
      source: 'ai',
      character,
      category,
      key,
      change_type: 'item_removed',
      data_type: dataType,
      previous: oldItem.values,
      current: null,
      details: { value: oldItem.values },
    });
    return;
  }

  // 3. 对比现有条目
  if (!newItem || !oldItem || _.isEqual(newItem.values, oldItem.values)) return;

  const source = newItem.user_modified ? 'user' : 'ai';

  if (dataType === 'numeric') {
      const oldStruct = getNumericStructure(oldItem, def);
      const newStruct = getNumericStructure(newItem, def);
      
      if (oldStruct.current === null || newStruct.current === null) return; // Cannot compare non-numbers
      if (oldStruct.current === newStruct.current) return; // Value didn't change (maybe description did, ignore for now)

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
            reason: newStruct.reason,
            ratio 
        }
      });
      return;
  }

  if (dataType === 'array') {
    // FIX: Use _.differenceWith for arrays of objects.
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

/**
 * 核心函数：检测变化
 */
export function detectChanges(oldData: StatusBarData, newData: StatusBarData): SnapshotEvent[] {
  const detectedEvents: SnapshotEvent[] = [];
  const definitions = newData.item_definitions || {};

  // 1. 处理共享数据
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

  // 2. 处理角色数据
  const allCharIds = new Set([
      ...Object.keys(oldData.id_map || {}), 
      ...Object.keys(newData.id_map || {})
  ]);

  allCharIds.forEach(charId => {
    const oldMeta = oldData.character_meta?.[charId];
    const newMeta = newData.character_meta?.[charId];
    const oldPresent = oldMeta?.isPresent !== false;
    const newPresent = newMeta?.isPresent !== false;
    const charName = newData.id_map[charId] || oldData.id_map[charId] || charId;

    // 进退场检测
    if (!oldPresent && newPresent) {
      detectedEvents.push({
        source: 'ai', character: charName, category: 'meta', key: 'presence', change_type: 'character_enters',
        data_type: 'text', previous: false, current: true, details: { message: `${charName} enters.` }
      });
    } else if (oldPresent && !newPresent) {
      detectedEvents.push({
        source: 'ai', character: charName, category: 'meta', key: 'presence', change_type: 'character_leaves',
        data_type: 'text', previous: true, current: false, details: { message: `${charName} leaves.` }
      });
    }

    // 数据变更
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
 * 格式化占位符
 */
function formatPlaceholder(placeholder: string, event: SnapshotEvent): string {
  const { details, character, key, current, previous, data_type } = event;
  const charName = character === 'User' ? '{{user}}' : character || '世界';
  const prefix = character ? (character === 'User' ? '{{user}}的' : `${character}的`) : '';

  // 处理特殊子句
  if (placeholder === 'changeClause') {
    const { reason, from, to, change } = details || {};
    const fromStr = formatters.numeric(from, null);
    const toStr = formatters.numeric(to, null);
    const chgVal = change as number;
    const changeText = chgVal > 0 ? `增加了${chgVal}` : `减少了${Math.abs(chgVal)}`;
    const reasonText = reason ? `因为“${reason}”，` : '';
    return `，${reasonText}从${fromStr}${changeText}，达到了${toStr}`;
  }
  
  if (placeholder === 'initialChangeClause') {
     const { reason, change } = details || {};
     if (!change) return '';
     const reasonText = reason ? `因为“${reason}”，` : '';
     const chgVal = change as number;
     const changeText = chgVal > 0 ? `在增加了${chgVal}后，` : `在减少了${Math.abs(chgVal)}后，`;
     return `${reasonText}${changeText}`;
  }

  if (placeholder === 'character') return charName;
  if (placeholder === 'prefix') return prefix;
  if (placeholder === 'key') return key;

  // 数据映射
  let sourceData: any;

  switch (placeholder) {
    case 'value': sourceData = current; break;
    case 'previousValue': sourceData = previous; break;
    case 'addedItems': sourceData = details?.added; break;
    case 'removedItems': sourceData = details?.removed; break;
    default: return `{${placeholder}}`;
  }

  if (sourceData === undefined || sourceData === null) return '';

  switch (data_type) {
    case 'numeric':
       // For text narrative, we usually just want the current value
       return String(Array.isArray(sourceData) ? sourceData[0] : sourceData);
    case 'array':
      return formatters.array(sourceData, event.category);
    default:
      return formatters.default(sourceData);
  }
}

/**
 * 核心函数：生成叙事文本
 */
export function generateNarrative(events: SnapshotEvent[]): string {
  const EXCLUDED_KEYS = new Set(['剧情发展', '可移动地点', '可互动对象', '吐槽']);
  const descriptions: string[] = [];

  events.forEach(event => {
    if (EXCLUDED_KEYS.has(event.key)) return;
    
    const template = defaultTemplates[event.change_type];
    if (!template) return;

    const description = template.replace(/{(\w+)}/g, (match, placeholder) => 
      formatPlaceholder(placeholder, event)
    );
    descriptions.push(description);
  });

  return descriptions.join('\n');
}