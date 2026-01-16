/**
 * TavernHelper Remastered Core Types
 */

// 1. 状态栏分类键值
export type StatusBarCategoryKey = 
  | 'ST' // 场景与时间
  | 'CP' // 角色档案
  | 'CR' // 资源与装备
  | 'CV' // 状态值
  | 'CS' // 特定状态描述
  | 'RP' // 角色关系参数
  | 'AE' // 行为与事件计数
  | 'WP' // 世界与剧情动态
  | 'MI' // 元信息
  | 'Other';

// 2. 状态栏单个数据条目 (解析后)
export interface StatusBarItem {
  key: string;
  values: string[]; // 可能是 ["100"], ["100", "+10"], ["Item1", "Item2"] 等
  source_id: number; // 来源消息ID
  user_modified: boolean; // 是否被用户锁定
  originalLine?: string; // 原始文本行，用于调试或回写
  category: StatusBarCategoryKey;
}

// 3. 角色数据容器
export interface CharacterData {
  [category: string]: StatusBarItem[]; // 动态键，通常是 CategoryKey
}

// 4. 全局状态栏数据结构 (权威数据源 SST)
export interface StatusBarData {
  shared: {
    [category: string]: StatusBarItem[];
  };
  characters: {
    [characterName: string]: CharacterData;
  };
  _meta?: {
    message_count?: number;
    last_updated?: string;
  };
}

// 5. 世界书条目 (SillyTavern Lorebook Entry 模拟)
export interface LorebookEntry {
  uid: number;
  key: string[];
  keysecondary: string[];
  comment: string; // 显示名称
  content: string;
  enabled: boolean;
  position: number; // Order/DisplayIndex
  
  // 策略相关 (简化)
  constant?: boolean;
  selective?: boolean;
  probability?: number;
}

// 6. UI 配置选项
export interface AppOptions {
  darkMode: boolean;
  defaultExpanded: boolean;
  worldSnapshotEnabled: boolean;
}

// 7. 合并结果 (v4.3 新增)
export interface MergeResult {
  data: StatusBarData;
  warnings: string[];
  logs: string[];
}

// 8. 快照事件 (v4.3 Narrative Engine)
export interface SnapshotEvent {
  source: 'user' | 'ai';
  character: string | null; // null for shared
  category: string;
  key: string;
  change_type: string; // e.g. 'numeric_dramatic_decrease', 'item_added'
  data_type: 'numeric' | 'text' | 'array';
  previous: any;
  current: any;
  details?: {
    from?: number | string;
    to?: number | string;
    change?: number;
    ratio?: number;
    reason?: string;
    added?: string[];
    removed?: string[];
    value?: any;
    message?: string;
  };
}

// 9. 快照元数据 (v4.3.2)
export interface SnapshotMeta {
  timestamp: string;
  message_count: number;
  description_summary?: string;
}

// 10. 配置预设 (v4.4 Preset Manager)
export interface Preset {
  name: string;
  timestamp: number;
  enabledIds: number[]; // 记录被启用的世界书条目UID
  count: number; // 包含的条目数量快照
}