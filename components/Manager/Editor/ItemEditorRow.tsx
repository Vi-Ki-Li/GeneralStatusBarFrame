
import React, { useState, useEffect, useRef } from 'react';
import { StatusBarItem } from '../../../types';
import { Trash2, Plus, X, Lock, LockOpen, GripVertical, ChevronUp, ChevronDown, Check, Edit2 } from 'lucide-react';

interface ItemEditorRowProps {
  item: StatusBarItem;
  uiType: 'text' | 'numeric' | 'array';
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (newItem: StatusBarItem) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  // DnD Props
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}

const ItemEditorRow: React.FC<ItemEditorRowProps> = ({ 
  item, uiType, index, isFirst, isLast, 
  onChange, onDelete, onMove,
  onDragStart, onDragEnter, onDragEnd, isDragging
}) => {
  // Mobile Edit State (Expand/Collapse)
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = window.innerWidth <= 768;

  // 状态1: 普通输入框激活状态 (用于 Text/Numeric)
  const [isInputActive, setIsInputActive] = useState(false);
  
  // 状态2: 数组标签添加模式
  const [isAddingTag, setIsAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Parsing logic for numeric values (Current@Max)
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
      user_modified: true, // Auto-lock on edit
      source_id: 9999
    });
  };

  // Toggle Lock Handler
  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...item,
      user_modified: !item.user_modified
    });
  };

  // --- Handlers ---

  const handleKeyChange = (newKey: string) => {
    notifyChange({ ...item, key: newKey });
  };

  // Numeric Handlers
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

  // Array Handlers
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

  // 通用输入框属性绑定
  const commonInputProps = {
    onFocus: () => setIsInputActive(true),
    onBlur: () => setIsInputActive(false),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), 
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation()
  };

  // --- Renders for Edit Mode ---
  const renderNumericInput = () => {
    const { curr, max } = parseNumeric(item.values[0] || '');
    const change = item.values[1] || '';
    const reason = item.values[2] || '';

    return (
      <div className="numeric-inputs-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '120px' }}>
            <input 
            className="editor-input" 
            placeholder="当前" 
            value={curr}
            onChange={e => handleNumericChange('curr', e.target.value)}
            {...commonInputProps}
            style={{ flex: 1 }}
            />
            <span style={{ color: 'var(--text-tertiary)' }}>/</span>
            <input 
            className="editor-input" 
            placeholder="最大" 
            value={max}
            onChange={e => handleNumericChange('max', e.target.value)}
            {...commonInputProps}
            style={{ flex: 1 }}
            />
        </div>
        
        <input 
          className="editor-input change-input" 
          placeholder="±变化" 
          value={change}
          onChange={e => handleNumericChange('change', e.target.value)}
          {...commonInputProps}
        />
        <input 
          className="editor-input reason-input" 
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {item.values.map((tag, idx) => (
          <div key={idx} className="tag-chip" style={{ paddingRight: '4px' }}>
            {tag}
            <button 
              type="button"
              onClick={() => {
                  const values = [...item.values];
                  values.splice(idx, 1);
                  notifyChange({ ...item, values });
              }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', marginLeft: '4px', color: 'var(--text-secondary)' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        {isAddingTag ? (
            <div style={{ 
                display: 'flex', alignItems: 'center', background: 'var(--bg-app)', 
                borderRadius: '6px', border: '1px solid var(--color-primary)'
            }}>
                <input 
                    ref={tagInputRef}
                    autoFocus
                    placeholder="标签名..."
                    onKeyDown={e => { if (e.key === 'Enter') handleConfirmAddTag(); }}
                    onBlur={() => setIsAddingTag(false)}
                    style={{ border: 'none', background: 'transparent', padding: '4px', width: '80px', outline: 'none', color: 'var(--text-primary)' }}
                />
            </div>
        ) : (
            <button 
                type="button"
                onClick={() => setIsAddingTag(true)}
                style={{ 
                    border: '1px dashed var(--chip-border)', background: 'rgba(0,0,0,0.02)', 
                    cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '6px', padding: '4px 8px',
                    fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px'
                }}
            >
                <Plus size={12} /> 添加
            </button>
        )}
      </div>
    );
  };

  // --- Render for Summary (Read Mode) ---
  if (!isEditing && isMobile) {
      const summaryValue = item.values.join(uiType === 'array' ? ', ' : ' ') || '(空)';
      return (
        <div 
            className="editor-row-collapsed"
            onClick={() => setIsEditing(true)}
        >
            <div className="editor-row-summary">
                <span className="editor-row-summary-key">{item.key}</span>
                <span style={{ fontSize: '0.95rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                    {summaryValue}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.user_modified && <Lock size={14} className="text-warning" />}
                <Edit2 size={16} style={{ color: 'var(--color-primary)' }} />
            </div>
        </div>
      );
  }

  // --- Full Editor Render ---
  return (
    <div 
      draggable={!isAddingTag && !isInputActive && !isMobile}
      onDragStart={(e) => !isAddingTag && !isInputActive && onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      className={`item-editor-row ${isMobile ? 'editor-row-expanded' : ''}`}
      style={!isMobile ? {
        display: 'grid',
        gridTemplateColumns: '32px 120px 1fr 40px',
        gap: '12px',
        alignItems: 'start',
        padding: '12px', 
        background: item.user_modified ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.03)', 
        borderRadius: '8px',
        marginBottom: '8px',
        border: item.user_modified ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--chip-border)',
        opacity: isDragging ? 0.4 : 1,
      } : {}}
    >
      {/* Mobile Header in Expanded Mode */}
      {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>编辑条目</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={toggleLock} style={{ border: 'none', background: 'transparent' }}>
                      {item.user_modified ? <Lock size={18} className="text-warning" /> : <LockOpen size={18} color="var(--text-tertiary)" />}
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{ border: 'none', background: 'transparent' }}>
                      <Check size={20} color="var(--color-success)" />
                  </button>
              </div>
          </div>
      )}

      {/* 1. Drag Controls (Desktop Only) */}
      {!isMobile && (
        <div className="row-drag-controls">
            <div className="drag-handle" style={{ cursor: 'grab', color: 'var(--text-tertiary)', padding: '2px' }}>
            <GripVertical size={18} />
            </div>
        </div>
      )}

      {/* 2. Key Input */}
      <div className="row-key-input" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input 
          className="editor-input"
          value={item.key}
          onChange={e => handleKeyChange(e.target.value)}
          placeholder="键名"
          style={{ fontWeight: 600 }}
          {...commonInputProps}
        />
        {!isMobile && (
            <button onClick={toggleLock} style={{ display: 'flex', gap: '4px', border: 'none', background: 'transparent', fontSize: '0.75rem', cursor: 'pointer', color: item.user_modified ? 'var(--color-warning)' : 'var(--text-tertiary)' }}>
            {item.user_modified ? <Lock size={12} /> : <LockOpen size={12} />}
            <span>{item.user_modified ? '锁定' : '自动'}</span>
            </button>
        )}
      </div>

      {/* 3. Value Input */}
      <div className="row-value-input" style={isMobile ? { marginTop: '12px' } : {}}>
        {uiType === 'numeric' && renderNumericInput()}
        {uiType === 'array' && renderArrayInput()}
        {uiType === 'text' && (
          <textarea 
            className="editor-input"
            value={item.values.join('\n')} 
            onChange={e => handleTextChange(e.target.value)}
            style={{ width: '100%', resize: 'vertical', minHeight: '60px' }}
            {...commonInputProps}
          />
        )}
      </div>

      {/* 4. Actions */}
      <div className="row-delete-action" style={isMobile ? { marginTop: '16px', display: 'flex', justifyContent: 'flex-end' } : {}}>
          <button 
            onClick={onDelete}
            style={{ 
            background: isMobile ? 'rgba(239, 68, 68, 0.1)' : 'transparent', 
            border: 'none', 
            color: 'var(--color-danger)', 
            cursor: 'pointer',
            padding: isMobile ? '8px 16px' : '6px',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', gap: '6px'
            }}
            title="删除"
        >
            <Trash2 size={16} />
            {isMobile && <span>删除此项</span>}
        </button>
      </div>

      <style>{`
        .editor-input {
          width: 100%;
          background: var(--bg-app);
          border: 1px solid var(--chip-border);
          border-radius: 6px;
          padding: 8px;
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .editor-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
        .numeric-inputs-container {
            display: flex; gap: 8px; flex-wrap: wrap;
        }
        /* Mobile Specific tweaks for inputs */
        @media (max-width: 768px) {
            .numeric-inputs-container {
                flex-direction: column;
                gap: 10px;
            }
            .change-input, .reason-input { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ItemEditorRow;
