import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LayoutNode } from '../../../types/layout';
import { ItemDefinition } from '../../../types';
import { GripVertical, Box } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './LayoutRow.css';

interface LayoutRowProps {
  row: LayoutNode;
  allDefinitions: { [key: string]: ItemDefinition };
  isOverlay?: boolean;
}

const LayoutRow: React.FC<LayoutRowProps> = ({ row, allDefinitions, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
    data: {
      row,
      from: 'canvas',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Logic to find a displayable key from the node structure
  let displayKey: string | undefined;
  
  if (row.type === 'item' && row.data?.key) {
      displayKey = row.data.key;
  } else if (row.children && row.children.length > 0) {
      // Traverse children to find an item key for display preview
      // Supports both Row -> Items and Row -> Cols -> Items
      const firstChild = row.children[0];
      if (firstChild.type === 'item' && firstChild.data?.key) {
          displayKey = firstChild.data.key;
      } else if (firstChild.children && firstChild.children.length > 0) {
          const firstGrandChild = firstChild.children[0];
          if (firstGrandChild.type === 'item' && firstGrandChild.data?.key) {
              displayKey = firstGrandChild.data.key;
          }
      }
  }

  const itemDef = displayKey ? allDefinitions[displayKey] : undefined;
  const Icon = itemDef?.icon && (LucideIcons as any)[itemDef.icon] 
    ? (LucideIcons as any)[itemDef.icon] 
    : Box;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layout-row glass-panel ${isDragging ? 'dragging' : ''} ${isOverlay ? 'overlay' : ''}`}
      {...attributes}
    >
      <div className="layout-row__drag-handle" {...listeners}>
        <GripVertical size={20} />
      </div>
      <div className="layout-row__content">
        {itemDef ? (
          <>
            <Icon size={18} className="layout-row__item-icon" />
            <span className="layout-row__item-name">{itemDef.name || itemDef.key}</span>
          </>
        ) : (
          <span>{row.type === 'row' ? '行 (容器)' : '组件'}</span>
        )}
      </div>
    </div>
  );
};

export default LayoutRow;