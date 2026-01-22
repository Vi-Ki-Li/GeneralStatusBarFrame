
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemRenderProps {
    listeners: ReturnType<typeof useSortable>['listeners'];
    isDragging: boolean;
}

interface SortableItemProps {
  id: string;
  children: (props: SortableItemRenderProps) => React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 999 : 1,
    touchAction: 'none'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ listeners, isDragging })}
    </div>
  );
};
