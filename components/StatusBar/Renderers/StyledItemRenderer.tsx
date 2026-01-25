import React, { useMemo } from 'react';
import { StatusBarItem, ItemDefinition, StyleDefinition } from '../../../types';
import { styleService } from '../../../services/styleService';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits';
import { useDroppable } from '@dnd-kit/core';
import { Lock, HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface StyledItemRendererProps {
  item: StatusBarItem;
  definition: ItemDefinition;
  liveCssOverride?: string;
  liveHtmlOverride?: string; // For StyleEditor's live HTML preview
  styleOverride?: StyleDefinition | null;
  onInteract?: (item: StatusBarItem, value?: string) => void;
  activeSelector?: string | null; // v9.5: For highlighting
}

// --- Data Context Builder: Universal & Decoupled ---
const buildDataContext = (item: StatusBarItem, definition: ItemDefinition): Record<string, any> => {
    const context: Record<string, any> = {
        name: definition.name || item.key,
        key: item.key,
        category: item.category,
    };
    
    // --- Pre-render UI Elements ---
    const IconComponent = definition.icon && (LucideIcons as any)[definition.icon] ? (LucideIcons as any)[definition.icon] : HelpCircle;
    context.icon = renderToStaticMarkup(<IconComponent size={14} className="status-item-row__icon" data-target-selector=".status-item-row__icon" />);
    
    context.lock_icon = item.user_modified 
        ? renderToStaticMarkup(<span title="用户已锁定，AI无法修改" className="status-item-row__lock-icon"><Lock size={10} /></span>) 
        : '';
        
    context.label = definition.name || item.key;
    context.label_container = `
        <div class="status-item-row__label" data-target-selector=".status-item-row__label">
            ${context.icon}
            <span>${context.label}</span>
            ${context.lock_icon}
        </div>
    `;

    const values = item.values || [];
    const isObjectList = values.length > 0 && typeof values[0] === 'object';

    // --- 1. Universal Base Data ---
    context.count = values.length;
    // Default textual representation
    if (isObjectList) {
        context.value = `${values.length} items`;
    } else {
        context.value = (values as string[]).join(' '); 
    }
    context.raw_values = values;

    // --- 2. Map Structured Parts (if defined) ---
    if (definition.structure?.parts && Array.isArray(values)) {
        definition.structure.parts.forEach((part, index) => {
            if (typeof values[index] === 'string') {
                context[part.key] = values[index];
            }
        });
    }

    // --- 3. Numeric Parsing (Try to interpret as number) ---
    if (!isObjectList) {
        const strValues = values as string[];
        // Priority: Mapped 'current' -> First Value -> '0'
        const currentStr = context.current || strValues[0] || '0'; 
        const maxStr = context.max || strValues[1] || '';
        
        const current = parseFloat(currentStr);
        let max = maxStr ? parseFloat(maxStr) : 0;
        
        if (!max && !isNaN(current) && current > 0 && current <= 100) {
             max = 100; 
        }

        const hasMax = !isNaN(max) && max > 0;
        const percentage = hasMax ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

        if (!isNaN(current)) {
            context.value = currentStr; 
            context.current = current;
            context.max = max;
            context.percentage = percentage;
            
            context.value_html = `<span class="numeric-renderer__value" data-target-selector=".numeric-renderer__value">${currentStr}</span>`;
            context.max_html = hasMax ? `<span class="numeric-renderer__value-max" data-target-selector=".numeric-renderer__value-max">/${max}</span>` : '';
            
            let barColor = 'var(--color-primary)';
            if (hasMax) {
                if (percentage <= 20) barColor = 'var(--color-danger)';
                else if (percentage <= 50) barColor = 'var(--color-warning)';
                else barColor = 'var(--color-success)';
            }
            context.barColor = barColor;
            
            context.progress_bar_html = hasMax 
                ? `<div class="numeric-renderer__progress-container" data-target-selector=".numeric-renderer__progress-container"><div class="numeric-renderer__progress-fill" data-target-selector=".numeric-renderer__progress-fill" style="width: ${percentage}%; --dynamic-bar-color: ${barColor};"></div></div>`
                : '';
        } else {
            // Not a number, provide safe defaults
            context.current = 0;
            context.percentage = 0;
            context.progress_bar_html = '';
            context.value_html = `<span class="numeric-renderer__value" data-target-selector=".numeric-renderer__value">${currentStr}</span>`;
        }
        
        // Change Indicators
        const changeStr = context.change || strValues[2] || '';
        if (changeStr && changeStr !== '0') {
             const isPositive = changeStr.includes('+') || parseFloat(changeStr) > 0;
             const changeColor = isPositive ? 'var(--color-success)' : 'var(--color-danger)';
             const changeBg = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
             const reasonStr = context.reason || strValues[3] || '';
             context.change_indicator_html = `<span class="numeric-renderer__change-indicator" data-target-selector=".numeric-renderer__change-indicator" style="color: ${changeColor}; background: ${changeBg};" title="${reasonStr ? `原因: ${reasonStr}` : '变化量'}">${changeStr}</span>`;
        } else {
            context.change_indicator_html = '';
        }
        
        const reasonStr = context.reason || strValues[3] || '';
        const descStr = context.description || strValues[4] || '';
        let subRowContent = '';
        if (reasonStr) subRowContent += `<span class="numeric-renderer__reason">(${reasonStr})</span>`;
        if (descStr) subRowContent += `<span class="numeric-renderer__description" data-target-selector=".numeric-renderer__description">${descStr}</span>`;
        context.sub_row_html = subRowContent ? `<div class="numeric-renderer__sub-row" data-target-selector=".numeric-renderer__sub-row">${subRowContent}</div>` : '';
    }

    // --- 4. Array Parsing (Treat as tags) ---
    if (!isObjectList) {
        const strValues = values as string[];
        const tags = strValues.filter(v => v && v.trim() !== '');
        
        context.tags_html = tags.length > 0 
            ? tags.map(tag => `<span class="array-renderer__tag-chip" data-value="${tag}" data-target-selector=".array-renderer__tag-chip">${tag}</span>`).join('')
            : `<span class="array-renderer__empty-text">空</span>`;
    }

    // --- 5. Object List Parsing ---
    if (isObjectList) {
        const objects = values as Array<Record<string, string>>;
        const cardTemplate = `
          <div class="object-card" data-target-selector=".object-card">
            ${(definition.structure?.parts || []).map(partDef => `
              <div class="object-card__property" data-target-selector=".object-card__property">
                <span class="object-card__label" data-target-selector=".object-card__label">${partDef.label || partDef.key}</span>
                <span class="object-card__value" data-target-selector=".object-card__value">{{${partDef.key}}}</span>
              </div>
            `).join('')}
          </div>
        `;
        context.cards_html = objects.length > 0 
          ? objects.map(obj => {
              let cardHtml = cardTemplate;
              for (const key in obj) {
                  cardHtml = cardHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), obj[key] || '');
              }
              cardHtml = cardHtml.replace(/\{\{.*?\}\}/g, '');
              return cardHtml;
          }).join('')
          : `<span class="object-list-renderer__empty-text">空</span>`;
    } else {
        context.cards_html = '';
    }

    return context;
};

const renderTemplate = (template: string, context: Record<string, any>): string => {
    let output = template;
    for (const key in context) {
        output = output.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), context[key] !== undefined && context[key] !== null ? context[key] : '');
    }
    // Clean up any un-replaced placeholders
    output = output.replace(/\{\{.*?\}\}/g, '');
    return output;
};


const StyledItemRenderer: React.FC<StyledItemRendererProps> = ({ 
  item, definition, liveCssOverride, liveHtmlOverride, styleOverride, onInteract, activeSelector
}) => {
  const uniqueId = `styled-item-${item._uuid}`;

  const { isOver, setNodeRef, active } = useDroppable({ id: definition.key });

  // V9.2: Always compatible drop.
  const isCompatibleDrag = !!active;
  
  const { finalHtml, finalCss, finalLayoutClass } = useMemo(() => {
    let styleDef: StyleDefinition | undefined | null = null;
    let htmlTemplate: string | undefined;

    // Priority 1: Live editor overrides (takes precedence for everything)
    if (liveCssOverride !== undefined) {
      styleDef = { css: liveCssOverride, dataType: definition.type, id: 'live', name: 'live' };
      htmlTemplate = liveHtmlOverride;
    } 
    // Priority 2: Hover preview
    else if (styleOverride) {
      styleDef = styleOverride;
      htmlTemplate = styleDef.html;
    }
    // Priority 3: Saved style from definition
    else if (definition.styleId && definition.styleId !== 'style_default') {
      styleDef = styleService.getStyleDefinition(definition.styleId);
      htmlTemplate = styleDef?.html;
    }
    
    // Fallback logic
    if (!styleDef) {
        let defaultId = '';
        switch (definition.type) {
            case 'numeric': defaultId = 'default_numeric'; break;
            case 'array': defaultId = 'default_array'; break;
            case 'text': defaultId = 'default_text'; break;
            case 'list-of-objects': defaultId = 'default_object_list'; break;
        }
        if (defaultId) {
            styleDef = DEFAULT_STYLE_UNITS.find(u => u.id === defaultId);
            htmlTemplate = styleDef?.html;
        }
    }

    if (typeof htmlTemplate !== 'string') {
        const fallbackDefault = DEFAULT_STYLE_UNITS.find(u => u.dataType === definition.type);
        htmlTemplate = fallbackDefault?.html || '';
    }
    
    const context = buildDataContext(item, definition);
    const finalHtml = renderTemplate(htmlTemplate, context);

    // CSS Scoping Strategy v2
    const rawCss = styleDef?.css;
    const scopedCss = rawCss ? rawCss.replace(
      /([^\r\n,{}]+)(,(?=[^}]*{)|\s*?{)/g,
      (match, selector, trigger) => {
        const trimmedSelector = selector.trim();
        if (trimmedSelector.startsWith('@') || trimmedSelector.startsWith(':root') || trimmedSelector.startsWith('body')) {
            return match; 
        }
        const scopedSelector = `#${uniqueId} ${trimmedSelector}`;
        return scopedSelector + trigger;
      }
    ) : null;

    let layoutClass = '';
    // Use definition type for layout class hint, but fallback to text block if content is long
    if (definition.type === 'text') {
        const text = context.value || '';
        layoutClass = text.length > 20 ? 'status-item-row--text-block' : 'status-item-row--text-inline';
    }

    return { finalHtml, finalCss: scopedCss, finalLayoutClass: layoutClass };

  }, [uniqueId, liveCssOverride, liveHtmlOverride, styleOverride, definition, item]);

  const dropzoneClass = isOver && isCompatibleDrag ? 'droppable-active' : '';

  return (
    <div id={uniqueId} ref={setNodeRef} className={dropzoneClass}>
      <div 
        className={`status-item-row status-item-row--${definition.type} ${finalLayoutClass}`}
        onClick={(e) => {
            if (!onInteract) return;
            const target = e.target as HTMLElement;
            const chip = target.closest('[data-value]');
            if (chip) {
                onInteract(item, chip.getAttribute('data-value') || '');
            } else {
                onInteract(item);
            }
        }}
        title={`Key: ${item.key}`}
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />
      {finalCss && <style>{finalCss}</style>}
      {activeSelector && (
          <style>{`
            @keyframes highlight-glow {
              0% { box-shadow: 0 0 8px rgba(139, 92, 246, 0.5), 0 0 0 2px rgba(139, 92, 246, 0.5); }
              100% { box-shadow: 0 0 16px rgba(139, 92, 246, 0.8), 0 0 0 2px rgba(139, 92, 246, 0.5); }
            }
            #${uniqueId} [data-target-selector="${activeSelector}"] {
                outline: 2px solid var(--color-accent);
                outline-offset: 2px;
                animation: highlight-glow 0.5s alternate infinite;
                border-radius: 4px; /* Ensure outline looks good on elements without radius */
            }
        `}</style>
      )}
    </div>
  );
};

export default StyledItemRenderer;