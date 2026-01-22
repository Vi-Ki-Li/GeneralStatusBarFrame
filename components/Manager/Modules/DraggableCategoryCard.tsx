
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryDefinition } from '../../../types';
import * as LucideIcons from 'lucide-react';
import { GripVertical } from 'lucide-react';

interface DraggableCategoryCardProps {
  category: CategoryDefinition;
}

const DraggableCategoryCard: React.FC<DraggableCategoryCardProps> = ({ category }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isDragging ? 'var(--shadow-xl)' : 'var(--shadow-md)',
    cursor: 'grab',
    touchAction: 'none', // 确保在触摸设备上正常工作
    zIndex: isDragging ? 100 : 'auto',
    position: 'relative'
  };

  const IconComponent = (LucideIcons as any)[category.icon] || LucideIcons.CircleHelp;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="draggable-category-card glass-panel"
      {...attributes}
    >
        <div className="draggable-category-card__content">
            <IconComponent size={20} className="draggable-category-card__icon" />
            <div className="draggable-category-card__info">
                <span className="draggable-category-card__name">{category.name}</span>
                <span className="draggable-category-card__key">{category.key}</span>
            </div>
        </div>
        <div {...listeners} className="draggable-category-card__handle" title="拖动排序">
            <GripVertical size={20} />
        </div>
    </div>
  );
};

export default DraggableCategoryCard;
