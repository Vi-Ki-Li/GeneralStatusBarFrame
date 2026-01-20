
import React, { useMemo, useState } from 'react';
import { StatusBarItem, CategoryDefinition, ItemDefinition } from '../../../types';
import ItemEditorRow from './ItemEditorRow';
import * as LucideIcons from 'lucide-react';
import { PlusCircle, CircleHelp } from 'lucide-react';
import { getItemDefinition } from '../../../services/definitionRegistry';
import { v4 as uuidv4 } from 'uuid';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import './CategoryEditor.css';

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
  const [activeId, setActiveId] = useState<string | null>(null);

  const IconComponent = categoryDef.icon && (LucideIcons as any)[categoryDef.icon] 
    ? (LucideIcons as any)[categoryDef.icon] 
    : CircleHelp;

  // 获取稳定的 ID。由于父组件 DataCenter 已经确保了 uuid 的存在，
  // 这里我们只需要简单地返回它。如果万一缺失（极罕见），使用 fallback 保持不崩溃，但不再尝试修补。
  const getItemId = (item: StatusBarItem, index: number) => {
      return item._uuid || `fallback-id-${categoryKey}-${index}`;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { 
        activationConstraint: { distance: 5 } 
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item, idx) => getItemId(item, idx) === active.id);
      const newIndex = items.findIndex((item, idx) => getItemId(item, idx) === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(items, oldIndex, newIndex);
          onUpdateItems(newOrder);
      }
    }
  };

  const handleItemChange = (index: number, newItem: StatusBarItem) => {
    const newItems: StatusBarItem[] = [...items];
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
      _uuid: uuidv4(),
      key: '新条目',
      values: [],
      category: categoryKey,
      source_id: 9999,
      user_modified: true
    };
    onUpdateItems([...items, newItem]);
  };

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return items.find((item, idx) => getItemId(item, idx) === activeId);
  }, [activeId, items]);

  return (
    <div className="category-editor">
      <div className="category-editor__header">
        <IconComponent size={18} className="category-editor__header-icon" />
        <span className="category-editor__header-name">{categoryDef.name}</span>
        <span className="category-editor__header-key">({categoryKey})</span>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
            items={items.map((item, idx) => getItemId(item, idx))} 
            strategy={verticalListSortingStrategy}
        >
            <div className="category-editor__item-list">
                {items.map((item, idx) => {
                    const def = getItemDefinition(itemDefinitions, item.key);
                    const uniqueId = getItemId(item, idx);
                    
                    return (
                        <SortableItem key={uniqueId} id={uniqueId}>
                            {(dragListeners, isDragging) => (
                                <ItemEditorRow 
                                    allDefinitions={Object.values(itemDefinitions)}
                                    existingKeysInCategory={items.map(i => i.key)}
                                    index={idx}
                                    item={item} 
                                    uiType={def.type}
                                    definition={def}
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

        <DragOverlay>
           {activeItem ? (
               <div style={{ transform: 'scale(1.02)', opacity: 0.95 }}>
                   <ItemEditorRow 
                        item={activeItem}
                        uiType={getItemDefinition(itemDefinitions, activeItem.key).type}
                        definition={getItemDefinition(itemDefinitions, activeItem.key)}
                        index={0} isFirst={false} isLast={false}
                        onChange={() => {}} onDelete={() => {}}
                        isOverlay={true}
                    />
               </div>
           ) : null}
        </DragOverlay>

      </DndContext>

      <button 
        onClick={handleAddItem}
        className="category-editor__add-btn"
    >
        <PlusCircle size={16} />
        添加新条目
    </button>
    </div>
  );
};

export default CategoryEditor;
