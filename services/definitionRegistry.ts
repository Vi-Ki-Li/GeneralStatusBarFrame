import { CategoryDefinition, ItemDefinition, StatusBarData } from '../types';

/**
 * 默认分类列表
 */
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { key: 'ST', name: '场景与时间', icon: 'Clock', order: 0, scope: 'shared', layout_mode: 'tags' }, 
  { key: 'CP', name: '角色档案', icon: 'Contact', order: 1, scope: 'character', layout_mode: 'grid', grid_columns: 2 }, 
  { key: 'CV', name: '角色状态值', icon: 'Activity', order: 2, scope: 'character', layout_mode: 'list' }, 
  { key: 'CR', name: '资源与装备', icon: 'Coins', order: 3, scope: 'character', layout_mode: 'list' }, 
  { key: 'RP', name: '角色关系', icon: 'HeartHandshake', order: 4, scope: 'character', layout_mode: 'list' }, 
  { key: 'CS', name: '状态描述', icon: 'Tag', order: 5, scope: 'character', layout_mode: 'grid', grid_columns: 2 }, 
  { key: 'AE', name: '行为事件', icon: 'ListTodo', order: 6, scope: 'character', layout_mode: 'grid', grid_columns: 2 }, 
  { key: 'WP', name: '世界剧情', icon: 'Globe', order: 7, scope: 'shared', layout_mode: 'grid', grid_columns: 2 }, 
  { key: 'MI', name: '元信息', icon: 'BrainCircuit', order: 8, scope: 'shared', layout_mode: 'list' }, 
  { key: 'Meta', name: '系统控制', icon: 'Cpu', order: 90, scope: 'character' }, 
  { key: 'Other', name: '其他', icon: 'MoreHorizontal', order: 99, scope: 'character' }, 
];

/**
 * 默认条目定义 (基于提供的世界书 JSON，但结构已扁平化)
 */
export const DEFAULT_ITEM_DEFINITIONS: ItemDefinition[] = [
  // --- ST: 场景与时间 ---
  { key: '时间', name: '时间', type: 'text', defaultCategory: 'ST', separator: '@', icon: 'Clock' },
  { key: '当前地点', name: '当前地点', type: 'text', defaultCategory: 'ST', icon: 'MapPin' },
  { key: '天气', name: '天气', type: 'text', defaultCategory: 'ST', icon: 'CloudSun' },

  // --- CP: 角色档案 ---
  { key: '名字', name: '名字', type: 'text', defaultCategory: 'CP', icon: 'User' },
  { key: '年龄', name: '年龄', type: 'text', defaultCategory: 'CP', icon: 'Calendar' },
  { key: '身高', name: '身高', type: 'text', defaultCategory: 'CP', icon: 'Ruler' },
  { key: '特征', name: '特征', type: 'array', defaultCategory: 'CP', separator: '@', icon: 'Sparkles', structure: { parts: [{ key: 'trait', label: '特征'}] } },
  { key: '永久性状态', name: '永久性状态', type: 'array', defaultCategory: 'CP', separator: '@', icon: 'AlertOctagon', structure: { parts: [{ key: 'state', label: '状态'}] } },
  { key: '身体外观', name: '身体外观', type: 'text', defaultCategory: 'CP', icon: 'Shirt' },
  { key: '种族', name: '种族', type: 'text', defaultCategory: 'CP', icon: 'Dna' }, 
  { key: '职业', name: '职业', type: 'text', defaultCategory: 'CP', icon: 'Briefcase' }, 

  // --- CR: 资源 ---
  { 
    key: '现金', name: '现金', type: 'numeric', defaultCategory: 'CR', icon: 'Coins',
    separator: '|', structure: { parts: [
        { key: 'current', label: '金额' }, 
        { key: 'change', label: '变化' }, 
        { key: 'reason', label: '原因' }
    ] }
  },
  { 
    key: '道具物品', name: '道具物品', type: 'array', defaultCategory: 'CR', icon: 'Backpack',
    separator: '@', structure: { parts: [{ key: 'item', label: '物品' }] }
  },
  {
    key: '技能', name: '技能', type: 'list-of-objects', defaultCategory: 'CR', icon: 'Swords',
    separator: '|', partSeparator: '@',
    structure: {
      parts: [
        { key: 'name', label: '技能名' },
        { key: 'level', label: '等级' }
      ]
    }
  },

  // --- CV: 状态值 (核心扁平化结构: current|max|change|reason|description) ---
  { 
    key: '体力', name: '体力', type: 'numeric', defaultCategory: 'CV', icon: 'Heart',
    separator: '|', structure: { parts: [
        { key: 'current', label: '当前' }, { key: 'max', label: '最大' }, 
        { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, 
        { key: 'description', label: '描述' }
    ] }
  },
  { 
    key: '疼痛', name: '疼痛', type: 'numeric', defaultCategory: 'CV', icon: 'Activity',
    separator: '|', structure: { parts: [
        { key: 'current', label: '当前' }, { key: 'max', label: '最大' }, 
        { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, 
        { key: 'description', label: '描述' }
    ] }
  },
  { 
    key: '创伤', name: '创伤', type: 'numeric', defaultCategory: 'CV', icon: 'Bandage',
    separator: '|', structure: { parts: [
        { key: 'current', label: '当前' }, { key: 'max', label: '最大' }, 
        { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, 
        { key: 'description', label: '描述' }
    ] }
  },
  { 
    key: '饥饿', name: '饥饿', type: 'numeric', defaultCategory: 'CV', icon: 'Utensils',
    separator: '|', structure: { parts: [
        { key: 'current', label: '当前' }, { key: 'max', label: '最大' }, 
        { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, 
        { key: 'description', label: '描述' }
    ] }
  },
  { 
    key: '口渴', name: '口渴', type: 'numeric', defaultCategory: 'CV', icon: 'Droplets',
    separator: '|', structure: { parts: [
        { key: 'current', label: '当前' }, { key: 'max', label: '最大' }, 
        { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, 
        { key: 'description', label: '描述' }
    ] }
  },
  { 
    key: '理智值', name: '理智值', type: 'numeric', defaultCategory: 'CV', icon: 'Brain',
    separator: '|', structure: { parts: [
        { key: 'current', label: '当前' }, { key: 'max', label: '最大' }, 
        { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, 
        { key: 'description', label: '描述' }
    ] }
  },
  { 
    key: '魔力/能量值', name: '魔力/能量', type: 'numeric', defaultCategory: 'CV', icon: 'Zap',
    separator: '|', structure: { parts: [
        { key: 'current', label: '当前' }, { key: 'max', label: '最大' }, 
        { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, 
        { key: 'description', label: '描述' }
    ] }
  },

  // --- RP: 关系 (结构同上) ---
  { key: '好感度', name: '好感度', type: 'numeric', defaultCategory: 'RP', icon: 'Heart', separator: '|', structure: { parts: [{ key: 'current', label: '当前' }, { key: 'max', label: '最大' }, { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, { key: 'description', label: '描述' }] } },
  { key: '信任度', name: '信任度', type: 'numeric', defaultCategory: 'RP', icon: 'ShieldCheck', separator: '|', structure: { parts: [{ key: 'current', label: '当前' }, { key: 'max', label: '最大' }, { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, { key: 'description', label: '描述' }] } },
  { key: '堕落度', name: '堕落度', type: 'numeric', defaultCategory: 'RP', icon: 'Skull', separator: '|', structure: { parts: [{ key: 'current', label: '当前' }, { key: 'max', label: '最大' }, { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, { key: 'description', label: '描述' }] } },
  { key: '支配度', name: '支配度', type: 'numeric', defaultCategory: 'RP', icon: 'Gavel', separator: '|', structure: { parts: [{ key: 'current', label: '当前' }, { key: 'max', label: '最大' }, { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, { key: 'description', label: '描述' }] } },
  { key: '依赖度', name: '依赖度', type: 'numeric', defaultCategory: 'RP', icon: 'Link', separator: '|', structure: { parts: [{ key: 'current', label: '当前' }, { key: 'max', label: '最大' }, { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, { key: 'description', label: '描述' }] } },
  { key: '羞耻度', name: '羞耻度', type: 'numeric', defaultCategory: 'RP', icon: 'EyeOff', separator: '|', structure: { parts: [{ key: 'current', label: '当前' }, { key: 'max', label: '最大' }, { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, { key: 'description', label: '描述' }] } },
  { key: '服从度', name: '服从度', type: 'numeric', defaultCategory: 'RP', icon: 'Dog', separator: '|', structure: { parts: [{ key: 'current', label: '当前' }, { key: 'max', label: '最大' }, { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, { key: 'description', label: '描述' }] } },
  { key: '声誉', name: '声誉', type: 'numeric', defaultCategory: 'RP', icon: 'Star', separator: '|', structure: { parts: [{ key: 'current', label: '当前' }, { key: 'max', label: '最大' }, { key: 'change', label: '变化' }, { key: 'reason', label: '原因' }, { key: 'description', label: '描述' }] } },

  // --- CS: 状态描述 ---
  { key: '角色状态', name: '角色状态', type: 'text', defaultCategory: 'CS', icon: 'UserCheck' },
  { key: '角色想法', name: '角色想法', type: 'text', defaultCategory: 'CS', icon: 'MessageSquare' },
  { key: '精神状态', name: '精神状态', type: 'text', defaultCategory: 'CS', icon: 'Smile' },
  { key: '想法', name: '想法', type: 'text', defaultCategory: 'CS', icon: 'MessageCircle' }, // 别名

  // --- AE: 统计 ---
  { key: '训练次数', name: '训练次数', type: 'numeric', defaultCategory: 'AE', icon: 'Dumbbell' },
  { key: '表白次数', name: '表白次数', type: 'numeric', defaultCategory: 'AE', icon: 'Heart' },
  { key: '被表白次数', name: '被表白次数', type: 'numeric', defaultCategory: 'AE', icon: 'Gift' },

  // --- WP: 世界剧情 (列表类) ---
  { key: '当前npc', name: '当前NPC', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'Users', structure: { parts: [{ key: 'npc_info', label: 'NPC信息'}] } },
  { key: '剧情发展', name: '剧情发展', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'TrendingUp', structure: { parts: [{ key: 'option', label: '选项' }] } },
  { key: '即将发生的事件', name: '即将发生', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'CalendarClock' },
  { key: '当前主线剧情事件', name: '主线剧情', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'BookOpen' },
  { key: '剧情发展信息', name: '剧情信息', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'Info' },
  { key: '世界新闻', name: '世界新闻', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'Newspaper' },
  { key: '周边事件', name: '周边事件', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'MapPin' },
  { key: '可移动地点', name: '可移动地点', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'Navigation' },
  { key: '可互动对象', name: '可互动对象', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'HandMetal' },
  { key: '阵营声望', name: '阵营声望', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'Flag' },
  { key: '当前任务', name: '当前任务', type: 'array', defaultCategory: 'WP', separator: '|', icon: 'CheckSquare' },

  // --- MI: 元信息 ---
  { key: '吐槽', name: '吐槽', type: 'text', defaultCategory: 'MI', icon: 'MessageCircle' },

  // --- Meta ---
  { key: 'Present', name: '在场状态', type: 'text', defaultCategory: 'Meta', description: 'true/false' },
  { key: 'Visible', name: '可见性', type: 'text', defaultCategory: 'Meta', description: 'true/false' }
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

export function getCategoryDefinition(
  categories: { [key: string]: CategoryDefinition } | undefined, 
  key: string
): CategoryDefinition {
  if (categories && categories[key]) return categories[key];
  const defaultDef = DEFAULT_CATEGORIES.find(d => d.key === key);
  if (defaultDef) return defaultDef;
  return { key, name: key, icon: 'CircleHelp', order: 100 };
}

export function getItemDefinition(
  definitions: { [key: string]: ItemDefinition } | undefined,
  key: string
): ItemDefinition {
  if (definitions && definitions[key]) return definitions[key];
  // 智能匹配：如果没找到精确 Key，尝试匹配别名或默认策略
  return {
    key,
    type: 'text',
    defaultCategory: 'Other',
    description: ''
  };
}