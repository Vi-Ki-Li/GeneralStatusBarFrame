import React, { useMemo } from 'react';
import { StatusBarItem, ItemDefinition, StyleDefinition } from '../../../types';
import { styleService } from '../../../services/styleService';

interface StyledItemRendererProps {
  item: StatusBarItem;
  definition: ItemDefinition;
  children: React.ReactNode;
  liveCssOverride?: string; // For StyleEditor's live preview
}

const StyledItemRenderer: React.FC<StyledItemRendererProps> = ({ item, definition, children, liveCssOverride }) => {
  const uniqueId = useMemo(() => `styled-item-${item._uuid}`, [item._uuid]);

  const styleDef: StyleDefinition | undefined = useMemo(() => {
    if (liveCssOverride !== undefined) {
      return undefined;
    }
    if (definition.styleId && definition.styleId !== 'style_default') {
      return styleService.getStyleDefinition(definition.styleId);
    }
    return undefined;
  }, [definition.styleId, liveCssOverride]);

  const cssToInject = useMemo(() => {
    const rawCss = liveCssOverride ?? styleDef?.css;
    if (!rawCss) {
      return null;
    }

    const scopedCss = rawCss.replace(
      /([^\r\n,{}]+)(,(?=[^}]*{)|s*?{)/g,
      (match, selector) => {
        if (selector.trim().startsWith('@')) {
          return selector + match.slice(selector.length);
        }
        const scopedSelector = selector
          .split(',')
          .map(part => `#${uniqueId} ${part.trim()}`)
          .join(', ');
        return scopedSelector + match.slice(selector.length);
      }
    );

    return scopedCss;
  }, [styleDef, uniqueId, liveCssOverride]);

  return (
    <div id={uniqueId}>
      {cssToInject && <style>{cssToInject}</style>}
      {children}
    </div>
  );
};

export default StyledItemRenderer;
