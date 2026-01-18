import { LorebookEntry, StatusBarData } from '../types';
import { getDefaultCategoriesMap, getDefaultItemDefinitionsMap } from './definitionRegistry';

// 初始 v6.1 数据 (Rich Mock Data)
const MOCK_DATA_V6: StatusBarData = {
  categories: getDefaultCategoriesMap(),
  item_definitions: getDefaultItemDefinitionsMap(),
  id_map: {
    'char_user': 'User',
    'char_eria': 'Eria',
    'char_luna': 'Luna'
  },
  shared: {
    'ST': [
      { key: '时间', values: ['清晨 8:00'], category: 'ST', source_id: 10, user_modified: false },
      { key: '天气', values: ['晴朗', '微风'], category: 'ST', source_id: 10, user_modified: false },
      { key: '地点', values: ['银月城', '中心广场'], category: 'ST', source_id: 10, user_modified: false }
    ],
    'WP': [
      { key: '世界新闻', values: ['王国庆典筹备中'], category: 'WP', source_id: 10, user_modified: false },
      { key: '悬赏', values: ['哥布林王 (500G)'], category: 'WP', source_id: 10, user_modified: false }
    ],
    'MI': [
      { key: '打破第四面墙', values: ['观众看得开心吗？'], category: 'MI', source_id: 10, user_modified: false }
    ]
  },
  characters: {
    'char_user': {
      'CP': [
        { key: '名字', values: ['旅行者'], category: 'CP', source_id: 10, user_modified: false },
        { key: '职业', values: ['冒险家'], category: 'CP', source_id: 10, user_modified: false }
      ],
      'CV': [
        { key: 'HP', values: ['90@100'], category: 'CV', source_id: 10, user_modified: false }
      ]
    },
    'char_eria': {
      'CP': [
        { key: '名字', values: ['Eria'], category: 'CP', source_id: 10, user_modified: false },
        { key: '种族', values: ['精灵'], category: 'CP', source_id: 10, user_modified: false }
      ],
      'CV': [
        { key: 'HP', values: ['80@100', '-5', '中毒'], category: 'CV', source_id: 10, user_modified: false },
        { key: 'MP', values: ['150@200'], category: 'CV', source_id: 10, user_modified: false },
      ],
      'CR': [
        { key: 'Inventory', values: ['铁剑', '皮甲', '治疗药水x3'], category: 'CR', source_id: 10, user_modified: false },
        { key: '金币', values: ['1250'], category: 'CR', source_id: 10, user_modified: false }
      ],
      'CS': [
        { key: '状态', values: ['轻微中毒', '警惕'], category: 'CS', source_id: 10, user_modified: false }
      ]
    },
    'char_luna': {
      'CP': [
        { key: '名字', values: ['Luna'], category: 'CP', source_id: 10, user_modified: false }
      ],
      'CV': [
        { key: 'HP', values: ['120@120'], category: 'CV', source_id: 10, user_modified: false }
      ]
    }
  },
  _meta: {
    message_count: 10,
    version: 6
  }
};

type EntriesListener = (entries: LorebookEntry[]) => void;

class MockTavernService {
  private lorebook: LorebookEntry[] = [ // 此处开始添加22行
    { uid: 101, key: [], keysecondary: [], comment: '样式-暗黑主题', content: `
:root {
  --color-primary: #f43f5e; /* Rose 500 */
  --color-accent: #38bdf8; /* Sky 400 */
}
.glass-panel {
  border-radius: 8px;
}
`, enabled: true, position: 1 },
    { uid: 201, key: [], keysecondary: [], comment: '[CP|种族]', content: '简述角色种族', enabled: true, position: 2 },
    { uid: 202, key: [], keysecondary: [], comment: '[CR|金币]', content: '简述角色所持金币数量', enabled: true, position: 3 },
    { uid: 203, key: [], keysecondary: [], comment: '[CS|状态]', content: '简述角色状态', enabled: false, position: 4 },
    { uid: 204, key: [], keysecondary: [], comment: '[CP|职业]', content: '简述角色职业', enabled: true, position: 5 },
    { uid: 301, key: [], keysecondary: [], comment: '设置-自动保存', content: 'true', enabled: true, position: 6 },
    { 
      uid: 1001, key: ["HP"], keysecondary: [], 
      comment: "[CV|HP]", 
      content: "角色的生命值。格式: [角色^CV|HP::当前值@最大值]", 
      enabled: true, position: 10 
    },
    { 
      uid: 1002, key: ["MP"], keysecondary: [], 
      comment: "[CV|MP]", 
      content: "角色的魔法值。格式: [角色^CV|MP::当前值@最大值]", 
      enabled: true, position: 11 
    },
     { 
      uid: 1003, key: ["Inventory"], keysecondary: [], 
      comment: "[CR|Inventory]", 
      content: "角色的背包。格式: [角色^CR|Inventory::物品1|物品2]", 
      enabled: false, position: 12
    }
  ]; // 此处完成添加
  private variables: { statusBarCharacterData?: StatusBarData } = {
    statusBarCharacterData: JSON.parse(JSON.stringify(MOCK_DATA_V6))
  };
  private listeners: EntriesListener[] = [];

  subscribe(listener: EntriesListener): () => void {
    this.listeners.push(listener);
    listener(this.lorebook);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.lorebook));
  }

  async getLorebookEntries(): Promise<LorebookEntry[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.lorebook), 300);
    });
  }

  async setLorebookEntries(entries: LorebookEntry[]): Promise<void> {
    this.lorebook = entries;
    this.notifyListeners();
    return Promise.resolve();
  }

  getVariables(): any {
    return this.variables;
  }

  async saveVariables(newVariables: any): Promise<void> {
    this.variables = { ...this.variables, ...newVariables };
    return Promise.resolve();
  }

  async updateWorldbookEntry(bookName: string, entryName: string, content: string): Promise<void> {
    console.log(`[MockService] Update Worldbook: ${entryName}`);
    return Promise.resolve();
  }
}

export const tavernService = new MockTavernService();