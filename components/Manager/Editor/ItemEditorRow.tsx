
import React, { useState, useEffect, useRef } from 'react';
import { StatusBarItem, ItemDefinition } from '../../../types';
import { Trash2, Plus, X, Lock, LockOpen, ChevronUp, ChevronDown, Check, Edit2 } from 'lucide-react';
import './ItemEditorRow.css';

interface ItemEditorRowProps { 
  allDefinitions?: ItemDefinition[];
  existingKeysInCategory?: string[];
  item: StatusBarItem; 
  uiType: 'text' | 'numeric' | 'array';
  definition?: ItemDefinition;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (newItem: StatusBarItem) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isOverlay?: boolean; 
}

const ItemEditorRow: React.FC<ItemEditorRowProps> = ({ 
  allDefinitions = [], 
  existingKeysInCategory = [], 
  item, uiType, definition, index, isFirst, isLast, 
  onChange, onDelete, onMoveUp, onMoveDown, isOverlay = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = window.innerWidth <= 768;

  const [isAddingTag, setIsAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const keySectionRef = useRef<HTMLDivElement>(null); 
  const [suggestions, setSuggestions] = useState<ItemDefinition[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => { 
    if (isOverlay) return; 
    const handleClickOutside = (event: MouseEvent) => {
        if (keySectionRef.current && !keySectionRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOverlay]); 

  const updateSuggestions = (filterText: string = '') => {
    let filteredDefs = allDefinitions.filter(def => def.defaultCategory === item.category);
    filteredDefs = filteredDefs.filter(def => !existingKeysInCategory.includes(def.key));

    if (filterText) {
        const lowerFilter = filterText.toLowerCase();
        filteredDefs = filteredDefs.filter(def => 
            def.key.toLowerCase().includes(lowerFilter) ||
            (def.name && def.name.toLowerCase().includes(lowerFilter))
        );
    }
    setSuggestions(filteredDefs);
  };

  const handleKeyChange = (newKey: string) => {
    notifyChange({ ...item, key: newKey });
    if (showSuggestions) updateSuggestions(newKey);
  }; 

  const toggleSuggestions = () => {
    if (!showSuggestions) updateSuggestions('');
    setShowSuggestions(prev => !prev);
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

  const handleSuggestionClick = (def: ItemDefinition) => { 
      let newValues: string[];
      if (def.structure?.parts) {
          newValues = new Array(def.structure.parts.length).fill('');
          if (def.structure.parts.includes('max')) {
              const maxIdx = def.structure.parts.indexOf('max');
              newValues[maxIdx] = '100';
          }
          if (def.structure.parts.includes('current') || def.structure.parts.includes('value')) {
               const valIdx = Math.max(def.structure.parts.indexOf('current'), def.structure.parts.indexOf('value'));
               newValues[valIdx] = '0';
          }
      } else {
          switch (def.type) {
              case 'numeric': newValues = ['0', '100', '', '', '']; break;
              case 'array': newValues = []; break;
              default: newValues = ['']; break;
          }
      }
      
      onChange({ ...item, key: def.key, values: newValues, user_modified: true, source_id: 9999 });
      setShowSuggestions(false);
  }; 

  const handleValueChange = (index: number, val: string) => {
    const values = [...(item.values || [])];
    values[index] = val;
    for (let i = 0; i <= index; i++) {
        if (values[i] === undefined) values[i] = '';
    }
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
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), 
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
    readOnly: isOverlay 
  };

  const renderDynamicInputs = () => {
    const parts = definition?.structure?.parts || ['current', 'max', 'change', 'reason', 'description'];
    const labels = definition?.structure?.labels || ['当前', '最大', '变化', '原因', '描述'];
    const values = item.values || [];

    return (
      <div className="item-editor-row__dynamic-grid">
          {parts.map((part, idx) => (
              <div key={idx} className="item-editor-row__dynamic-cell">
                  <input 
                      className="item-editor-row__input"
                      placeholder={labels[idx] || part}
                      value={values[idx] || ''}
                      onChange={e => handleValueChange(idx, e.target.value)}
                      {...commonInputProps}
                  />
                  <span className="item-editor-row__field-label">{labels[idx] || part}</span>
              </div>
          ))}
      </div>
    );
  };

  const renderArrayInput = () => {
    return (
      <div className="item-editor-row__array-inputs">
        {item.values.map((tag, idx) => (
          <div key={idx} className="item-editor-row__tag-chip">
            {tag}
            {!isOverlay && (
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
            )}
          </div>
        ))}
        
        {!isOverlay && (isAddingTag ? (
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
        ))}
      </div>
    );
  };

  if (!isEditing && isMobile && !isOverlay) {
      const summaryValue = item.values.join(uiType === 'array' ? ', ' : ' | ') || '(空)';
      const displayName = definition?.name || item.key;
      const isNamed = !!definition?.name;

      return (
        <div className="item-editor-row item-editor-row--collapsed">
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
      className={`item-editor-row ${isMobile ? 'item-editor-row--expanded' : ''} ${item.user_modified ? 'item-editor-row--locked' : ''} ${isOverlay ? 'item-editor-row--overlay' : ''}`}
    >
      {isMobile && !isOverlay && (
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
        <div className="item-editor-row__move-actions">
            <button onClick={onMoveUp} disabled={isFirst} className="item-editor-row__move-btn" title="上移">
                <ChevronUp size={16} />
            </button>
            <button onClick={onMoveDown} disabled={isLast} className="item-editor-row__move-btn" title="下移">
                <ChevronDown size={16} />
            </button>
        </div>
      )}

      <div className="item-editor-row__key-section" ref={keySectionRef}>
        {definition?.name && (
            <span className="item-editor-row__display-name">
                {definition.name}
            </span>
        )}
        <div className="item-editor-row__key-input-wrapper">
            <input 
              className={`item-editor-row__input item-editor-row__input--key ${definition?.name ? 'with-display-name' : ''}`}
              value={item.key}
              onChange={e => handleKeyChange(e.target.value)}
              placeholder="键名"
              {...commonInputProps}
            />
            {!isOverlay && (
                <button onClick={toggleSuggestions} className="item-editor-row__suggestion-toggle">
                    <ChevronDown size={16} className={showSuggestions ? 'open' : ''} />
                </button>
            )}
        </div>
        {showSuggestions && !isOverlay && ( 
            <div className="item-editor-row__suggestions-list animate-fade-in">
                {suggestions.length > 0 ? suggestions.map(def => (
                    <div key={def.key} className="item-editor-row__suggestion-item" onClick={() => handleSuggestionClick(def)}>
                        <div>
                            <div className="item-editor-row__suggestion-key">{def.key}</div>
                            <div className="item-editor-row__suggestion-name">{def.name}</div>
                        </div>
                        <div className="item-editor-row__suggestion-type">{def.type}</div>
                    </div>
                )) : (
                    <div className="item-editor-row__suggestion-empty">无可用选项</div>
                )}
            </div>
        )} 
        {!isMobile && !isOverlay && (
            <button onClick={toggleLock} className="item-editor-row__lock-toggle">
            {item.user_modified ? <Lock size={12} /> : <LockOpen size={12} />}
            <span>{item.user_modified ? '已锁定' : '自动更新'}</span>
            </button>
        )}
      </div>

      <div className="item-editor-row__value-section">
        {uiType === 'numeric' && renderDynamicInputs()}
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

      {!isOverlay && (
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
      )}
    </div>
  );
};

export default ItemEditorRow;
