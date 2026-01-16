import React, { useState, useRef } from 'react';
import { StatusBarItem, StatusBarCategoryKey } from '../../../types';
import { CATEGORY_MAPPING } from '../../../constants';
import ItemEditorRow from './ItemEditorRow';
import * as LucideIcons from 'lucide-react';
import { PlusCircle } from 'lucide-react';

interface CategoryEditorProps {
  categoryKey: string;
  items: StatusBarItem[];
  onUpdateItems: (newItems: StatusBarItem[]) => void;
}

const CategoryEditor: React.FC<CategoryEditorProps> = ({ categoryKey, items, onUpdateItems }) => {
  const def = CATEGORY_MAPPING[categoryKey as StatusBarCategoryKey] || CATEGORY_MAPPING['Other'];
  
  // Dynamic Icon
  const IconComponent = def.icon && (LucideIcons as any)[def.icon] 
    ? (LucideIcons as any)[def.icon] 
    : LucideIcons.CircleHelp;

  // --- DnD State ---
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Handlers ---

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
      values: [], // Empty values
      category: categoryKey as StatusBarCategoryKey,
      source_id: 9999, // Manual edit
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

  // --- DnD Handlers ---

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragItem.current = index;
      setIsDragging(true);
      // Ghost image effect is automatic in HTML5 DnD, but we can styling the target
      e.dataTransfer.effectAllowed = "move";
      // Hack to hide the element being dragged but keep the ghost
      // setTimeout(() => { e.target.style.opacity = '0.5'; }, 0); 
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragOverItem.current = index;
      
      // Real-time swapping (Visual Feedback)
      // Note: This commits state on every hover which might be heavy for huge lists,
      // but perfectly fine for typical Status Bar lists (< 50 items).
      if (dragItem.current !== null && dragItem.current !== index) {
          const newItems = [...items];
          const draggedItemContent = newItems[dragItem.current];
          newItems.splice(dragItem.current, 1);
          newItems.splice(index, 0, draggedItemContent);
          
          dragItem.current = index; // Update reference to new position
          onUpdateItems(newItems);
      }
  };

  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      dragItem.current = null;
      dragOverItem.current = null;
      setIsDragging(false);
      // e.target.style.opacity = '1';
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '12px', 
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontSize: '1rem'
      }}>
        <IconComponent size={18} style={{ color: 'var(--color-primary)' }} />
        <span>{def.name}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>({categoryKey})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, idx) => (
          <ItemEditorRow 
            // 关键修复：使用 idx 作为 key 而不是 `${item.key}-${idx}`。
            // 之前的 key 包含 item.key，导致修改键名时组件会被 React 卸载重装，从而失去焦点。
            // 虽然在 DnD 列表中推荐使用唯一 ID，但在缺乏 UID 的情况下，idx 是保证编辑体验的最佳妥协。
            key={idx} 
            index={idx}
            item={item} 
            uiType={def.uiType}
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
        ))}

        <button 
          onClick={handleAddItem}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            background: 'rgba(0,0,0,0.02)',
            border: '1px dashed var(--chip-border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
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