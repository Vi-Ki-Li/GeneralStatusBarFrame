import React, { useState } from 'react';
import { StatusBarItem, CategoryDefinition, ItemDefinition } from '../../../types';
import ItemEditorRow from './ItemEditorRow';
import * as LucideIcons from 'lucide-react';
import { PlusCircle, CircleHelp } from 'lucide-react';
import { getItemDefinition } from '../../../services/definitionRegistry';

// DnD Kit Imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { v4 as uuidv4 } from 'uuid';

interface CategoryEditorProps {
  categoryKey: string;
  categoryDef: CategoryDefinition;
  itemDefinitions: { [key: string]: ItemDefinition };
  items: StatusBarItem[];
  onUpdateItems: (newItems: StatusBarItem[]) => void;
}

const CategoryEditor: React.FC<CategoryEditorProps> = ({ 
  categoryKey, categoryDef, itemDefinitions, items, onUpdateItems 
}) => {
  const IconComponent = categoryDef.icon && (LucideIcons as any)[categoryDef.icon] 
    ? (LucideIcons as any)[categoryDef.icon] 
    : CircleHelp;

  // We need stable IDs for dnd-kit. Using index as ID is risky if list changes size, 
  // but for simple reordering it might work if we are careful. 
  // A better approach is to wrap items with a temporary ID if they don't have one.
  // Since StatusBarItem doesn't have a UID, we'll map them to objects with IDs locally or just use Key+Index.
  // For simplicity, let's use Key + Index string as unique ID.
  const getItemId = (item: StatusBarItem, index: number) => `${item.key}-${index}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Prevent accidental drags
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item, idx) => getItemId(item, idx) === active.id);
      const newIndex = items.findIndex((item, idx) => getItemId(item, idx) === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
          onUpdateItems(arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  const handleItemChange = (index: number, newItem: StatusBarItem) => {
    const newItems = [...items];
    newItems[index] = newItem;
    onUpdateItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onUpdateItems(newItems);
  };

  const handleAddItem = () => {
    const newItem: StatusBarItem = {
      key: '新条目',
      values: [],
      category: categoryKey,
      source_id: 9999,
      user_modified: true
    };
    onUpdateItems([...items, newItem]);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', 
        color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem' 
      }}>
        <IconComponent size={18} style={{ color: 'var(--color-primary)' }} />
        <span>{categoryDef.name}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>({categoryKey})</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item, idx) => getItemId(item, idx))} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((item, idx) => {
                    const def = getItemDefinition(itemDefinitions, item.key);
                    const uniqueId = getItemId(item, idx);
                    
                    return (
                        <SortableItem key={uniqueId} id={uniqueId}>
                            {(dragListeners, isDragging) => (
                                <ItemEditorRow 
                                    index={idx}
                                    item={item} 
                                    uiType={def.type}
                                    isFirst={idx === 0}
                                    isLast={idx === items.length - 1}
                                    onChange={(newItem) => handleItemChange(idx, newItem)}
                                    onDelete={() => handleDeleteItem(idx)}
                                    dragListeners={dragListeners}
                                />
                            )}
                        </SortableItem>
                    );
                })}
            </div>
        </SortableContext>
      </DndContext>

      <button 
        onClick={handleAddItem}
        style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '10px', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--chip-border)',
        borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
        transition: 'all 0.2s', width: '100%', marginTop: '8px'
        }}
        className="hover-bg-accent"
    >
        <PlusCircle size={16} />
        添加新条目
    </button>
      <style>{`
        .hover-bg-accent:hover {
          background: rgba(var(--color-primary), 0.05) !important;
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default CategoryEditor;