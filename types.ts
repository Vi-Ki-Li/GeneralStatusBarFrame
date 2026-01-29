
import React from 'react';


/**
 * TavernHelper Remastered Core Types
 * v6.0 Refactor: Split Categories & Item Definitions
 */
import { LayoutNode } from './types/layout'; // Fixed import path

// 1. 分类定义 (容器)
export interface CategoryDefinition {
  key: string;      // "CP", "CV"
  name: string;     // "角色档案"
  icon: string;     // Lucide icon name
  order: number;    // 排序权重
  scope?: 'shared' | 'character'; 
  layout_mode?: 'list' | 'grid' | 'tags'; // v6.1 布局模式
  grid_columns?: number; // v6.1 网格列数 (1-4)
}

// 2. 条目定义 (具体数据的规则)
export interface ItemDefinitionPart {
  key: string;
  label: string;
}

export interface ItemDefinition {
  key: string;          // "HP", "Name" (唯一标识符)
  name?: string;        // "生命值" (显示名) - v6.5 新增
  icon?: string;        // 图标 - v6.5 新增
  type: 'text' | 'numeric' | 'array' | 'list-of-objects';
  description?: string; // 给 AI 看的描述
  defaultCategory?: string; // 默认归属分类 (UI辅助用)
  separator?: string;   // v6.2: 对于 'array' 是值分隔符, 对于 'list-of-objects' 是对象分隔符
  partSeparator?: string; // v7.1: 'list-of-objects' 内部的对象属性分隔符 (e.g., '@')
  structure?: {         // v6.6 结构定义 (Definition-Driven Core)
    parts: ItemDefinitionPart[];    // e.g. [{key: 'current', label: '当前'}, {key: 'max', label: '最大'}]
  };
  styleId?: string; // v7.0: 关联的样式定义ID
}

// 3. 状态栏单个数据条目
export interface StatusBarItem {
  key: string;
  values: string[] | Array<Record<string, string>>;
  source_id: number;
  user_modified: boolean;
  originalLine?: string;
  category: string; 
  _uuid: string; // v6.7: UUID is now required for robust drag-and-drop
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
  
  // v9.7: 布局数据 (Grid-Stack)
  layout?: LayoutNode[]; // 此处添加1行
  
  _meta?: {
    message_count?: number;
    last_updated?: string;
    version?: number;
    activePresetIds?: string[]; // v8.0: 主题应用器
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

// 12. 配置预设 (v8.0 Refactor)
export interface Preset {
  id: string; // Unique ID for the preset
  name: string;
  timestamp: number;
  itemKeys: string[]; // Array of ItemDefinition keys included in this preset
  styleOverrides: {
    [itemKey: string]: string; // Key: ItemDefinition.key, Value: StyleDefinition.id
  };
  layout?: LayoutNode[]; // v9.8: Layout Snapshot
  narrativeConfigId?: string; // v10.2: 绑定的叙事风格ID
}

export interface AppOptions {
  darkMode: boolean;
  defaultExpanded: boolean;
  worldSnapshotEnabled: boolean;
}

// 13. 样式定义 (Style Definition) - v7.0 Refactor
export interface StyleDefinition {
  id: string; // Unique ID, e.g., UUID
  name: string; // "红色血条"
  dataType: 'numeric' | 'array' | 'list-of-objects' | 'text' | 'theme';
  css: string;
  html?: string; // Optional custom HTML structure, only for component types
  mockDataKey?: string; // Key from item_definitions to use for previewing
  guiConfig?: {
    [selector: string]: React.CSSProperties;
  };
}
