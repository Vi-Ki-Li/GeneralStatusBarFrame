
import { CategoryDefinition, ItemDefinition, StatusBarData } from '../types';

/**
 * 默认分类列表
 */
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { key: 'ST', name: '场景与时间', icon: 'Clock', order: 0 },
  { key: 'CP', name: '角色档案', icon: 'Contact', order: 1 },
  { key: 'CR', name: '资源与装备', icon: 'Coins', order: 2 },
  { key: 'CV', name: '角色状态值', icon: 'Activity', order: 3 },
  { key: 'RP', name: '角色关系', icon: 'HeartHandshake', order: 4 },
  { key: 'CS', name: '状态描述', icon: 'Tag', order: 5 },
  { key: 'AE', name: '行为事件', icon: 'ListTodo', order: 6 },
  { key: 'WP', name: '世界剧情', icon: 'Globe', order: 7 },
  { key: 'MI', name: '元信息', icon: 'BrainCircuit', order: 8 },
  { key: 'Meta', name: '系统控制', icon: 'Cpu', order: 90 }, // New Meta Category
  { key: 'Other', name: '其他', icon: 'MoreHorizontal', order: 99 },
];

/**
 * 默认条目定义 (示例)
 */
export const DEFAULT_ITEM_DEFINITIONS: ItemDefinition[] = [
  { key: 'HP', type: 'numeric', defaultCategory: 'CV', description: '角色的生命值' },
  { key: 'MP', type: 'numeric', defaultCategory: 'CV', description: '角色的魔法值' },
  { key: 'Name', type: 'text', defaultCategory: 'CP', description: '角色全名' },
  { key: 'Inventory', type: 'array', defaultCategory: 'CR', description: '背包物品列表' },
  
  // Meta Definitions
  { 
      key: 'Present', 
      type: 'text', 
      defaultCategory: 'Meta', 
      description: '[系统核心] 控制角色显隐。填写 true/on 显示，false/off 隐藏。' 
  },
  { 
      key: 'Visible', 
      type: 'text', 
      defaultCategory: 'Meta', 
      description: '[别名] 同 Present。控制角色可见性。' 
  }
];

export function getDefaultCategoriesMap(): { [key: string]: CategoryDefinition } {
  const map: { [key: string]: CategoryDefinition } = {};
  DEFAULT_CATEGORIES.forEach(def => {
    map[def.key] = def;
  });
  return map;
}

export function getDefaultItemDefinitionsMap(): { [key: string]: ItemDefinition } {
  const map: { [key: string]: ItemDefinition } = {};
  DEFAULT_ITEM_DEFINITIONS.forEach(def => {
    map[def.key] = def;
  });
  return map;
}

/**
 * 获取分类定义
 */
export function getCategoryDefinition(
  categories: { [key: string]: CategoryDefinition } | undefined, 
  key: string
): CategoryDefinition {
  if (categories && categories[key]) {
    return categories[key];
  }
  
  // Fallback
  const defaultDef = DEFAULT_CATEGORIES.find(d => d.key === key);
  if (defaultDef) return defaultDef;

  return {
    key,
    name: key,
    icon: 'CircleHelp',
    order: 100
  };
}

/**
 * 获取条目定义 (决定渲染方式)
 */
export function getItemDefinition(
  definitions: { [key: string]: ItemDefinition } | undefined,
  key: string
): ItemDefinition {
  if (definitions && definitions[key]) {
    return definitions[key];
  }

  // 默认回退策略: 默认为文本
  return {
    key,
    type: 'text',
    defaultCategory: 'Other',
    description: ''
  };
}
