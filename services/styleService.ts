import { StyleDefinition } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'th_style_definitions_v1';
const GLOBAL_THEME_STYLE_ID = 'th-global-theme-style';
const ACTIVE_THEME_ID_KEY = 'th-active-theme-id';

export const DEFAULT_STYLES: Omit<StyleDefinition, 'id'>[] = [
    {
        name: '渐变数值条',
        dataType: 'numeric',
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
        css: `
.numeric-renderer__progress-container { display: none; }
.numeric-renderer__value { font-size: 1.1rem; }
        `
    },
    {
        name: '胶囊标签组',
        dataType: 'array',
        css: `
.array-renderer__tag-chip { 
  border-radius: var(--radius-full); 
  padding: 4px 12px; 
  background: var(--bar-bg);
}
        `
    },
    {
        name: '引用块文本',
        dataType: 'text',
        css: `
.text-renderer__value { 
    border-left: 3px solid var(--color-primary); 
    padding-left: var(--spacing-md);
    background: transparent;
    border-top: none; border-right: none; border-bottom: none;
    font-style: italic;
    color: var(--text-secondary);
}
        `
    },
    {
        name: '主题-赛博朋克',
        dataType: 'theme',
        css: `
body {
  --color-primary: #00f6ff;
  --color-secondary: #ff00ff;
  --glass-bg: rgba(10, 20, 35, 0.6);
  --glass-border: rgba(0, 246, 255, 0.2);
  --text-primary: #f0f8ff;
  --text-secondary: #8aacc4;
}
body.dark-mode {
  --bg-app: #050a10;
  --glass-bg: rgba(10, 20, 35, 0.75);
}
.btn--primary {
  box-shadow: 0 0 15px rgba(0, 246, 255, 0.4);
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