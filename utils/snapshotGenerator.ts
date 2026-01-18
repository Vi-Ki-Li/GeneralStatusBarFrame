
import { StatusBarData, StatusBarItem, SnapshotEvent, CharacterData } from '../types';
import _ from 'lodash';

/**
 * 叙事生成器 (Narrative Engine)
 * 负责对比状态数据的变化，并生成自然语言描述。
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
 * 解析数值字符串
 * 支持格式: "80@100", "80", "80|+5|原因"
 */
function parseNumericValue(valueString: string): { value: number; maxValue: number | null } | null {
  if (typeof valueString !== 'string' || valueString.trim() === '') {
    return null;
  }
  // 格式1: N1@N2 (e.g., "75@100")
  let match = valueString.match(/^(-?\d+(?:\.\d+)?)\s*@\s*(-?\d+(?:\.\d+)?)/);
  if (match) {
    return { value: parseFloat(match[1]), maxValue: parseFloat(match[2]) };
  }
  // 格式2: N1|... (e.g., "900|+20") - 我们只关心用于比较的N1部分
  match = valueString.match(/^(-?\d+(?:\.\d+)?)\s*\|/);
  if (match) {
    return { value: parseFloat(match[1]), maxValue: null };
  }
  // 格式3: N[单位] (e.g., "25岁", "-10dB")
  match = valueString.match(/^(-?\d+(?:\.\d+)?)\s*(\D.*)$/);
  if (match) {
    return { value: parseFloat(match[1]), maxValue: null };
  }
  // 格式4: 纯数字 N (e.g., "100")
  match = valueString.match(/^(-?\d+(?:\.\d+)?)$/);
  if (match) {
    return { value: parseFloat(match[1]), maxValue: null };
  }
  return null;
}

/**
 * 辅助格式化器
 */
const formatters = {
  numeric(rawValueString: string | string[]) {
    const str = Array.isArray(rawValueString) ? rawValueString[0] : rawValueString;
    const parsed = parseNumericValue(str);
    if (!parsed) return str;
    if (parsed.maxValue !== null && parsed.maxValue > 0) return `${parsed.value}/${parsed.maxValue}`;
    
    // 尝试提取单位
    const unitMatch = String(str).match(/^(-?\d+(?:\d+)?)\s*(\D.*)$/);
    if (unitMatch) return `${parsed.value}${unitMatch[2]}`;
    return String(parsed.value);
  },
  array(value: any, category: string) {
    if (!Array.isArray(value)) return String(value);
    if (SINGLE_STRUCTURE_CATEGORIES.has(category)) {
      return value.flat().join('、');
    } else {
      return value.map(item => (Array.isArray(item) ? `(${item.join('，')})` : item)).join('、');
    }
  },
  default(value: any) {
    return Array.isArray(value) ? value.flat().join('，') : String(value);
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
  detectedEvents: SnapshotEvent[]
) {
  const determineDataType = (itemValue: any): 'numeric' | 'text' | 'array' => {
    if (!itemValue) return 'text';
    const rawValueString = Array.isArray(itemValue) ? itemValue[0] : itemValue;
    // 如果是数组且有多项，或者是特定分类，视为数组
    if (Array.isArray(itemValue) && itemValue.length > 1) return 'array';
    if (SINGLE_STRUCTURE_CATEGORIES.has(category)) return 'array';

    const strVal = Array.isArray(rawValueString) ? rawValueString.join('@') : String(rawValueString);
    if (parseNumericValue(strVal)) {
      return 'numeric';
    }
    return 'text';
  };

  // 1. 新增条目
  if (!oldItem && newItem) {
    const dataType = determineDataType(newItem.values);
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
      const change = newItem.values[1] || null;
      const reason = newItem.values[2] || null;
      if (change) event.details!.change = parseFloat(change.replace(/[±+]/, ''));
      if (reason) event.details!.reason = reason;
    }
    detectedEvents.push(event);
    return;
  }

  // 2. 删除条目
  if (oldItem && !newItem) {
    const dataType = determineDataType(oldItem.values);
    detectedEvents.push({
      source: 'ai', // 假设删除主要由 AI 触发，除非我们在 UI 中实现了删除
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
  let newRawValue = newItem.values?.[0];
  let oldRawValue = oldItem.values?.[0];

  // 尝试数值解析
  const newParsed = parseNumericValue(newRawValue);
  const oldParsed = parseNumericValue(oldRawValue);

  if (newParsed && oldParsed) {
    const newValue = newParsed.value;
    const oldValue = oldParsed.value;
    
    if (newValue === oldValue) return; // 数值没变，可能是后面备注变了，暂时忽略

    let changeRatio =
      oldValue === 0 ? (newValue !== 0 ? 1.0 : 0) : Math.abs(newValue - oldValue) / Math.abs(oldValue);
    const maxValue = newParsed.maxValue ?? oldParsed.maxValue;
    if (maxValue !== null && maxValue > 0) changeRatio = Math.abs(newValue - oldValue) / maxValue;

    let changeType = changeRatio >= NUMERIC_RELATIVE_THRESHOLD ? 'numeric_dramatic' : 'numeric_subtle';
    changeType += newValue > oldValue ? '_increase' : '_decrease';

    const reason = newItem.values[2] || null;
    const details: any = { from: oldValue, to: newValue, change: newValue - oldValue, ratio: changeRatio };
    if (reason) details.reason = reason;

    detectedEvents.push({
      source,
      character,
      category,
      key,
      change_type: changeType,
      data_type: 'numeric',
      previous: oldItem.values,
      current: newItem.values,
      details,
    });
    return;
  }

  // 尝试数组分析 (如果是数组类型)
  // 如果 category 是 WP (World Plot) 或 CR (Inventory)，通常作为数组处理
  if (determineDataType(newItem.values) === 'array') {
    const newList = newItem.values.flat();
    const oldList = oldItem.values.flat();
    const added = _.difference(newList, oldList);
    const removed = _.difference(oldList, newList);

    if (added.length > 0 || removed.length > 0) {
      let changeType =
        added.length > 0 && removed.length > 0
          ? 'array_items_replaced'
          : added.length > 0
            ? 'array_items_added'
            : 'array_items_removed';
      
      detectedEvents.push({
        source,
        character,
        category,
        key,
        change_type: changeType,
        data_type: 'array',
        previous: oldItem.values,
        current: newItem.values,
        details: { added, removed },
      });
      return;
    }
  }

  // 默认：文本变化
  if (newRawValue !== oldRawValue) {
    detectedEvents.push({
      source,
      character,
      category,
      key,
      change_type: 'text_change',
      data_type: 'text',
      previous: oldItem.values,
      current: newItem.values,
      details: { from: oldRawValue, to: newRawValue, value: newRawValue },
    });
  }
}

/**
 * 核心函数：检测变化
 */
export function detectChanges(oldData: StatusBarData, newData: StatusBarData): SnapshotEvent[] {
  const detectedEvents: SnapshotEvent[] = [];

  // 1. 处理共享数据
  const allSharedCats = new Set([...Object.keys(oldData.shared || {}), ...Object.keys(newData.shared || {})]);
  allSharedCats.forEach(cat => {
    const oldItems = oldData.shared?.[cat] || [];
    const newItems = newData.shared?.[cat] || [];
    const allKeys = new Set([...oldItems.map(i => i.key), ...newItems.map(i => i.key)]);
    
    allKeys.forEach(key => {
      const oldItem = oldItems.find(i => i.key === key);
      const newItem = newItems.find(i => i.key === key);
      processItemChange(oldItem, newItem, null, cat, key, detectedEvents);
    });
  });

  // 2. 处理角色数据 (v6.3 重构: 基于 Meta 判定进退场)
  const allCharIds = new Set([
      ...Object.keys(oldData.id_map || {}), 
      ...Object.keys(newData.id_map || {})
  ]);

  allCharIds.forEach(charId => {
    const oldMeta = oldData.character_meta?.[charId];
    const newMeta = newData.character_meta?.[charId];
    
    // Default isPresent is TRUE unless explicitly false
    const oldPresent = oldMeta?.isPresent !== false;
    const newPresent = newMeta?.isPresent !== false;

    // 简单获取显示名 (ID fallback)
    const charName = newData.id_map[charId] || oldData.id_map[charId] || charId;

    // 进场检测
    if (!oldPresent && newPresent) {
      detectedEvents.push({
        source: 'ai',
        character: charName,
        category: 'meta',
        key: 'presence',
        change_type: 'character_enters',
        data_type: 'text',
        previous: false,
        current: true,
        details: { message: `${charName} enters.` }
      });
    } 
    // 退场检测
    else if (oldPresent && !newPresent) {
      detectedEvents.push({
        source: 'ai',
        character: charName,
        category: 'meta',
        key: 'presence',
        change_type: 'character_leaves',
        data_type: 'text',
        previous: true,
        current: false,
        details: { message: `${charName} leaves.` }
      });
    }

    // 处理数据变更 (只在角色存在或刚离开时处理? 或者总是处理? 总是处理比较安全)
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
        processItemChange(oldItem, newItem, charName, cat, key, detectedEvents);
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
    const fromStr = formatters.numeric(String(from));
    const toStr = formatters.numeric(String(to));
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
  let rawString: any;

  switch (placeholder) {
    case 'value':
      sourceData = current;
      rawString = current;
      break;
    case 'previousValue':
      sourceData = previous;
      rawString = previous;
      break;
    case 'addedItems':
      sourceData = details?.added;
      break;
    case 'removedItems':
      sourceData = details?.removed;
      break;
    default:
      return `{${placeholder}}`;
  }

  if (sourceData === undefined || sourceData === null) return '';

  switch (data_type) {
    case 'numeric':
      return formatters.numeric(String(Array.isArray(rawString) ? rawString[0] : rawString));
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
