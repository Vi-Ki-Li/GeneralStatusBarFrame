import React, { useMemo } from 'react';
import { StatusBarItem, CategoryDefinition, ItemDefinition } from '../../../types';
import ItemEditorRow from './ItemEditorRow';
import * as LucideIcons from 'lucide-react';
import { PlusCircle, CircleHelp } from 'lucide-react';
import { getItemDefinition } from '../../../services/definitionRegistry';
import { v4 as uuidv4 } from 'uuid';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
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
  const IconComponent = categoryDef.icon && (LucideIcons as any)[categoryDef.icon] 
    ? (LucideIcons as any)[categoryDef.icon] 
    : CircleHelp;

  // 核心修复: 确保所有条目都有一个稳定的 UI ID
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      _uuid: item._uuid || uuidv4()
    }));
  }, [items]);

  const getItemId = (item: StatusBarItem) => item._uuid!;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = processedItems.findIndex((item) => getItemId(item) === active.id);
      const newIndex = processedItems.findIndex((item) => getItemId(item) === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
          // 在原始数据上执行移动
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
      _uuid: uuidv4(),
      key: '新条目',
      values: [],
      category: categoryKey,
      source_id: 9999,
      user_modified: true
    };
    onUpdateItems([...items, newItem]);
  };

  return (
    <div className="category-editor">
      <div className="category-editor__header">
        <IconComponent size={18} className="category-editor__header-icon" />
        <span className="category-editor__header-name">{categoryDef.name}</span>
        <span className="category-editor__header-key">({categoryKey})</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={processedItems.map(item => getItemId(item))} strategy={verticalListSortingStrategy}>
            <div className="category-editor__item-list">
                {processedItems.map((item, idx) => {
                    const def = getItemDefinition(itemDefinitions, item.key);
                    const uniqueId = getItemId(item);
                    
                    return (
                        <SortableItem key={uniqueId} id={uniqueId}>
                            {(dragListeners, isDragging) => (
                                <ItemEditorRow 
                                    allDefinitions={Object.values(itemDefinitions)}
                                    // 过滤时使用原始的 key 列表
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