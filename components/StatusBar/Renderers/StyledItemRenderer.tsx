import React, { useMemo, useEffect } from 'react'; // 此处修改1行
import { StatusBarItem, ItemDefinition, StyleDefinition } from '../../../types';
import { styleService } from '../../../services/styleService';
import { useDroppable } from '@dnd-kit/core';
import NumericRenderer from './NumericRenderer';
import ArrayRenderer from './ArrayRenderer';
import TextRenderer from './TextRenderer';
import ObjectListRenderer from './ObjectListRenderer';

interface StyledItemRendererProps {
  item: StatusBarItem;
  definition: ItemDefinition;
  liveCssOverride?: string; // For StyleEditor's live preview
  styleOverride?: StyleDefinition | null; // For hover preview in StyleManager
  onInteract?: (item: StatusBarItem, value?: string) => void;
}

const StyledItemRenderer: React.FC<StyledItemRendererProps> = ({ 
  item, definition, liveCssOverride, styleOverride, onInteract
}) => {
  const uniqueId = useMemo(() => `styled-item-${item._uuid}`, [item._uuid]);

  const { isOver, setNodeRef, active } = useDroppable({
    id: definition.key,
  });

  useEffect(() => { // 此处开始添加5行
    if (active) { // 只在有拖拽活动时打印，避免刷屏
        console.log(`[Droppable: ${definition.key}] isOver: ${isOver}, active drag item:`, active.data.current?.style?.name);
    }
  }, [isOver, active, definition.key]);

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
  
  const renderContent = () => {
    const label = definition.name || item.key;
    
    const commonProps = {
        item: item,
        label: label,
        icon: definition.icon,
        definition: definition,
        onInteract: onInteract
    };

    switch (definition.type) {
      case 'numeric': return <NumericRenderer {...commonProps} />;
      case 'array': return <ArrayRenderer {...commonProps} />;
      case 'list-of-objects': return <ObjectListRenderer {...commonProps} />;
      default: return <TextRenderer {...commonProps} />;
    }
  };

  const dropzoneClass = isOver && isCompatibleDrag ? 'droppable-active' : '';

  return (
    <div id={uniqueId} ref={setNodeRef} className={dropzoneClass}>
      {cssToInject && <style>{cssToInject}</style>}
      {renderContent()}
    </div>
  );
};

export default StyledItemRenderer;
