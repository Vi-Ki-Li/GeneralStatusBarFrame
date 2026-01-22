
import { StyleUnit } from '../types';

const STORAGE_KEY = 'th_style_units';

/**
 * Scopes CSS selectors with a given class.
 * This is a simplified implementation. It might not cover all edge cases
 * of complex CSS, but it works for basic selectors.
 */
function scopeCss(css: string, scopeClass: string): string {
    // This regex is designed to find CSS selectors outside of media query blocks.
    // It's not perfect but handles simple cases.
    return css.replace(/(^|}|@media[^{]+{\s*})([^{}]+?)({)/g, (match, p1, p2, p3) => {
        if (p2.trim().startsWith('@')) {
            return match; // Don't scope at-rules like @keyframes
        }
        const scopedSelectors = p2.split(',')
            .map(selector => `.${scopeClass} ${selector.trim()}`)
            .join(', ');
        return `${p1}${scopedSelectors}${p3}`;
    });
}

class StyleService {
  getStyleUnits(): StyleUnit[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      console.error('[StyleService] Failed to load styles');
      return [];
    }
  }

  saveStyleUnits(units: StyleUnit[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
      this.injectAllStyles(); // Re-inject styles on any change
    } catch (e) {
      console.error('[StyleService] Failed to save styles', e);
    }
  }

  getStyleUnit(id: string): StyleUnit | undefined {
    return this.getStyleUnits().find(u => u.id === id);
  }

  saveStyleUnit(unit: StyleUnit): void {
    const units = this.getStyleUnits();
    const index = units.findIndex(u => u.id === unit.id);
    if (index > -1) {
      units[index] = unit;
    } else {
      units.push(unit);
    }
    this.saveStyleUnits(units);
  }

  deleteStyleUnit(id: string): void {
    const units = this.getStyleUnits().filter(u => u.id !== id);
    this.saveStyleUnits(units);
  }
  
  injectAllStyles(): void {
    const units = this.getStyleUnits();
    const css = units.map(unit => scopeCss(unit.css, `style-unit-${unit.id}`)).join('\n\n');
    
    let styleTag = document.getElementById('style-units-injector');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'style-units-injector';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
  }
}

export const styleService = new StyleService();
