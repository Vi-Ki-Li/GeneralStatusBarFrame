import React from 'react';
import { StatusBarData } from '../../../types';
import { LayoutGrid, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './LayoutComposer.css';

interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const SortableCategoryRow = ({ category, index }: { category: any, index: number }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.key });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    const Icon = (LucideIcons as any)[category.icon] || LucideIcons.CircleHelp;

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="layout-composer__row-wrapper">
             <div className="layout-composer__row glass-panel">
                <div className="layout-composer__row-main">
                    <div {...listeners} className="layout-composer__drag-handle">
                        <GripVertical size={20} />
                    </div>

                    <div className="layout-composer__order-index">
                        {index + 1}
                    </div>
                    <div className="layout-composer__icon-container">
                        <Icon size={18} />
                    </div>
                    <div>
                        <div className="layout-composer__name">{category.name}</div>
                        <div className="layout-composer__key">{category.key}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LayoutComposer: React.FC<LayoutComposerProps> = ({ data, onUpdate }) => {
  const categories = Object.values(data.categories || {}).sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
        const oldIndex = categories.findIndex(c => c.key === active.id);
        const newIndex = categories.findIndex(c => c.key === over?.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newCats = arrayMove(categories, oldIndex, newIndex);
            
            newCats.forEach((cat, idx) => {
                cat.order = idx;
            });

            const newData = { ...data };
            if (!newData.categories) newData.categories = {};
            newCats.forEach(cat => {
                newData.categories[cat.key] = cat;
            });

            onUpdate(newData);
        }
    }
  };

  return (
    <div className="layout-composer">
        <div className="layout-composer__header">
             <h3 className="layout-composer__title">
                <LayoutGrid size={22} />
                布局编排器
             </h3>
             <p className="layout-composer__subtitle">
                拖拽调整分类模块的显示顺序。
             </p>
        </div>

        <div className="layout-composer__list-container">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map(c => c.key)} strategy={verticalListSortingStrategy}>
                    {categories.map((cat, idx) => (
                        <SortableCategoryRow key={cat.key} category={cat} index={idx} />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    </div>
  );
};

export default LayoutComposer;