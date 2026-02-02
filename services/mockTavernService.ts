
import { LorebookEntry, StatusBarData, ItemDefinition, CategoryDefinition } from '../types';
import { getDefaultCategoriesMap, getDefaultItemDefinitionsMap } from './definitionRegistry';
import { v4 as uuidv4 } from 'uuid';
import { generateLorebookContent, findAndUpdateLorebookEntry } from '../utils/lorebookInjector';

// 构建 Mock 数据 (模拟解析后的状态 - Flat Structure)
const MOCK_DATA_V6: StatusBarData = {
  categories: getDefaultCategoriesMap(),
  item_definitions: getDefaultItemDefinitionsMap(),
  id_map: {
    'char_user': 'User',
    'char_eria': 'Eria'
  },
  shared: {
    'ST': [
      { key: '时间', values: ['2023年10月1日', '周一', '08:00'], category: 'ST', source_id: 10, user_modified: false, _uuid: uuidv4() },
      { key: '当前地点', values: ['银月城酒馆'], category: 'ST', source_id: 10, user_modified: false, _uuid: uuidv4() },
      { key: '天气', values: ['晴朗', '22℃', '微风'], category: 'ST', source_id: 10, user_modified: false, _uuid: uuidv4() }
    ],
    'WP': [
      { key: '剧情发展', values: ['询问酒保关于巨龙的传闻', '查看悬赏栏', '在此休息'], category: 'WP', source_id: 10, user_modified: false, _uuid: uuidv4() },
      { key: '世界新闻', values: ['北方战事吃紧', '魔法学院开始招生'], category: 'WP', source_id: 10, user_modified: false, _uuid: uuidv4() },
      { key: '可移动地点', values: ['市集（步行10分钟）', '城门（马车5分钟）'], category: 'WP', source_id: 10, user_modified: false, _uuid: uuidv4() }
    ],
    'MI': [
      { key: '吐槽', values: ['😂 这酒保怎么长得像策划？'], category: 'MI', source_id: 10, user_modified: false, _uuid: uuidv4() }
    ]
  },
  characters: {
    'char_user': {
      'CP': [
        { key: '名字', values: ['旅行者'], category: 'CP', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '种族', values: ['人类'], category: 'CP', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '职业', values: ['见习冒险者'], category: 'CP', source_id: 10, user_modified: false, _uuid: uuidv4() }
      ],
      'CV': [
        // Flattened: [Current, Max, Change, Reason, Description]
        { key: '体力', values: ['100', '100', '0', '', '健康'], category: 'CV', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '理智值', values: ['90', '100', '-5', '目击诡异', '轻微动摇'], category: 'CV', source_id: 10, user_modified: false, _uuid: uuidv4() }
      ],
      'CR': [
        // Flattened: [Amount, Change, Reason]
        { key: '现金', values: ['500', '0', '初始资金'], category: 'CR', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '道具物品', values: ['生锈的铁剑', '新手地图'], category: 'CR', source_id: 10, user_modified: false, _uuid: uuidv4() }
      ]
    },
    'char_eria': {
      'CP': [
        { key: '名字', values: ['Eria'], category: 'CP', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '年龄', values: ['128岁'], category: 'CP', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '种族', values: ['森林精灵'], category: 'CP', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '特征', values: ['银发', '碧眼', '尖耳'], category: 'CP', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '身体外观', values: ['身穿轻便的皮甲，背着长弓，眼神锐利。'], category: 'CP', source_id: 10, user_modified: false, _uuid: uuidv4() }
      ],
      'CV': [
        { key: '体力', values: ['75', '100', '-10', '陷阱', '左臂受伤'], category: 'CV', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '魔力/能量值', values: ['180', '200', '0', '', '充盈'], category: 'CV', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '疼痛', values: ['30', '100', '+10', '受伤', '隐隐作痛'], category: 'CV', source_id: 10, user_modified: false, _uuid: uuidv4() }
      ],
      'RP': [
        { key: '好感度', values: ['20', '100', '+5', '初次见面', '陌生'], category: 'RP', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '信任度', values: ['10', '100', '0', '', '警惕'], category: 'RP', source_id: 10, user_modified: false, _uuid: uuidv4() }
      ],
      'CS': [
        { key: '角色状态', values: ['警惕地观察四周，手按在剑柄上。'], category: 'CS', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { key: '角色想法', values: ['这些人类太吵闹了...'], category: 'CS', source_id: 10, user_modified: false, _uuid: uuidv4() }
      ],
      'CR': [
        { key: '道具物品', values: ['精灵长弓', '箭矢x12', '止血草'], category: 'CR', source_id: 10, user_modified: false, _uuid: uuidv4() },
        { 
          key: '技能', 
          values: [
            { name: '火球术', level: '3' }, 
            { name: '冰霜箭', level: '4' } // 此处修改1行
          ], 
          category: 'CR', 
          source_id: 10, 
          user_modified: false, 
          _uuid: uuidv4() 
        }
      ]
    }
  },
  character_meta: {
      'char_user': { isPresent: true },
      'char_eria': { isPresent: true }
  },
  _meta: {
    message_count: 10,
    version: 6
  }
};

type EntriesListener = (entries: LorebookEntry[]) => void;

class MockTavernService {
  private lorebook: LorebookEntry[] = [ 
    // 注入用户提供的 JSON 条目 (仅作为 Content 参考，实际解析依赖 variables)
    { "uid":5,"comment":"时间","content":"[ST|时间::{年月日}@{星期}@{时间}]\n# 规则: 主视角角色当前所在地的具体时间，根据剧情合理推进时间，格式为 年月日@星期@时分。","enabled":true,"position":3, key: [], keysecondary: [] },
    { "uid":6,"comment":"当前地点","content":"[ST|当前地点::{当前地点}]\n# 规则: 主视角角色当前所在具体地点。","enabled":true,"position":3, key: [], keysecondary: [] },
    { "uid":7,"comment":"天气","content":"[ST|天气::{天气}]\n# 规则: 简述主视角角色当前所在地的天气状况及温度。","enabled":true,"position":3, key: [], keysecondary: [] },
    { "uid":9,"comment":"名字","content":"[角色名^CP|名字::{名字}]\n# 规则: 当前场景中每一个可交互角色（以及<user>）的名称，若不明确则以<user>认知中/目测/假设/合理推测的对方的名字/称呼为准。","enabled":true,"position":3, key: [], keysecondary: [] },
    { "uid":11,"comment":"身高(cm)","content":"[角色名^CP|身高::Ncm]\n# 规则: 角色的身高，单位为厘米(cm)，若不明确则以<user>认知中/目测/假设/合理推测的对方的身高为准。","enabled":true,"position":3, key: [], keysecondary: [] },
    { "uid":22,"comment":"疼痛","content":"[角色名^CV|疼痛::N1|100|±N2|{变化原因}|{疼痛描述}]\n# 规则: N1当前疼痛值(0-100)，N2变化值，附原因及描述；超过80剧痛。","enabled":true,"position":3, key: [], keysecondary: [] },
    { "uid":23,"comment":"体力","content":"[角色名^CV|体力::N1|100|±N2|{变化原因}|{体力描述}]\n# 规则: N1当前体力值(0-100)，N2变化值，附原因及描述。","enabled":true,"position":3, key: [], keysecondary: [] },
    { "uid":84,"comment":"剧情发展","content":"[WP|剧情发展::{剧情发展选项1}|{剧情发展选项2}|...]\n# 规则: 提供5个简短精炼、不重复、符合剧情及人设、玩家视角、延续当前剧情的选项，用|分隔。","enabled":true,"position":3, key: [], keysecondary: [] },
    { "uid":1001, "comment": "样式-默认", "content": "/* 默认样式占位 */", "enabled": true, "position": 0, key: [], keysecondary: [] }
  ]; 
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
    
    const existingIndex = this.lorebook.findIndex(e => e.comment === entryName);
    
    if (existingIndex !== -1) {
        this.lorebook[existingIndex] = { ...this.lorebook[existingIndex], content };
    } else {
        const maxUid = this.lorebook.length > 0 ? Math.max(...this.lorebook.map(e => e.uid)) : 0;
        const newEntry: LorebookEntry = {
            uid: maxUid + 1,
            key: [],
            keysecondary: [],
            comment: entryName,
            content: content,
            enabled: true,
            position: this.lorebook.length,
            constant: false,
            selective: false
        };
        this.lorebook.push(newEntry);
    }
    
    this.notifyListeners();
    return Promise.resolve();
  }

  async injectDefinition(
    definition: ItemDefinition,
    categories: { [key: string]: CategoryDefinition }
  ): Promise<{ status: 'created' | 'updated' | 'error' | 'no_change', updatedEntry: LorebookEntry | null, error?: string }> {
    try {
      const content = generateLorebookContent(definition, categories);
      const result = findAndUpdateLorebookEntry(this.lorebook, definition, content);
      
      this.lorebook = result.updatedEntries;
      this.notifyListeners();
      
      return { status: result.status, updatedEntry: result.updatedEntry };
    } catch (e: any) {
      console.error('[MockService] Injection failed:', e);
      return { status: 'error', updatedEntry: null, error: e.message };
    }
  }

  async injectMultipleDefinitions(
    definitions: ItemDefinition[],
    categories: { [key: string]: CategoryDefinition }
  ): Promise<{ created: number; updated: number; no_change: number; errors: number; }> {
    const summary = { created: 0, updated: 0, no_change: 0, errors: 0 };
    let tempLorebook = [...this.lorebook];

    for (const definition of definitions) {
      try {
        const content = generateLorebookContent(definition, categories);
        const result = findAndUpdateLorebookEntry(tempLorebook, definition, content);
        
        tempLorebook = result.updatedEntries;
        
        switch (result.status) {
          case 'created': summary.created++; break;
          case 'updated': summary.updated++; break;
          case 'no_change': summary.no_change++; break;
        }
      } catch (e) {
        console.error(`[MockService] Batch injection failed for ${definition.key}:`, e);
        summary.errors++;
      }
    }

    this.lorebook = tempLorebook;
    this.notifyListeners();
    
    return Promise.resolve(summary);
  }
}

export const tavernService = new MockTavernService();
