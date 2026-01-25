import React from 'react';
import { StatusBarItem, CategoryDefinition, ItemDefinition } from '../../../types';
import ItemEditorRow from './ItemEditorRow';
import * as LucideIcons from 'lucide-react';
import { PlusCircle, CircleHelp, Settings } from 'lucide-react'; 
import { getItemDefinition } from '../../../services/definitionRegistry';
import { v4 as uuidv4 } from 'uuid';
import './CategoryEditor.css';

interface CategoryEditorProps {
  categoryKey: string;
  categoryDef: CategoryDefinition;
  itemDefinitions: { [key: string]: ItemDefinition };
  items: StatusBarItem[];
  onUpdateItems: (newItems: StatusBarItem[]) => void;
  onEditDefinition: (itemKey: string) => void;
  onEditCategory: (categoryKey: string) => void; 
}

const CategoryEditor: React.FC<CategoryEditorProps> = ({ 
  categoryKey, categoryDef, itemDefinitions, items, onUpdateItems, onEditDefinition, onEditCategory 
}) => {
  const IconComponent = categoryDef.icon && (LucideIcons as any)[categoryDef.icon] 
    ? (LucideIcons as any)[categoryDef.icon] 
    : CircleHelp;

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

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    // 使用 splice 实现数组元素位置交换
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    onUpdateItems(newItems);
  };

  return (
    <div className="category-editor">
      <div className="category-editor__header">
        <IconComponent size={18} className="category-editor__header-icon" />
        <span className="category-editor__header-name">{categoryDef.name}</span>
        <span className="category-editor__header-key">({categoryKey})</span>
        <button onClick={() => onEditCategory(categoryKey)} className="category-editor__edit-btn" title="编辑此分类">
          <Settings size={14} />
        </button>
      </div>

      <div className="category-editor__item-list">
        {items.map((item, idx) => {
            const def = getItemDefinition(itemDefinitions, item.key);
            // FIX: Pass the correct type for list-of-objects to the editor.
            const uiType = def.type;

            return (
                <ItemEditorRow 
                    key={item._uuid || `item-${idx}`}
                    allDefinitions={Object.values(itemDefinitions)}
                    existingKeysInCategory={items.map(i => i.key)}
                    index={idx}
                    item={item} 
                    uiType={uiType}
                    definition={def}
                    isFirst={idx === 0}
                    isLast={idx === items.length - 1}
                    onChange={(newItem) => handleItemChange(idx, newItem)}
                    onDelete={() => handleDeleteItem(idx)}
                    onMoveUp={() => handleMoveItem(idx, 'up')}
                    onMoveDown={() => handleMoveItem(idx, 'down')}
                    onEditDefinition={onEditDefinition}
                />
            );
        })}
      </div>

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