import { StyleDefinition } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'th_style_definitions_v1';
const GLOBAL_THEME_STYLE_ID = 'th-global-theme-style';
const ACTIVE_THEME_ID_KEY = 'th-active-theme-id';

export const DEFAULT_STYLES: Omit<StyleDefinition, 'id'>[] = [
    {
        name: '渐变数值条',
        dataType: 'numeric',
        html: `
{{progress_bar_html}}
<div class="numeric-renderer__value-group">
  <span class="numeric-renderer__value">{{current}}</span>
  {{max_html}}
</div>`,
        css: `
.numeric-renderer__progress-fill { 
  background: linear-gradient(90deg, var(--color-success), var(--color-info)); 
}
/* Special states based on percentage */
.numeric-renderer__progress-fill[data-percentage="low"] { 
  background: linear-gradient(90deg, var(--color-warning), var(--color-danger)); 
}
.numeric-renderer__progress-fill[data-percentage="medium"] { 
  background: linear-gradient(90deg, var(--color-success), var(--color-warning)); 
}`,
    },
    {
        name: '简约数值 (无进度条)',
        dataType: 'numeric',
        html: `
<div class="numeric-renderer__value-group">
  <span class="numeric-renderer__value">{{current}}</span>
  {{max_html}}
</div>`,
        css: `
.status-item-row--numeric .status-item-row__content {
  justify-content: flex-end;
}
.numeric-renderer__value { 
  font-size: 1.1rem; 
  font-weight: var(--font-weight-regular);
}`
    },
    {
        name: '双色调数值条', // 此处开始添加15行
        dataType: 'numeric',
        html: `
{{progress_bar_html}}
<div class="numeric-renderer__value-group">
    <span class="numeric-renderer__value">{{current}}</span>
    {{max_html}}
</div>`,
        css: `
.numeric-renderer__progress-container {
  background: var(--color-danger);
  border: 1px solid var(--bar-bg);
  padding: 2px;
}
.numeric-renderer__progress-fill {
  background: var(--color-success);
}`
    },
    {
        name: '胶囊标签组',
        dataType: 'array',
        html: `
<div class="array-renderer__tags-container">
  {{tags_html}}
</div>`,
        css: `
.array-renderer__tag-chip { 
  border-radius: var(--radius-full); 
  padding: 4px 12px; 
  background: var(--bar-bg);
}`
    },
    {
        name: '高亮边框标签', // 此处开始添加12行
        dataType: 'array',
        html: `
<div class="array-renderer__tags-container">
  {{tags_html}}
</div>`,
        css: `
.array-renderer__tag-chip {
    background: transparent;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
}
.array-renderer__tag-chip:hover {
    background: var(--color-primary);
    color: white;
}`
    },
    {
        name: '引用块文本',
        dataType: 'text',
        html: `<div class="text-renderer__value">{{value}}</div>`,
        css: `
.text-renderer__value { 
    border-left: 3px solid var(--color-primary); 
    padding-left: var(--spacing-md);
    background: transparent;
    border-top: none; border-right: none; border-bottom: none;
    font-style: italic;
    color: var(--text-secondary);
}`
    },
    {
        name: '赛博朋克',
        dataType: 'theme',
        css: `
:root {
  /* --- LIGHT MODE (White-Hat Hacker) --- */
  --color-primary: #00b8d4;      /* Sharp Cyan */
  --color-secondary: #f000b8;     /* Vivid Magenta */
  --color-accent: #7e22ce;       /* Purple */
  --bg-app: #eef2f9;             /* Off-white */
  --text-primary: #0f172a;        /* Dark Slate */
  --text-secondary: #64748b;      /* Muted Slate */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 184, 212, 0.3);
  --bar-bg: rgba(0, 20, 40, 0.05);
  --chip-border: rgba(0, 20, 40, 0.1);
}

body.dark-mode {
  /* --- DARK MODE (Neon Noir) --- */
  --color-primary: #00f6ff;      /* Neon Cyan */
  --color-secondary: #ff00ff;     /* Neon Magenta */
  --color-accent: #9333ea;       /* Neon Purple */
  --bg-app: #0c0a18;             /* Deep Purple/Black */
  --text-primary: #e2e8f0;        /* Light Grey */
  --text-secondary: #94a3b8;      /* Slate */
  --glass-bg: rgba(23, 18, 43, 0.6); /* Tinted Glass */
  --glass-border: rgba(0, 246, 255, 0.2);
  --bar-bg: rgba(255, 255, 255, 0.1);
  --chip-border: rgba(255, 255, 255, 0.1);
}

/* --- Shared Effects --- */
.btn--primary {
  text-shadow: 0 0 5px rgba(255,255,255,0.3);
}

body.dark-mode .btn--primary {
  box-shadow: 0 0 10px var(--color-primary), 0 0 20px var(--color-secondary);
}

body.dark-mode .status-bar {
  text-shadow: 0 0 2px var(--text-secondary);
}
        `
    }
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
        
        // Find existing '主题-赛博朋克' and replace it if names match and ID is new
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