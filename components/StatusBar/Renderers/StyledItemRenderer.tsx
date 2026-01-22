import React, { useMemo } from 'react';
import { StatusBarItem, ItemDefinition, StyleDefinition } from '../../../types';
import { styleService } from '../../../services/styleService';
import { useDroppable } from '@dnd-kit/core';

interface StyledItemRendererProps {
  item: StatusBarItem;
  definition: ItemDefinition;
  children: React.ReactNode;
  liveCssOverride?: string; // For StyleEditor's live preview
  styleOverride?: StyleDefinition | null; // For hover preview in StyleManager
}

const StyledItemRenderer: React.FC<StyledItemRendererProps> = ({ 
  item, definition, children, liveCssOverride, styleOverride 
}) => {
  const uniqueId = useMemo(() => `styled-item-${item._uuid}`, [item._uuid]);

  const { isOver, setNodeRef, active } = useDroppable({
    id: definition.key,
  });

  const isCompatibleDrag = useMemo(() => {
    if (!active || !active.data.current) return false;
    const draggingStyle = active.data.current.style as StyleDefinition;
    if (!draggingStyle) return false;

    const styleType = draggingStyle.dataType;
    const itemType = definition.type;
    
    if (styleType === 'numeric' && itemType === 'numeric') return true;
    if (styleType === 'array' && itemType === 'array') return true;
    if (styleType === 'list-of-objects' && itemType === 'list-of-objects') return true;
    if (styleType === 'text' && itemType === 'text') return true;

    return false;
  }, [active, definition.type]);

  const cssToInject = useMemo(() => {
    let rawCss: string | undefined | null = null;

    // Priority 1: Live editor CSS
    if (liveCssOverride !== undefined) {
      rawCss = liveCssOverride;
    } 
    // Priority 2: Hover preview CSS (check for compatibility)
    else if (styleOverride) {
      let compatible = false;
      const styleType = styleOverride.dataType;
      const itemType = definition.type;

      if (styleType === 'numeric' && itemType === 'numeric') compatible = true;
      else if (styleType === 'array' && itemType === 'array') compatible = true;
      else if (styleType === 'list-of-objects' && itemType === 'list-of-objects') compatible = true;
      else if (styleType === 'text' && itemType === 'text') compatible = true;
      
      if (compatible) {
        rawCss = styleOverride.css;
      }
    }
    
    // Priority 3: Saved style from definition (if no higher priority matched)
    if (rawCss === null && definition.styleId && definition.styleId !== 'style_default') {
      const savedStyle = styleService.getStyleDefinition(definition.styleId);
      rawCss = savedStyle?.css;
    }

    if (!rawCss) {
      return null;
    }

    const scopedCss = rawCss.replace(
      /([^\r\n,{}]+)(,(?=[^}]*{)|s*?{)/g,
      (match, selector) => {
        if (selector.trim().startsWith('@')) return selector + match.slice(selector.length);
        const scopedSelector = selector.split(',').map(part => `#${uniqueId} ${part.trim()}`).join(', ');
        return scopedSelector + match.slice(selector.length);
      }
    );

    return scopedCss;
  }, [uniqueId, liveCssOverride, styleOverride, definition]);
  
  const dropzoneClass = isOver && isCompatibleDrag ? 'droppable-active' : '';

  return (
    <div id={uniqueId} ref={setNodeRef} className={dropzoneClass}>
      {cssToInject && <style>{cssToInject}</style>}
      {children}
    </div>
  );
};

export default StyledItemRenderer;