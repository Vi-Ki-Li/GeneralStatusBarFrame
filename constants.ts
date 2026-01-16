import { StatusBarCategoryKey } from './types';

export const APP_NAME = "TavernHelper Remastered";

// 分类定义
export interface CategoryDefinition {
  key: StatusBarCategoryKey;
  name: string;
  icon: string; // 这里存储 Lucide icon 的名称字符串，在组件中动态映射
  uiType: 'text' | 'numeric' | 'array'; // 决定渲染和编辑时的 UI 形态
}

export const CATEGORY_MAPPING: Record<StatusBarCategoryKey, CategoryDefinition> = {
  ST: { key: 'ST', name: '场景与时间', icon: 'Clock', uiType: 'text' },
  CP: { key: 'CP', name: '角色档案', icon: 'Contact', uiType: 'text' },
  CR: { key: 'CR', name: '资源与装备', icon: 'Coins', uiType: 'array' },
  CV: { key: 'CV', name: '角色状态值', icon: 'Activity', uiType: 'numeric' },
  CS: { key: 'CS', name: '特定状态描述', icon: 'Tag', uiType: 'text' },
  RP: { key: 'RP', name: '角色关系参数', icon: 'HeartHandshake', uiType: 'numeric' },
  AE: { key: 'AE', name: '行为与事件计数', icon: 'ListTodo', uiType: 'array' },
  WP: { key: 'WP', name: '世界与剧情动态', icon: 'Globe', uiType: 'array' },
  MI: { key: 'MI', name: '元信息', icon: 'BrainCircuit', uiType: 'text' },
  Other: { key: 'Other', name: '其他', icon: 'MoreHorizontal', uiType: 'text' },
};

export const CATEGORY_ORDER: StatusBarCategoryKey[] = [
  'ST', 'CP', 'CR', 'CV', 'RP', 'CS', 'AE', 'WP', 'MI'
];
