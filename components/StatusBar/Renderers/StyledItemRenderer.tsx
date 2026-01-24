import React, { useMemo } from 'react';
import { StatusBarItem, ItemDefinition, StyleDefinition } from '../../../types';
import { styleService } from '../../../services/styleService';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits';
import { useDroppable } from '@dnd-kit/core';
import { Lock, HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface StyledItemRendererProps {
  item: StatusBarItem;
  definition: ItemDefinition;
  liveCssOverride?: string;
  liveHtmlOverride?: string; // For StyleEditor's live HTML preview
  styleOverride?: StyleDefinition | null;
  onInteract?: (item: StatusBarItem, value?: string) => void;
}

// --- Data Context Builder: The heart of the template engine ---
const buildDataContext = (item: StatusBarItem, definition: ItemDefinition): Record<string, any> => {
    // v9.1: Inject meta properties first
    const context: Record<string, any> = {
        name: definition.name || item.key,
        key: item.key,
        category: item.category,
    };
    const values = item.values || [];

    // 1. Map structured parts
    if (definition.structure?.parts && Array.isArray(values)) {
        definition.structure.parts.forEach((part, index) => {
            if (typeof values[index] === 'string') {
                context[part.key] = values[index];
            }
        });
    }

    // 2. Type-specific logic
    switch (definition.type) {
        case 'numeric': {
            const currentStr = context.current || context.value || (values[0] as string) || '0';
            const maxStr = context.max || (values[1] as string) || '';
            const changeStr = context.change || (values[2] as string) || '';
            const reasonStr = context.reason || (values[3] as string) || '';
            const descStr = context.description || (values[4] as string) || '';

            const current = parseFloat(currentStr);
            const max = maxStr ? parseFloat(maxStr) : 0;
            const hasMax = !!maxStr && maxStr.trim() !== '' && !isNaN(max) && max > 0;
            const percentage = hasMax ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

            context.current = current;
            context.max = max;
            context.percentage = percentage;
            
            context.max_html = hasMax ? `<span class="numeric-renderer__value-max">/${max}</span>` : '';

            let barColor = 'var(--color-primary)';
            if (hasMax) {
                if (percentage <= 20) barColor = 'var(--color-danger)';
                else if (percentage <= 50) barColor = 'var(--color-warning)';
                else barColor = 'var(--color-success)';
            }
            context.barColor = barColor;

            // v8.5: Conditional progress bar rendering
            context.progress_bar_html = hasMax 
                ? `<div class="numeric-renderer__progress-container"><div class="numeric-renderer__progress-fill" style="width: ${percentage}%; background-color: ${barColor};"></div></div>`
                : '';

            if (changeStr && changeStr !== '0') {
                const isPositive = changeStr.includes('+') || parseFloat(changeStr) > 0;
                const changeColor = isPositive ? 'var(--color-success)' : 'var(--color-danger)';
                const changeBg = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                context.change_indicator_html = `<span class="numeric-renderer__change-indicator" style="color: ${changeColor}; background: ${changeBg};" title="${reasonStr ? `原因: ${reasonStr}` : '变化量'}">${changeStr}</span>`;
            } else {
                context.change_indicator_html = '';
            }
            
            let subRowContent = '';
            if (reasonStr) subRowContent += `<span class="numeric-renderer__reason">(${reasonStr})</span>`;
            if (descStr) subRowContent += `<span class="numeric-renderer__description">${descStr}</span>`;
            context.sub_row_html = subRowContent ? `<div class="numeric-renderer__sub-row">${subRowContent}</div>` : '';
            break;
        }
        case 'array': {
            const tags = (values as string[]).filter(v => v && v.trim() !== '');
            context.count = tags.length;
            context.tags_html = tags.length > 0 
              ? tags.map(tag => `<span class="array-renderer__tag-chip" data-value="${tag}">${tag}</span>`).join('')
              : `<span class="array-renderer__empty-text">空</span>`;
            break;
        }
        case 'list-of-objects': {
            const objects = (values as Array<Record<string, string>>);
            context.count = objects.length;
            
            // The template for this type is for a SINGLE object
            const cardTemplate = `
              <div class="object-card">
                ${(definition.structure?.parts || []).map(partDef => `
                  <div class="object-card__property">
                    <span class="object-card__label">${partDef.label || partDef.key}</span>
                    <span class="object-card__value">{{${partDef.key}}}</span>
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
                  // Clean up un-replaced placeholders
                  cardHtml = cardHtml.replace(/\{\{.*?\}\}/g, '');
                  return cardHtml;
              }).join('')
              : `<span class="object-list-renderer__empty-text">空</span>`;
            break;
        }
        case 'text': {
            context.value = (values as string[]).join(' ');
            break;
        }
    }
    return context;
};

const renderTemplate = (template: string, context: Record<string, any>): string => {
    let output = template;
    for (const key in context) {
        output = output.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), context[key]);
    }
    // Clean up any un-replaced placeholders
    output = output.replace(/\{\{.*?\}\}/g, '');
    return output;
};


const StyledItemRenderer: React.FC<StyledItemRendererProps> = ({ 
  item, definition, liveCssOverride, liveHtmlOverride, styleOverride, onInteract
}) => {
  const uniqueId = `styled-item-${item._uuid}`;

  const { isOver, setNodeRef, active } = useDroppable({ id: definition.key });

  const isCompatibleDrag = useMemo(() => {
    if (!active || !active.data.current) return false;
    const draggingStyle = active.data.current.style as StyleDefinition;
    if (!draggingStyle) return false;
    return draggingStyle.dataType === definition.type || 
           (draggingStyle.dataType === 'array' && definition.type === 'list-of-objects');
  }, [active, definition.type]);
  
  const { finalHtml, finalCss, finalLayoutClass } = useMemo(() => {
    let styleDef: StyleDefinition | undefined | null = null;
    let htmlTemplate: string | undefined; // Initialize as undefined

    // Priority 1: Live editor overrides (takes precedence for everything)
    if (liveCssOverride !== undefined) {
      styleDef = { css: liveCssOverride, dataType: definition.type, id: 'live', name: 'live' };
      htmlTemplate = liveHtmlOverride;
    } 
    // For all other cases, find the correct style definition first.
    else {
        // Priority 2: Hover preview
        if (styleOverride) {
          styleDef = styleOverride;
        }
        // Priority 3: Saved style from definition
        else if (definition.styleId && definition.styleId !== 'style_default') {
          styleDef = styleService.getStyleDefinition(definition.styleId);
        }
        
        // Fallback to default if no specific style is found or applied
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
            }
        }
        
        // Now that we have the correct styleDef, get its html template.
        htmlTemplate = styleDef?.html;
    }

    // Final fallback if html template is STILL not found
    if (typeof htmlTemplate !== 'string') {
        const fallbackDefault = DEFAULT_STYLE_UNITS.find(u => u.dataType === definition.type);
        htmlTemplate = fallbackDefault?.html || '';
    }
    
    const context = buildDataContext(item, definition);
    const finalHtml = renderTemplate(htmlTemplate, context);

    // CSS Scoping
    const rawCss = styleDef?.css;
    const scopedCss = rawCss ? rawCss.replace(
      /([^\r\n,{}]+)(,(?=[^}]*{)|s*?{)/g,
      (match, selector) => {
        if (selector.trim().startsWith('@') || selector.trim().startsWith(':root') || selector.trim().startsWith('body')) return selector + match.slice(selector.length);
        const scopedSelector = selector.split(',').map(part => `#${uniqueId} ${part.trim()}`).join(', ');
        return scopedSelector + match.slice(selector.length);
      }
    ) : null;

    // Layout class for text
    let layoutClass = '';
    if (definition.type === 'text') {
        const text = (item.values as string[]).join(' ');
        layoutClass = text.length > 20 ? 'status-item-row--text-block' : 'status-item-row--text-inline';
    }

    return { finalHtml, finalCss: scopedCss, finalLayoutClass: layoutClass };

  }, [uniqueId, liveCssOverride, liveHtmlOverride, styleOverride, definition, item]);

  const IconComponent = definition.icon && (LucideIcons as any)[definition.icon] ? (LucideIcons as any)[definition.icon] : HelpCircle;
  const displayName = definition.name || item.key;
  const dropzoneClass = isOver && isCompatibleDrag ? 'droppable-active' : '';

  return (
    <div id={uniqueId} ref={setNodeRef} className={dropzoneClass}>
      <div 
        className={`status-item-row status-item-row--${definition.type} ${finalLayoutClass}`}
        onClick={(e) => {
            if (!onInteract) return;
            // Handle specific interactions for array/list types
            const target = e.target as HTMLElement;
            const chip = target.closest('[data-value]');
            if (chip) {
                onInteract(item, chip.getAttribute('data-value') || '');
            } else {
                onInteract(item);
            }
        }}
        title={`Key: ${item.key}`}
      >
        <div className="status-item-row__label">
            <IconComponent size={14} className="status-item-row__icon" />
            <span>{displayName}</span>
            {item.user_modified && (
                <span title="用户已锁定，AI无法修改" className="status-item-row__lock-icon">
                    <Lock size={10} />
                </span>
            )}
        </div>
        <div className="status-item-row__content" dangerouslySetInnerHTML={{ __html: finalHtml }} />
      </div>
      {finalCss && <style>{finalCss}</style>}
    </div>
  );
};

export default StyledItemRenderer;