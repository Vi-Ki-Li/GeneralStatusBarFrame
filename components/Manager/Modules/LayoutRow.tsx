import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LayoutRow as LayoutRowData } from '../../../types/layout';
import { ItemDefinition } from '../../../types';
import { GripVertical, Box } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './LayoutRow.css';

interface LayoutRowProps {
  row: LayoutRowData;
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

  const itemDef = allDefinitions[row.items[0]?.key];
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
          <span>未知组件</span>
        )}
      </div>
    </div>
  );
};

export default LayoutRow;
