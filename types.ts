
/**
 * TavernHelper Remastered Core Types
 * v6.0 Refactor: Split Categories & Item Definitions
 */

// 1. 分类定义 (容器)
export interface CategoryDefinition {
  key: string;      // "CP", "CV"
  name: string;     // "角色档案"
  icon: string;     // Lucide icon name
  order: number;    // 排序权重
  layout_mode?: 'list' | 'grid' | 'tags'; // v6.1 布局模式
  grid_columns?: number; // v6.1 网格列数 (1-4)
}

// 2. 条目定义 (具体数据的规则)
export interface ItemDefinition {
  key: string;          // "HP", "Name" (唯一标识符)
  name?: string;        // "生命值" (显示名) - v6.5 新增
  icon?: string;        // 图标 - v6.5 新增
  type: 'text' | 'numeric' | 'array';
  description?: string; // 给 AI 看的描述
  defaultCategory?: string; // 默认归属分类 (UI辅助用)
  separator?: string;   // v6.2 自定义分隔符 (例如 "," 或 ";")，默认为 "|"
}

// 3. 状态栏单个数据条目
export interface StatusBarItem {
  key: string;
  values: string[];
  source_id: number;
  user_modified: boolean;
  originalLine?: string;
  category: string; 
  _uuid?: string; // 此处添加1行
}

// 4. 角色数据容器
export interface CharacterData {
  [category: string]: StatusBarItem[];
}

// 5. 角色 ID 映射表
export interface CharacterMap {
  [id: string]: string; // char_id -> character_name
}

// 6. 全局状态栏数据结构 (权威数据源 SST)
export interface StatusBarData {
  // v6.0: 分类注册表
  categories: {
    [key: string]: CategoryDefinition;
  };
  
  // v6.0: 条目定义注册表 (Key -> Definition)
  item_definitions: {
    [key: string]: ItemDefinition;
  };
  
  id_map: CharacterMap;

  // v6.2: 角色元数据 (IsPresent 等)
  character_meta?: {
    [charId: string]: {
      isPresent: boolean;
    };
  };

  shared: {
    [category: string]: StatusBarItem[];
  };
  
  characters: {
    [charId: string]: CharacterData;
  };
  
  _meta?: {
    message_count?: number;
    last_updated?: string;
    version?: number;
  };
}

// 7. 解析器返回的临时结构
export interface ParsedUpdate {
  shared: { [category: string]: StatusBarItem[] };
  characters: { 
    [charName: string]: { 
       [category: string]: StatusBarItem[] 
    } 
  };
  // v6.3: 元数据更新指令
  meta?: {
    [charName: string]: {
      isPresent?: boolean;
    }
  };
}

// 8. 世界书条目
export interface LorebookEntry {
  uid: number;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  enabled: boolean;
  position: number;
  constant?: boolean;
  selective?: boolean;
  probability?: number;
}

// 9. 合并结果
export interface MergeResult {
  data: StatusBarData;
  warnings: string[];
  logs: string[];
}

// 10. 快照事件
export interface SnapshotEvent {
  source: 'user' | 'ai';
  character: string | null;
  category: string;
  key: string;
  change_type: string;
  data_type: 'numeric' | 'text' | 'array';
  previous: any;
  current: any;
  details?: any;
}

// 11. 快照元数据
export interface SnapshotMeta {
  timestamp: string;
  message_count: number;
  description_summary?: string;
}

// 12. 配置预设
export interface Preset {
  name: string;
  timestamp: number;
  enabledIds: number[];
  count: number;
}

export interface AppOptions {
  darkMode: boolean;
  defaultExpanded: boolean;
  worldSnapshotEnabled: boolean;
}