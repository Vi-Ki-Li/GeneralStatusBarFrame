import { StyleDefinition } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'th_style_definitions_v1';
const GLOBAL_THEME_STYLE_ID = 'th-global-theme-style';
const ACTIVE_THEME_ID_KEY = 'th-active-theme-id';

/**
 * v9.0: Default Styles Library
 * A rich set of pre-built style units across different themes.
 * This array is used to seed localStorage for new users.
 */
export const DEFAULT_STYLES: Omit<StyleDefinition, 'id'>[] = [
    // --- 冰川 (Glacier) Theme ---
    {
        name: '冰川-数值条',
        dataType: 'numeric',
        html: `
<div class="status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="glacier-numeric">
      {{progress_bar_html}}
      <div class="numeric-renderer__value-group">
        <span class="numeric-renderer__value">{{current}}</span>
        {{max_html}}
      </div>
    </div>
</div>`,
        css: `
.glacier-numeric { display: flex; align-items: center; gap: 12px; }
.numeric-renderer__progress-container { flex: 1; height: 6px; }
.numeric-renderer__progress-fill { background: var(--color-primary); }`
    },
    {
        name: '冰川-标签组',
        dataType: 'array',
        html: `
<div class="status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="array-renderer__tags-container">{{tags_html}}</div>
</div>`,
        css: `
.array-renderer__tag-chip { 
  border-radius: var(--radius-full); 
  padding: 4px 12px; 
  background: var(--bar-bg);
  color: var(--text-secondary);
  border-color: transparent;
}
.array-renderer__tags-container { justify-content: flex-end; display: flex; gap: 4px; flex-wrap: wrap; }`
    },
    {
        name: '冰川-信息卡',
        dataType: 'text',
        html: `
<div class="status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="text-renderer__value">{{value}}</div>
</div>`,
        css: `
.text-renderer__value {
  padding: 10px;
  border-left: 3px solid var(--color-primary);
  background: var(--chip-bg);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}`
    },
    {
        name: '冰川-数据网格',
        dataType: 'list-of-objects',
        html: `
<div class="status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="object-list-renderer__card-container">{{cards_html}}</div>
</div>`,
        css: `
.object-list-renderer__card-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.object-card {
  border: 1px solid var(--chip-border);
  background: transparent;
  padding: 8px;
}`
    },
    {
        name: '主题-冰川',
        dataType: 'theme',
        css: `
/* 冰川-亮色模式 */
:root {
  --color-primary: #3b82f6; /* Blue 500 */
  --color-secondary: #14b8a6; /* Teal 500 */
  --bg-app: #f1f5f9; /* Slate 100 */
  --text-primary: #1e293b; /* Slate 800 */
  --text-secondary: #64748b; /* Slate 500 */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 0, 0, 0.05);
  --bar-bg: #e2e8f0; /* Slate 200 */
  --chip-bg: #e2e8f0;
  --chip-border: #cbd5e1; /* Slate 300 */
}

/* 冰川-暗色模式 */
body.dark-mode {
  --color-primary: #60a5fa; /* Blue 400 */
  --color-secondary: #2dd4bf; /* Teal 400 */
  --bg-app: #0f172a; /* Slate 900 */
  --text-primary: #f1f5f9; /* Slate 100 */
  --text-secondary: #94a3b8; /* Slate 400 */
  --glass-bg: rgba(30, 41, 59, 0.6);
  --glass-border: rgba(255, 255, 255, 0.1);
  --bar-bg: #334155; /* Slate 700 */
  --chip-bg: #1e293b;
  --chip-border: #334155;
}`
    },
    
    // --- 奥术 (Arcane) Theme ---
    {
        name: '奥术-能量水晶',
        dataType: 'numeric',
        html: `
<div class="status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    {{progress_bar_html}}
    <div class="numeric-renderer__value-group">
      <span class="numeric-renderer__value">{{current}}</span>
      {{max_html}}
    </div>
</div>`,
        css: `
.numeric-renderer__progress-container {
  border-radius: 4px;
  background: #2a2252;
  border: 1px solid #7c3aed;
  box-shadow: 0 0 8px #a78bfa, inset 0 0 5px rgba(0,0,0,0.5);
  padding: 2px;
}
.numeric-renderer__progress-fill {
  background: linear-gradient(90deg, #c4b5fd, #a78bfa);
  box-shadow: 0 0 5px #c4b5fd;
  border-radius: 2px;
}
.numeric-renderer__value { color: #e9d5ff; }
.numeric-renderer__value-group { display: flex; justify-content: flex-end; gap: 4px; }
`
    },
    {
        name: '奥术-符文石',
        dataType: 'array',
        html: `
<div class="status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="array-renderer__tags-container">{{tags_html}}</div>
</div>`,
        css: `
.array-renderer__tags-container { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.array-renderer__tag-chip { 
  background: linear-gradient(145deg, #4c1d95, #3730a3);
  color: #e9d5ff;
  border: 1px solid #7c3aed;
  clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%);
  padding: 4px 14px;
  text-shadow: 0 0 3px #c4b5fd;
}`
    },
    {
        name: '奥术-羊皮纸',
        dataType: 'text',
        html: `
<div class="status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="arcane-text">{{value}}</div>
</div>`,
        css: `
.arcane-text {
  font-family: serif;
  color: #f3e8ff;
  background: rgba(46, 16, 101, 0.3);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #7c3aed;
  text-shadow: 0 0 5px #c4b5fd;
  line-height: 1.6;
}`
    },
    {
        name: '奥术-魔法图鉴',
        dataType: 'list-of-objects',
        html: `
<div class="status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="object-list-renderer__card-container">{{cards_html}}</div>
</div>`,
        css: `
.object-list-renderer__card-container {
  display: grid;
  grid-template-columns: 1fr; /* Arcane style prefers a list view */
  gap: 8px;
}
.object-card {
  background: linear-gradient(145deg, #4c1d95, #3730a3);
  border: 1px solid #7c3aed;
  box-shadow: 0 0 8px #a78bfa;
  padding: 12px;
  color: #e9d5ff;
}
.object-card__property { display: flex; justify-content: space-between; }
.object-card__label { color: #a78bfa; }
.object-card__value { font-weight: 600; text-shadow: 0 0 3px #c4b5fd; }
`
    },
    {
        name: '主题-奥术',
        dataType: 'theme',
        css: `
/* 奥术-亮色模式 (白魔法) */
:root {
  --color-primary: #a855f7; /* Purple 500 */
  --color-secondary: #facc15; /* Yellow 400 */
  --bg-app: #f5f3ff; /* Violet 50 */
  --text-primary: #2e1065; /* Violet 950 */
  --text-secondary: #6d28d9; /* Violet 700 */
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(168, 85, 247, 0.2);
  --bar-bg: #ede9fe; /* Violet 100 */
  --chip-border: #ddd6fe; /* Violet 200 */
}

/* 奥术-暗色模式 (黑魔法) */
body.dark-mode {
  --color-primary: #c084fc; /* Purple 400 */
  --color-secondary: #eab308; /* Yellow 500 */
  --bg-app: #1e1b4b; /* Indigo 950 */
  --text-primary: #f5f3ff; /* Violet 50 */
  --text-secondary: #a78bfa; /* Violet 400 */
  --glass-bg: rgba(30, 27, 75, 0.6);
  --glass-border: rgba(192, 132, 252, 0.3);
  --bar-bg: #4338ca; /* Indigo 700 */
  --chip-border: #5b21b6; /* Violet 800 */
}`
    },

    // --- 终端 (Terminal) Theme ---
    {
        name: '终端-加载条',
        dataType: 'numeric',
        html: `
<div class="terminal-numeric">
  <div class="terminal-numeric-label">> {{name}} [{{current}}/{{max}}]</div>
  <div class="terminal-numeric-bar-container">
    <div class="terminal-numeric-bar-fill" style="width: {{percentage}}%"></div>
  </div>
</div>`,
        css: `
.status-item-row__label { display: none; }
.status-item-row__content { width: 100%; }
.terminal-numeric { font-family: monospace; color: var(--color-primary); }
.terminal-numeric-bar-container { background: var(--bar-bg); padding: 2px; margin-top: 4px; }
.terminal-numeric-bar-fill {
  height: 10px;
  background: var(--color-primary);
  box-shadow: 0 0 5px var(--color-primary);
}`
    },
    {
        name: '终端-数据芯片',
        dataType: 'array',
        html: `
<div class="terminal-array">
  > {{name}}: <div class="array-renderer__tags-container">{{tags_html}}</div>
</div>`,
        css: `
.status-item-row__label { display: none; }
.status-item-row__content { font-family: monospace; color: var(--color-primary); width: 100%; }
.terminal-array { display: flex; gap: 8px; align-items: center; }
.array-renderer__tags-container { display: flex; gap: 4px; }
.array-renderer__tag-chip {
  background: var(--color-primary);
  color: var(--bg-app);
  border-radius: 0;
  padding: 2px 6px;
}`
    },
    {
        name: '终端-日志条目',
        dataType: 'text',
        html: `> {{value}}`,
        css: `
.status-item-row__label { display: none; }
.status-item-row__content { 
  font-family: monospace; 
  color: var(--color-primary); 
  font-size: 0.9rem;
  line-height: 1.5;
  width: 100%;
}`
    },
    {
        name: '终端-数据包',
        dataType: 'list-of-objects',
        html: `<div class="object-list-renderer__card-container">{{cards_html}}</div>`,
        css: `
.status-item-row__label { display: none; }
.status-item-row__content { width: 100%; }
.object-list-renderer__card-container {
  display: grid;
  grid-template-columns: 1fr;
  font-family: monospace;
  color: var(--color-primary);
  gap: 8px;
}
.object-card {
  background: var(--bar-bg);
  padding: 8px;
  border-left: 2px solid var(--color-primary);
}
.object-card__property {
  font-size: 0.85rem;
  display: flex; justify-content: space-between;
}
.object-card__label::after { content: ':'; }
.object-card__value { color: var(--text-primary); }
`
    },
    {
        name: '主题-终端',
        dataType: 'theme',
        css: `
body {
  font-family: 'Courier New', Courier, monospace !important;
}
/* 终端-亮色模式 (Paper) */
:root {
  --color-primary: #0d9488; /* Teal 600 */
  --color-secondary: #be123c; /* Rose 700 */
  --bg-app: #fefce8; /* Yellow 50 */
  --text-primary: #1c1917; /* Stone 900 */
  --text-secondary: #57534e; /* Stone 600 */
  --glass-bg: rgba(254, 252, 232, 0.8);
  --glass-border: transparent;
  --bar-bg: #d6d3d1; /* Stone 300 */
  --chip-border: #a8a29e; /* Stone 400 */
}

/* 终端-暗色模式 (Hacker) */
body.dark-mode {
  --color-primary: #65f04b; /* Bright Green */
  --color-secondary: #fde047; /* Yellow 300 */
  --bg-app: #0c0a09; /* True black */
  --text-primary: #65f04b;
  --text-secondary: #22c55e; /* Green 500 */
  --glass-bg: rgba(18, 18, 18, 0.5);
  --glass-border: rgba(101, 240, 75, 0.2);
  --bar-bg: #292524; /* Stone 800 */
  --chip-border: #44403c; /* Stone 700 */
}`
    },
];


class StyleService {
    constructor() {
        this.initializeDefaultStyles();
    }

    initializeDefaultStyles(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                const stylesWithIds = DEFAULT_STYLES.map(style => ({
                    ...style,
                    id: uuidv4()
                }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stylesWithIds));
            }
        } catch (e) {
            console.error('[StyleService] Failed to initialize default styles', e);
        }
    }

    getStyleDefinitions(): StyleDefinition[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const styles: StyleDefinition[] = stored ? JSON.parse(stored) : [];
            
            let needsSave = false;
            const healedStyles = styles.map(style => {
                if ((!style.id || style.id.trim() === '') && style.name) {
                    style.id = uuidv4();
                    needsSave = true;
                }
                return style;
            });

            if (needsSave) {
                console.warn('[StyleService] Detected and healed corrupted style definitions.');
                localStorage.setItem(STORAGE_KEY, JSON.stringify(healedStyles));
            }

            return healedStyles;
        } catch {
            console.error('[StyleService] Failed to load styles');
            return [];
        }
    }
    
    saveStyleDefinitions(definitions: StyleDefinition[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(definitions));
        } catch (e) {
            console.error('[StyleService] Failed to save styles', e);
        }
    }

    getStyleDefinition(id: string): StyleDefinition | undefined {
        return this.getStyleDefinitions().find(u => u.id === id);
    }
    
    saveStyleDefinition(definition: StyleDefinition): StyleDefinition {
        const definitions = this.getStyleDefinitions();
        
        // Find existing '赛博朋克' and replace it if names match and ID is new
        const isDefaultCyberpunk = definition.name === '赛博朋克' && !definition.id;
        if (isDefaultCyberpunk) {
            const existingDefaultIndex = definitions.findIndex(d => d.name === '赛博朋克');
            if (existingDefaultIndex > -1) {
                const existingId = definitions[existingDefaultIndex].id;
                definition.id = existingId;
            }
        }
        
        if (!definition.id) {
            definition.id = uuidv4();
        }
        
        const index = definitions.findIndex(u => u.id === definition.id);
        if (index > -1) {
            definitions[index] = definition;
        } else {
            definitions.push(definition);
        }
        this.saveStyleDefinitions(definitions);
        return definition;
    }

    deleteStyleDefinition(id: string): void {
        if (this.getActiveThemeId() === id) {
            this.clearActiveTheme();
        }
        const definitions = this.getStyleDefinitions().filter(u => u.id !== id);
        this.saveStyleDefinitions(definitions);
    }

    // --- Bulk Operations (v9.1) ---
    deleteStyleDefinitions(ids: string[]): void {
        const activeThemeId = this.getActiveThemeId();
        if (activeThemeId && ids.includes(activeThemeId)) {
            this.clearActiveTheme();
        }
        const definitions = this.getStyleDefinitions().filter(u => !ids.includes(u.id));
        this.saveStyleDefinitions(definitions);
    }

    // --- Import / Export ---
    exportStyles(definitionsToExport?: StyleDefinition[]): string {
        const definitions = definitionsToExport || this.getStyleDefinitions();
        return JSON.stringify(definitions, null, 2);
    }

    importStyles(jsonString: string): { success: number, updated: number, total: number, errors: number } {
        const result = { success: 0, updated: 0, total: 0, errors: 0 };
        try {
            const imported = JSON.parse(jsonString);
            if (!Array.isArray(imported)) {
                throw new Error("Invalid format: expected array");
            }
            
            result.total = imported.length;
            const currentStyles = this.getStyleDefinitions();
            
            imported.forEach((style: any) => {
                if (!style.name || !style.dataType || !style.css) {
                    result.errors++;
                    return;
                }
                
                // Ensure valid ID
                if (!style.id) style.id = uuidv4();

                const existingIndex = currentStyles.findIndex(s => s.id === style.id);
                if (existingIndex > -1) {
                    currentStyles[existingIndex] = style;
                    result.updated++;
                } else {
                    currentStyles.push(style);
                    result.success++;
                }
            });
            
            this.saveStyleDefinitions(currentStyles);
        } catch (e) {
            console.error("[StyleService] Import failed:", e);
            result.errors = -1; // Critical error
        }
        return result;
    }

    // --- Theme Management ---
    getActiveThemeId(): string | null {
        try {
            return localStorage.getItem(ACTIVE_THEME_ID_KEY);
        } catch {
            return null;
        }
    }

    applyTheme(themeId: string): void {
        try {
            const theme = this.getStyleDefinition(themeId);
            if (!theme || theme.dataType !== 'theme') {
                console.warn(`[StyleService] Attempted to apply non-theme style: ${themeId}`);
                this.clearActiveTheme();
                return;
            }

            let styleTag = document.getElementById(GLOBAL_THEME_STYLE_ID);
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = GLOBAL_THEME_STYLE_ID;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = theme.css;
            localStorage.setItem(ACTIVE_THEME_ID_KEY, themeId);
        } catch (e) {
            console.error('[StyleService] Failed to apply theme', e);
        }
    }

    clearActiveTheme(): void {
        try {
            const styleTag = document.getElementById(GLOBAL_THEME_STYLE_ID);
            if (styleTag) {
                styleTag.remove();
            }
            localStorage.removeItem(ACTIVE_THEME_ID_KEY);
        } catch (e) {
            console.error('[StyleService] Failed to clear theme', e);
        }
    }
    
    initializeActiveTheme(): void {
        const activeId = this.getActiveThemeId();
        if (activeId) {
            this.applyTheme(activeId);
        }
    }
    
    getMockStyleUnits(): StyleDefinition[] {
      const allStyles = this.getStyleDefinitions();
      const defaultOption: StyleDefinition = { id: 'style_default', name: '默认样式', dataType: 'numeric', css: '' };
      return [defaultOption, ...allStyles.filter(s => s.dataType !== 'theme')];
    }
}

export const styleService = new StyleService();