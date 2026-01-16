import React, { useState, useRef } from 'react';
import { StatusBarItem, CategoryDefinition, ItemDefinition } from '../../../types';
import ItemEditorRow from './ItemEditorRow';
import * as LucideIcons from 'lucide-react';
import { PlusCircle, CircleHelp } from 'lucide-react';
import { getItemDefinition } from '../../../services/definitionRegistry';

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

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleMove = (index: number, direction: -1 | 1) => {
      if (index + direction < 0 || index + direction >= items.length) return;
      const newItems = [...items];
      const temp = newItems[index];
      newItems[index] = newItems[index + direction];
      newItems[index + direction] = temp;
      onUpdateItems(newItems);
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragItem.current = index;
      setIsDragging(true);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragOverItem.current = index;
      if (dragItem.current !== null && dragItem.current !== index) {
          const newItems = [...items];
          const draggedItemContent = newItems[dragItem.current];
          newItems.splice(dragItem.current, 1);
          newItems.splice(index, 0, draggedItemContent);
          dragItem.current = index;
          onUpdateItems(newItems);
      }
  };

  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      dragItem.current = null;
      dragOverItem.current = null;
      setIsDragging(false);
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

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, idx) => {
            // 关键修正: 对每个 Item 单独查找定义
            const def = getItemDefinition(itemDefinitions, item.key);
            
            return (
              <ItemEditorRow 
                key={idx} 
                index={idx}
                item={item} 
                uiType={def.type} // Pass specific type
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
                onChange={(newItem) => handleItemChange(idx, newItem)}
                onDelete={() => handleDeleteItem(idx)}
                onMove={(dir) => handleMove(idx, dir)}
                onDragStart={onDragStart}
                onDragEnter={onDragEnter}
                onDragEnd={onDragEnd}
                isDragging={isDragging && dragItem.current === idx}
              />
            );
        })}

        <button 
          onClick={handleAddItem}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--chip-border)',
            borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
          className="hover-bg-accent"
        >
          <PlusCircle size={16} />
          添加新条目
        </button>
      </div>
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