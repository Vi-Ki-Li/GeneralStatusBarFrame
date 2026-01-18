import React, { useState, useEffect, useRef } from 'react';
import { StatusBarItem, ItemDefinition } from '../../../types';
import { Trash2, Plus, X, Lock, LockOpen, GripVertical, ChevronUp, ChevronDown, Check, Edit2 } from 'lucide-react';
import './ItemEditorRow.css';

interface ItemEditorRowProps {
  item: StatusBarItem;
  uiType: 'text' | 'numeric' | 'array';
  definition?: ItemDefinition;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (newItem: StatusBarItem) => void;
  onDelete: () => void;
  dragListeners?: any;
}

const ItemEditorRow: React.FC<ItemEditorRowProps> = ({ 
  item, uiType, definition, index, isFirst, isLast, 
  onChange, onDelete, dragListeners
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = window.innerWidth <= 768;

  const [isInputActive, setIsInputActive] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const parseNumeric = (val: string) => {
    if (val.includes('@')) {
      const [curr, max] = val.split('@');
      return { curr, max };
    }
    return { curr: val, max: '' };
  };

  const notifyChange = (modifiedItem: StatusBarItem) => {
    onChange({
      ...modifiedItem,
      user_modified: true,
      source_id: 9999
    });
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...item,
      user_modified: !item.user_modified
    });
  };

  const handleKeyChange = (newKey: string) => {
    notifyChange({ ...item, key: newKey });
  };

  const handleNumericChange = (field: 'curr' | 'max' | 'change' | 'reason', val: string) => {
    const values = [...item.values];
    const { curr, max } = parseNumeric(values[0] || '');
    
    let newVal0 = values[0];
    
    if (field === 'curr') newVal0 = max ? `${val}@${max}` : val;
    if (field === 'max') newVal0 = val ? `${curr}@${val}` : curr;

    values[0] = newVal0;
    if (field === 'change') values[1] = val;
    if (field === 'reason') values[2] = val;

    notifyChange({ ...item, values });
  };

  const handleConfirmAddTag = () => {
    const val = tagInputRef.current?.value || '';
    if (val.trim()) {
        const values = [...item.values, val.trim()];
        notifyChange({ ...item, values });
    }
    setIsAddingTag(false);
  };

  const handleTextChange = (val: string) => {
    notifyChange({ ...item, values: [val] });
  };

  const commonInputProps = {
    onFocus: () => setIsInputActive(true),
    onBlur: () => setIsInputActive(false),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), 
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation()
  };

  const renderNumericInput = () => {
    const { curr, max } = parseNumeric(item.values[0] || '');
    const change = item.values[1] || '';
    const reason = item.values[2] || '';

    return (
      <div className="item-editor-row__numeric-inputs">
        <div className="item-editor-row__numeric-group">
            <input 
              className="item-editor-row__input" 
              placeholder="当前" 
              value={curr}
              onChange={e => handleNumericChange('curr', e.target.value)}
              {...commonInputProps}
            />
            <span className="item-editor-row__numeric-separator">/</span>
            <input 
              className="item-editor-row__input" 
              placeholder="最大" 
              value={max}
              onChange={e => handleNumericChange('max', e.target.value)}
              {...commonInputProps}
            />
        </div>
        
        <input 
          className="item-editor-row__input item-editor-row__input--change" 
          placeholder="±变化" 
          value={change}
          onChange={e => handleNumericChange('change', e.target.value)}
          {...commonInputProps}
        />
        <input 
          className="item-editor-row__input item-editor-row__input--reason" 
          placeholder="原因 (选填)" 
          value={reason}
          onChange={e => handleNumericChange('reason', e.target.value)}
          {...commonInputProps}
        />
      </div>
    );
  };

  const renderArrayInput = () => {
    return (
      <div className="item-editor-row__array-inputs">
        {item.values.map((tag, idx) => (
          <div key={idx} className="item-editor-row__tag-chip">
            {tag}
            <button 
              type="button"
              onClick={() => {
                  const values = [...item.values];
                  values.splice(idx, 1);
                  notifyChange({ ...item, values });
              }}
              className="item-editor-row__tag-delete"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        {isAddingTag ? (
            <div className="item-editor-row__tag-add-form">
                <input 
                    ref={tagInputRef}
                    autoFocus
                    placeholder="标签名..."
                    onKeyDown={e => { if (e.key === 'Enter') handleConfirmAddTag(); }}
                    onBlur={() => setIsAddingTag(false)}
                    className="item-editor-row__tag-add-input"
                />
            </div>
        ) : (
            <button 
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="item-editor-row__tag-add-btn"
            >
                <Plus size={12} /> 添加
            </button>
        )}
      </div>
    );
  };

  if (!isEditing && isMobile) {
      const summaryValue = item.values.join(uiType === 'array' ? ', ' : ' ') || '(空)';
      const displayName = definition?.name || item.key;
      const isNamed = !!definition?.name;

      return (
        <div className="item-editor-row item-editor-row--collapsed">
            <div 
               {...dragListeners}
               className="item-editor-row__drag-handle item-editor-row__drag-handle--mobile"
            >
               <GripVertical size={20} />
            </div>
            
            <div 
                className="item-editor-row__summary"
                onClick={() => setIsEditing(true)}
            >
                <div className="item-editor-row__summary-main">
                    <span className="item-editor-row__summary-name">
                        {displayName}
                    </span>
                    {isNamed && (
                        <span className="item-editor-row__summary-key">{item.key}</span>
                    )}
                    <span className="item-editor-row__summary-value">
                        {summaryValue}
                    </span>
                </div>
                <div className="item-editor-row__summary-actions">
                    {item.user_modified && <Lock size={14} className="item-editor-row__lock-icon--active" />}
                    <Edit2 size={16} className="item-editor-row__edit-icon" />
                </div>
            </div>
        </div>
      );
  }

  return (
    <div 
      className={`item-editor-row ${isMobile ? 'item-editor-row--expanded' : ''} ${item.user_modified ? 'item-editor-row--locked' : ''}`}
    >
      {isMobile && (
          <div className="item-editor-row__header--mobile">
              <span className="item-editor-row__title--mobile">编辑条目</span>
              <div className="item-editor-row__actions--mobile">
                  <button onClick={toggleLock} className="item-editor-row__action-btn">
                      {item.user_modified ? <Lock size={18} className="item-editor-row__lock-icon--active" /> : <LockOpen size={18} className="item-editor-row__lock-icon" />}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="item-editor-row__action-btn">
                      <Check size={20} className="item-editor-row__confirm-icon" />
                  </button>
              </div>
          </div>
      )}

      {!isMobile && (
        <div className="item-editor-row__drag-handle">
            <div {...dragListeners}>
                <GripVertical size={18} />
            </div>
        </div>
      )}

      <div className="item-editor-row__key-section">
        {definition?.name && (
            <span className="item-editor-row__display-name">
                {definition.name}
            </span>
        )}
        <input 
          className={`item-editor-row__input item-editor-row__input--key ${definition?.name ? 'with-display-name' : ''}`}
          value={item.key}
          onChange={e => handleKeyChange(e.target.value)}
          placeholder="键名"
          {...commonInputProps}
        />
        {!isMobile && (
            <button onClick={toggleLock} className="item-editor-row__lock-toggle">
            {item.user_modified ? <Lock size={12} /> : <LockOpen size={12} />}
            <span>{item.user_modified ? '已锁定' : '自动更新'}</span>
            </button>
        )}
      </div>

      <div className="item-editor-row__value-section">
        {uiType === 'numeric' && renderNumericInput()}
        {uiType === 'array' && renderArrayInput()}
        {uiType === 'text' && (
          <textarea 
            className="item-editor-row__input item-editor-row__input--textarea"
            value={item.values.join('\n')} 
            onChange={e => handleTextChange(e.target.value)}
            {...commonInputProps}
          />
        )}
      </div>

      <div className="item-editor-row__delete-section">
          <button 
            onClick={onDelete}
            className="item-editor-row__delete-btn"
            title="删除"
          >
            <Trash2 size={16} />
            {isMobile && <span>删除此项</span>}
          </button>
      </div>
    </div>
  );
};

export default ItemEditorRow;