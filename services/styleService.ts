import { StyleDefinition } from '../types';

const STORAGE_KEY = 'th_style_definitions';

// v8.0: Mock Data for Preset Editor
const MOCK_STYLE_UNITS: StyleDefinition[] = [ // 此处开始添加19行
  { id: 'style_default', name: '默认样式', dataType: 'numeric', css: '' },
  { id: 'style_red_bar', name: '红色血条', dataType: 'numeric', css: '.bar { background: red; }' },
  { id: 'style_blue_bar', name: '蓝色魔力条', dataType: 'numeric', css: '.bar { background: blue; }' },
  { id: 'style_tags_pill', name: '胶囊标签', dataType: 'array', css: '.tag { border-radius: 99px; }' },
  { id: 'style_tags_block', name: '块状标签', dataType: 'array', css: '.tag { border-radius: 4px; }' },
  { id: 'style_text_quote', name: '引用块文本', dataType: 'text', css: 'p { border-left: 3px solid grey; }' }
];


class StyleService {

  // v8.0: Mock function for Preset Editor development
  getMockStyleUnits(): StyleDefinition[] {
    return MOCK_STYLE_UNITS;
  }

  getStyleDefinitions(): StyleDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      console.error('[StyleService] Failed to load styles');
      return [];
    }
  }

  saveStyleDefinitions(definitions: StyleDefinition[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(definitions));
      this.injectAllStyles(); // Re-inject styles on any change
    } catch (e) {
      console.error('[StyleService] Failed to save styles', e);
    }
  }

  getStyleDefinition(id: string): StyleDefinition | undefined {
    return this.getStyleDefinitions().find(u => u.id === id);
  }

  saveStyleDefinition(definition: StyleDefinition): void {
    const definitions = this.getStyleDefinitions();
    const index = definitions.findIndex(u => u.id === definition.id);
    if (index > -1) {
      definitions[index] = definition;
    } else {
      definitions.push(definition);
    }
    this.saveStyleDefinitions(definitions);
  }

  deleteStyleDefinition(id: string): void {
    const definitions = this.getStyleDefinitions().filter(u => u.id !== id);
    this.saveStyleDefinitions(definitions);
  }
  
  injectAllStyles(): void {
    // Phase 1: Backtrack. Temporarily disabled.
    console.log('[StyleService] Style injection is temporarily disabled during refactor.');
    
    // Ensure old style tags are cleared
    const oldComponentTag = document.getElementById('style-units-injector');
    if (oldComponentTag) oldComponentTag.textContent = '';
    
    const oldThemeTag = document.getElementById('theme-injector');
    if (oldThemeTag) oldThemeTag.textContent = '';
  }
}

export const styleService = new StyleService();