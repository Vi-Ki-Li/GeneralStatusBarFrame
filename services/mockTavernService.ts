import { LorebookEntry, StatusBarData } from '../types';

/**
 * 模拟 SillyTavern 的后端服务
 * 在真实环境中，这里会调用 window.parent 或 fetch API
 */

// 预置：赛博朋克样式代码 (双模自适应版)
const CYBERPUNK_CSS = `/* 样式-赛博朋克 (自适应双模版) */

/* === 基础变量 (亮色模式 - High Tech White) === */
:root {
  /* 科技蓝/紫配色 */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-secondary: #7c3aed;
  --color-accent: #06b6d4;
  
  --bg-app: #f0f4f8;
  --bg-gradient: 
    linear-gradient(90deg, rgba(37, 99, 235, 0.05) 1px, transparent 1px),
    linear-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px);
  
  --glass-bg: rgba(255, 255, 255, 0.9);
  --glass-border: rgba(37, 99, 235, 0.2);
  --glass-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  
  --chip-bg: rgba(37, 99, 235, 0.1);
  --chip-border: rgba(37, 99, 235, 0.2);
  
  --font-family: 'Courier New', monospace;
}

/* === 深色模式 (Dark Mode - Neon Night) === */
body.dark-mode {
  /* 经典黑客绿/粉 */
  --color-primary: #00ff9d;
  --color-primary-hover: #00cc7d;
  --color-secondary: #ff00ff;
  --color-accent: #00f3ff;
  
  --bg-app: #050505;
  --bg-gradient: radial-gradient(circle at 50% 50%, #111 0%, #000 100%);
  
  --glass-bg: rgba(10, 10, 10, 0.8);
  --glass-border: rgba(0, 255, 157, 0.4);
  --glass-shadow: 0 0 15px rgba(0, 255, 157, 0.15);
  
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --text-tertiary: #555;
  
  --chip-bg: rgba(0, 255, 157, 0.1);
  --chip-border: rgba(0, 255, 157, 0.3);
}

/* === 通用样式覆盖 === */
body {
  font-family: var(--font-family) !important;
  background-size: 20px 20px; /* 网格大小 */
}

/* 移除圆角，改为硬朗风格 */
.glass-panel, .btn, .status-section, .tag-chip, input, textarea {
  border-radius: 2px !important;
}

/* 按钮特效 */
.btn--primary {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 800;
  border: 1px solid var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary);
}

/* 标题样式 */
.status-section-title {
  text-transform: uppercase;
  letter-spacing: 2px;
  border-bottom: 1px dashed var(--color-primary);
}

.status-label {
  color: var(--color-primary);
  font-weight: bold;
}
`;

// 初始模拟数据 - 扩充以支持测试
const MOCK_LOREBOOK_ENTRIES: LorebookEntry[] = [
  // --- 场景 (ST) ---
  { uid: 1, key: [], keysecondary: [], comment: '时间', content: '简单描述时间，例如:清晨', enabled: true, position: 1 },
  { uid: 2, key: [], keysecondary: [], comment: '天气', content: '简单描述天气，例如：晴朗', enabled: true, position: 2 },
  { uid: 3, key: [], keysecondary: [], comment: '地点', content: '简单描述地点，例如：王都广场', enabled: true, position: 3 },
  { uid: 4, key: [], keysecondary: [], comment: '当前BGM', content: '可选：Market_Day.mp3', enabled: false, position: 4 },

  // --- 角色状态 (CP/CV) ---
  { uid: 10, key: [], keysecondary: [], comment: '名字', content: '{{user}}对该角色当前认知的名字/称呼', enabled: true, position: 10 },
  { uid: 11, key: [], keysecondary: [], comment: '状态', content: '简单描述角色状态，例如：健康', enabled: true, position: 11 },
  { uid: 12, key: [], keysecondary: [], comment: '好感度', content: '量化该角色对{{user}}的好感度，数值限定为-100 - +100', enabled: true, position: 12 },
  { uid: 13, key: [], keysecondary: [], comment: '体力', content: '量化该角色当前体力值，数值限定为0-100', enabled: true, position: 13 },
  { uid: 14, key: [], keysecondary: [], comment: '服装', content: '简单描述该角色当前服装，例如：冒险者常服', enabled: true, position: 14 },

  // --- 世界设定 (WP) ---
  { uid: 20, key: ['news'], keysecondary: [], comment: '世界新闻', content: '简单描述当前3-5个世界新闻', enabled: true, position: 20 },
  { uid: 21, key: ['quest'], keysecondary: [], comment: '当前主线', content: '简单描述当前3-5个可选主线', enabled: true, position: 21 },

  // --- 游戏机制 (Other - 无特殊标签) ---
  { uid: 30, key: ['combat'], keysecondary: [], comment: '战斗系统-核心规则', content: '...', enabled: true, position: 30 },
  { uid: 31, key: ['magic'], keysecondary: [], comment: '战斗系统-魔法列表', content: '...', enabled: false, position: 31 },
  { uid: 32, key: ['items'], keysecondary: [], comment: '物品合成表', content: '...', enabled: false, position: 32 },
  { uid: 33, key: ['romance'], keysecondary: [], comment: '恋爱事件触发器', content: '...', enabled: true, position: 33 },
  { uid: 34, key: ['nsfw'], keysecondary: [], comment: '绅士模式扩展包', content: '...', enabled: false, position: 34 },

  // --- 设置与样式 (Settings/Styles) ---
  { uid: 900, key: [], keysecondary: [], comment: '设置-白天/暗夜模式', content: 'true', enabled: true, position: 999 },
  { uid: 901, key: [], keysecondary: [], comment: '样式-默认主题', content: '/* 默认样式为空，使用 style.css */', enabled: true, position: 1000 },
  { uid: 902, key: [], keysecondary: [], comment: '样式-赛博朋克', content: CYBERPUNK_CSS, enabled: false, position: 1001 }
];

const MOCK_STATUS_BAR_DATA: StatusBarData = {
  shared: {
    ST: [
      { key: '时间', values: ['清晨 8:00'], category: 'ST', source_id: 10, user_modified: false },
      { key: '天气', values: ['晴朗', '微风'], category: 'ST', source_id: 10, user_modified: false }
    ],
    WP: [
      { key: '世界新闻', values: ['王国即将举行庆典'], category: 'WP', source_id: 10, user_modified: false }
    ]
  },
  characters: {
    'User': {
      CP: [
        { key: '名字', values: ['旅行者'], category: 'CP', source_id: 10, user_modified: false }
      ]
    },
    'Eria': {
      CV: [
        { key: '体力', values: ['80@100', '-5', '战斗消耗'], category: 'CV', source_id: 10, user_modified: false },
        { key: '好感度', values: ['50@100'], category: 'CV', source_id: 10, user_modified: false }
      ],
      CR: [
        { key: '装备', values: ['铁剑', '皮甲'], category: 'CR', source_id: 10, user_modified: false }
      ]
    }
  },
  _meta: {
    message_count: 10
  }
};

type EntriesListener = (entries: LorebookEntry[]) => void;

class MockTavernService {
  private lorebook: LorebookEntry[] = [...MOCK_LOREBOOK_ENTRIES];
  private variables: { statusBarCharacterData?: StatusBarData } = {
    statusBarCharacterData: JSON.parse(JSON.stringify(MOCK_STATUS_BAR_DATA)) // Deep copy
  };
  private listeners: EntriesListener[] = [];

  // 订阅变更
  subscribe(listener: EntriesListener): () => void {
    this.listeners.push(listener);
    // 立即回调当前状态
    listener(this.lorebook);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.lorebook));
  }

  // 模拟获取世界书
  async getLorebookEntries(): Promise<LorebookEntry[]> {
    console.log('[MockService] Getting lorebook entries...');
    return new Promise(resolve => {
      setTimeout(() => resolve(this.lorebook), 300); // Simulate network delay
    });
  }

  // 模拟更新世界书
  async setLorebookEntries(entries: LorebookEntry[]): Promise<void> {
    console.log('[MockService] Setting lorebook entries...', entries.length);
    this.lorebook = entries;
    this.notifyListeners(); // 触发通知
    return Promise.resolve();
  }

  // 模拟获取变量
  getVariables(): any {
    return this.variables;
  }

  // 模拟保存变量
  async saveVariables(newVariables: any): Promise<void> {
    console.log('[MockService] Saving variables...', newVariables);
    this.variables = { ...this.variables, ...newVariables };
    return Promise.resolve();
  }

  // 模拟更新特定世界书条目 (用于快照写入)
  async updateWorldbookEntry(bookName: string, entryName: string, content: string): Promise<void> {
    console.log(`%c[MockService] ✍️ Writing Worldbook Snapshot...`, 'color: #10b981; font-weight: bold;');
    console.log(`Target: ${bookName} / ${entryName}`);
    console.log(`Content:\n%c${content}`, 'color: #6366f1; font-style: italic;');
    console.log('------------------------------------------------');
    return Promise.resolve();
  }
}

export const tavernService = new MockTavernService();