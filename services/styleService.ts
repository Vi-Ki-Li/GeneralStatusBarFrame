
import { StyleDefinition } from '../types';
import { v4 as uuidv4 } from 'uuid'; // 此处添加1行

const STORAGE_KEY = 'th_style_definitions_v2'; // Bumped version to clear old defaults
const GLOBAL_THEME_STYLE_ID = 'th-global-theme-style';
const ACTIVE_THEME_ID_KEY = 'th-active-theme-id';

/**
 * v9.0: Default Styles Library
 * User requested to clear pre-built styles.
 * Use styleService.initializeDefaultStyles() to seed this into localStorage.
 */
export const DEFAULT_STYLES: Omit<StyleDefinition, 'id'>[] = [ // 此处开始添加223行
    // --- Global Themes ---
    {
        name: '赛博朋克',
        dataType: 'theme',
        css: `
:root {
  --color-primary: #00f5d4;
  --color-primary-hover: #00f0c4;
  --color-primary-subtle: rgba(0, 245, 212, 0.1);
  --color-secondary: #ff00ff;
  --color-accent: #f72585;
  --font-family-base: 'Outfit', 'JetBrains Mono', monospace;

  /* Light Mode Fallback */
  --bg-app: #e0e0ef;
  --bg-surface: rgba(255, 255, 255, 0.8);
  --border-base: rgba(0, 245, 212, 0.5);
  --text-primary: #0d0c1d;
  --text-secondary: #454370;
}
body.dark-mode {
  --bg-app: #0d0c1d;
  --bg-gradient: radial-gradient(at 0% 0%, rgba(0, 245, 212, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(255, 0, 255, 0.15) 0px, transparent 50%);
  --bg-surface: rgba(28, 27, 45, 0.8);
  --bg-surface-hover: rgba(45, 43, 70, 0.8);
  --glass-blur: blur(8px);
  --border-base: rgba(0, 245, 212, 0.3);
  --border-hover: #00f5d4;
  --shadow-glass: 0 0 16px 0 rgba(0, 245, 212, 0.2);
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0c0;
  --text-tertiary: #606080;
  --scrollbar-thumb: #ff00ff;
}`
    },
    {
        name: '宁静庭院',
        dataType: 'theme',
        css: `
:root {
  --color-primary: #58a69d;
  --color-primary-hover: #4a8e86;
  --color-primary-subtle: rgba(88, 166, 157, 0.1);
  --color-secondary: #e0b1cb;
  --color-accent: #a9d4b9;
  --font-family-base: 'Outfit', system-ui, sans-serif;
  
  /* Light Mode */
  --bg-app: #f4f8f7;
  --bg-gradient: radial-gradient(at 10% 20%, rgba(88, 166, 157, 0.1) 0px, transparent 40%), radial-gradient(at 90% 80%, rgba(224, 177, 203, 0.1) 0px, transparent 40%);
  --bg-surface: rgba(255, 255, 255, 0.85);
  --glass-blur: blur(16px);
  --border-base: rgba(47, 79, 79, 0.1);
  --border-hover: rgba(88, 166, 157, 0.5);
  --shadow-glass: 0 4px 12px 0 rgba(47, 79, 79, 0.05);
  --text-primary: #2f4f4f;
  --text-secondary: #708090;
  --text-tertiary: #b0c4de;
  --scrollbar-thumb: #c9d8d6;
}
body.dark-mode {
  --bg-app: #283332;
  --bg-surface: rgba(47, 63, 62, 0.85);
  --border-base: rgba(244, 248, 247, 0.15);
  --text-primary: #e0eceb;
  --text-secondary: #a0b4b2;
  --text-tertiary: #677876;
}`
    },
    // --- Style Units (copied from defaultStyleUnits.ts) ---
    {
        name: '默认数值条 (可编辑)',
        dataType: 'numeric',
        html: `
<div class="status-item-row__label" data-target-selector=".status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    {{progress_bar_html}}
    <div class="numeric-renderer__value-group" data-target-selector=".numeric-renderer__value-group">
      {{value_html}}
      {{max_html}}
      {{change_indicator_html}}
    </div>
    {{sub_row_html}}
</div>`,
        css: `
.status-item-row--numeric .status-item-row__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.numeric-renderer__progress-container {
  width: 100%;
  height: 6px;
  background: var(--bar-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.numeric-renderer__progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s var(--ease-out-back), background-color 0.3s ease;
  background-color: var(--dynamic-bar-color, var(--color-primary));
}
.numeric-renderer__value-group {
  display: flex;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  justify-content: flex-end;
}
.numeric-renderer__value {
  font-weight: var(--font-weight-semibold);
  font-size: 0.9rem;
  color: var(--text-primary);
}
.numeric-renderer__value-max {
  color: var(--text-tertiary);
  font-size: 0.8em;
}
.numeric-renderer__change-indicator {
  font-size: var(--font-size-xs);
  padding: 1px 4px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}
.numeric-renderer__sub-row {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: right;
  width: 100%;
}`
    },
    {
        name: '默认标签组 (可编辑)',
        dataType: 'array',
        html: `
<div class="status-item-row__label" data-target-selector=".status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="array-renderer__tags-container" data-target-selector=".array-renderer__tags-container">
      {{tags_html}}
    </div>
</div>`,
        css: `
.array-renderer__tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  flex: 1;
}
.array-renderer__tag-chip {
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  color: var(--text-secondary);
  transition: var(--transition-fast);
  cursor: pointer;
}
.array-renderer__tag-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.array-renderer__empty-text {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  font-style: italic;
}`
    },
    {
        name: '默认文本 (可编辑)',
        dataType: 'text',
        html: `
<div class="status-item-row__label" data-target-selector=".status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="text-renderer__value" data-target-selector=".text-renderer__value">{{value}}</div>
</div>`,
        css: `
.status-item-row--text-inline .status-item-row__content {
  flex: 1;
}
.status-item-row--text-block {
  flex-direction: column;
  align-items: flex-start;
}
.status-item-row--text-block .status-item-row__label {
  margin-bottom: 4px;
}
.text-renderer__value {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  width: 100%;
  transition: color 0.2s;
}
.text-renderer__value:hover {
  color: var(--text-primary);
}
.status-item-row--text-inline .text-renderer__value {
  text-align: right;
}
.status-item-row--text-block .text-renderer__value {
  text-align: left;
  background: var(--chip-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
}`
    },
    {
        name: '默认对象列表 (可编辑)',
        dataType: 'list-of-objects',
        html: `
<div class="status-item-row__label" data-target-selector=".status-item-row__label">
  {{icon}} <span>{{name}}</span> {{lock_icon}}
</div>
<div class="status-item-row__content">
    <div class="object-list-renderer__card-container" data-target-selector=".object-list-renderer__card-container">{{cards_html}}</div>
</div>`,
        css: `
.status-item-row--list-of-objects {
  flex-direction: column;
  align-items: flex-start;
}
.status-item-row--list-of-objects .status-item-row__content {
  width: 100%;
}
.object-list-renderer__card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-sm);
  width: 100%;
}
.object-card {
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: var(--transition-fast);
}
.object-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.object-card__property {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  gap: var(--spacing-sm);
}
.object-card__label {
  color: var(--text-secondary);
  white-space: nowrap;
}
.object-card__value {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.object-list-renderer__empty-text {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  font-style: italic;
}`
    }
]; // 此处完成添加


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
