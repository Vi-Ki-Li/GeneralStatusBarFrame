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
  private lorebook: LorebookEntry[] = []; 
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