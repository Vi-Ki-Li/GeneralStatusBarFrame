import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { StatusBarData, CategoryDefinition } from '../../../types';
import DraggableCategoryCard from './DraggableCategoryCard';
import './LayoutComposer.css';

interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const LayoutComposer: React.FC<LayoutComposerProps> = ({ data, onUpdate }) => {
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);

  // 从 props 同步并排序分类
  useEffect(() => {
    const sorted = (Object.values(data.categories || {}) as CategoryDefinition[]).sort(
      (a, b) => a.order - b.order
    );
    setCategories(sorted);
  }, [data.categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 要求鼠标移动10像素后才激活拖拽，防止误操作
      activationConstraint: {
        distance: 10,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex(item => item.key === active.id);
        const newIndex = items.findIndex(item => item.key === over.id);
        
        const newSortedItems = arrayMove(items, oldIndex, newIndex);

        // 更新 order 属性并持久化
        const updatedCategoriesMap = { ...data.categories };
        newSortedItems.forEach((cat, index) => {
            updatedCategoriesMap[cat.key] = { ...cat, order: index };
        });

        onUpdate({ ...data, categories: updatedCategoriesMap });
        
        // 返回新数组以更新本地状态，实现即时UI反馈
        return newSortedItems;
      });
    }
  }

  return (
    <div className="layout-composer">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={categories.map(c => c.key)} strategy={rectSortingStrategy}>
          <div className="layout-composer__grid">
            {categories.map((cat) => (
              <DraggableCategoryCard key={cat.key} category={cat} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LayoutComposer;