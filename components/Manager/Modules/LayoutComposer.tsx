import React from 'react';
import { StatusBarData } from '../../../types';
import { LayoutGrid, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// DnD Kit
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

// Inner Sortable Component for Category
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
        position: 'relative' as const,
    };

    const Icon = (LucideIcons as any)[category.icon] || LucideIcons.CircleHelp;

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
             <div className="glass-panel" style={{ 
                padding: '16px', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: '1px solid var(--chip-border)',
                background: 'var(--glass-bg)',
                marginBottom: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     {/* Drag Handle */}
                    <div {...listeners} style={{ cursor: 'grab', color: 'var(--text-tertiary)', touchAction: 'none' }}>
                        <GripVertical size={20} />
                    </div>

                    <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, width: '20px' }}>
                        {index + 1}
                    </div>
                    <div style={{ 
                        width: '36px', height: '36px', borderRadius: '8px', 
                        background: 'var(--bg-app)', border: '1px solid var(--chip-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{category.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{category.key}</div>
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
            
            // Update orders
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
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutGrid size={22} style={{ color: 'var(--color-primary)' }} />
                布局编排器
             </h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                拖拽调整分类模块的显示顺序。
             </p>
        </div>

        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
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
