import { StyleDefinition } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'th_style_definitions_v2'; // Bumped version to clear old defaults
const GLOBAL_THEME_STYLE_ID = 'th-global-theme-style';
const ACTIVE_THEME_ID_KEY = 'th-active-theme-id';

/**
 * v9.0: Default Styles Library
 * User requested to clear pre-built styles.
 * Use styleService.initializeDefaultStyles() to seed this into localStorage.
 */
export const DEFAULT_STYLES: Omit<StyleDefinition, 'id'>[] = [];


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