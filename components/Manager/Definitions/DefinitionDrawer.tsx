
import React, { useState, useEffect } from 'react';
import { ItemDefinition, CategoryDefinition } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import IconPicker from '../../Shared/IconPicker';
import { X, Save, Eye, ChevronRight, ChevronUp, ChevronDown, Trash2, Plus, LayoutTemplate } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './DefinitionDrawer.css';

interface DefinitionDrawerProps {
  definition: ItemDefinition | null;
  categories: { [key: string]: CategoryDefinition };
  isOpen: boolean;
  onClose: () => void;
  onSave: (def: ItemDefinition) => void;
  existingKeys: string[];
}

interface StructurePart {
    key: string;
    label: string;
}

const DefinitionDrawer: React.FC<DefinitionDrawerProps> = ({ 
  definition, categories, isOpen, onClose, onSave, existingKeys 
}) => {
  const toast = useToast();
  
  const [formData, setFormData] = useState<ItemDefinition>({
    key: '', name: '', icon: '', type: 'text', defaultCategory: 'Other', description: '', separator: '|'
  });
  
  // Local state for structure builder
  const [structureParts, setStructureParts] = useState<StructurePart[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (definition) {
      setFormData({ 
          ...definition, 
          separator: definition.separator || '|', 
          name: definition.name || '', 
          icon: definition.icon || '' 
      });
      
      // Parse existing structure
      if (definition.structure?.parts) {
          const parts = definition.structure.parts;
          const labels = definition.structure.labels || [];
          const mapped = parts.map((p, i) => ({
              key: p,
              label: labels[i] || p
          }));
          setStructureParts(mapped);
      } else {
          setStructureParts([]);
      }
      setIsNew(false);
    } else {
      setFormData({ key: '', name: '', icon: '', type: 'text', defaultCategory: 'Other', description: '', separator: '|' });
      setStructureParts([]);
      setIsNew(true);
    }
  }, [definition, isOpen]);

  const handleChange = (field: keyof ItemDefinition, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.key.trim()) {
      toast.error("必须填写唯一键 (Key)"); return;
    }
    if (isNew && existingKeys.includes(formData.key)) {
      toast.error("该 Key 已存在，请使用唯一的 Key"); return;
    }
    
    const toSave = { ...formData };
    if (!toSave.name) delete toSave.name;
    if (!toSave.icon) delete toSave.icon;

    // Process Structure
    if (structureParts.length > 0) {
        toSave.structure = {
            parts: structureParts.map(p => p.key),
            labels: structureParts.map(p => p.label)
        };
    } else {
        delete toSave.structure;
    }

    onSave(toSave);
    onClose();
  };

  // --- Structure Editor Logic ---
  const addPart = () => {
      setStructureParts([...structureParts, { key: '', label: '' }]);
  };

  const updatePart = (index: number, field: keyof StructurePart, value: string) => {
      const newParts = [...structureParts];
      newParts[index][field] = value;
      setStructureParts(newParts);
  };

  const removePart = (index: number) => {
      const newParts = [...structureParts];
      newParts.splice(index, 1);
      setStructureParts(newParts);
  };

  const movePart = (index: number, direction: -1 | 1) => {
      if (index + direction < 0 || index + direction >= structureParts.length) return;
      const newParts = [...structureParts];
      const temp = newParts[index];
      newParts[index] = newParts[index + direction];
      newParts[index + direction] = temp;
      setStructureParts(newParts);
  };

  const applyTemplate = (type: 'numeric-5' | 'numeric-3' | 'numeric-simple' | 'text-simple') => {
      let template: StructurePart[] = [];
      switch (type) {
          case 'numeric-5':
              template = [
                  { key: 'current', label: '当前值' },
                  { key: 'max', label: '最大值' },
                  { key: 'change', label: '变化量' },
                  { key: 'reason', label: '原因' },
                  { key: 'description', label: '描述' }
              ];
              handleChange('type', 'numeric');
              break;
          case 'numeric-3':
              template = [
                  { key: 'current', label: '当前' },
                  { key: 'max', label: '最大' },
                  { key: 'description', label: '描述' }
              ];
              handleChange('type', 'numeric');
              break;
          case 'numeric-simple':
              template = [
                  { key: 'value', label: '数值' }
              ];
              handleChange('type', 'numeric');
              break;
          default:
              template = []; // Clear
              handleChange('type', 'text');
              break;
      }
      setStructureParts(template);
  };

  const getPreviewString = () => {
    const { key, defaultCategory, separator } = formData;
    const catKey = categories[defaultCategory]?.key || defaultCategory;
    const sep = separator || '|';
    
    let valueExample = '';
    if (structureParts.length > 0) {
        valueExample = structureParts.map(p => {
            const k = p.key.toLowerCase();
            if (k === 'current' || k === 'value') return '80';
            if (k === 'max') return '100';
            if (k === 'change') return '-5';
            if (k === 'reason') return '原因';
            return `[${p.label || p.key}]`;
        }).join(sep);
    } else {
        valueExample = formData.type === 'numeric' ? '100' : '文本内容';
    }

    return `[${catKey ? '角色^' + catKey : '分类'}|${key}::${valueExample}]`;
  };

  if (!isOpen) return null;

  // FIX: Added explicit types for sort callback arguments to resolve type inference issues.
  const categoryList = Object.values(categories).sort((a: CategoryDefinition, b: CategoryDefinition) => a.order - b.order);
  const IconDisplay = formData.icon && (LucideIcons as any)[formData.icon] ? (LucideIcons as any)[formData.icon] : null;

  return (
    <>
      <div className="drawer__overlay" onClick={onClose} />
      <div className="drawer__panel animate-slide-in">
        <div className="drawer__header">
            <h3 className="drawer__title">{isNew ? '新建条目定义' : `编辑: ${formData.key}`}</h3>
            <button onClick={onClose} className="drawer__close-btn"><X size={24} /></button>
        </div>

        <div className="drawer__content">
            {/* --- Basic Info --- */}
            <div className="form-group-grid">
                <div className="form-group">
                    <label className="form-label">Key (唯一键)</label>
                    <input className="form-input" value={formData.key} onChange={e => handleChange('key', e.target.value)} placeholder="e.g. HP" disabled={!isNew} />
                </div>
                <div className="form-group">
                    <label className="form-label">显示名称</label>
                    <input className="form-input" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. 生命值" />
                </div>
            </div>

            <div className="form-group-grid">
                <div className="form-group">
                    <label className="form-label">所属分类</label>
                    <select className="form-input" value={formData.defaultCategory} onChange={e => handleChange('defaultCategory', e.target.value)}>
                        {categoryList.map(cat => (<option key={cat.key} value={cat.key}>{cat.name} ({cat.key})</option>))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">渲染类型</label>
                    <select className="form-input" value={formData.type} onChange={e => handleChange('type', e.target.value)}>
                        <option value="text">文本 (Text)</option>
                        <option value="numeric">数值 (Numeric)</option>
                        <option value="array">标签组 (Array)</option>
                    </select>
                </div>
            </div>

            <div className="form-group-grid">
                <div className="form-group">
                     <label className="form-label">分隔符</label>
                     <input className="form-input" value={formData.separator || '|'} onChange={e => handleChange('separator', e.target.value)} placeholder="默认: |" />
                </div>
                 <div className="form-group">
                    <label className="form-label">图标</label>
                    <div onClick={() => setShowIconPicker(!showIconPicker)} className="icon-selector__display">
                        <div className="icon-selector__display-info">
                            {IconDisplay ? <IconDisplay size={20} /> : <span>无</span>}
                        </div>
                        <ChevronRight size={16} className={`icon-selector__arrow ${showIconPicker ? 'open' : ''}`} />
                    </div>
                </div>
            </div>
            
            {showIconPicker && (
                <div className="icon-selector__picker-wrapper glass-panel">
                    <IconPicker selectedIcon={formData.icon || ''} onSelect={(icon) => { handleChange('icon', icon); setShowIconPicker(false); }} />
                </div>
            )}

            {/* --- Structure Builder --- */}
            <div className="form-group structure-builder">
                <div className="structure-builder__header">
                    <label className="form-label">数据结构定义</label>
                    <div className="structure-builder__templates">
                        <button onClick={() => applyTemplate('numeric-5')} title="标准5段式 (当前/最大/变化/原因/描述)"><LayoutTemplate size={14}/> 预设数值</button>
                        <button onClick={() => applyTemplate('numeric-3')} title="简易3段式 (当前/最大/描述)"><LayoutTemplate size={14}/> 简易</button>
                    </div>
                </div>
                
                <div className="structure-builder__list">
                    {structureParts.length === 0 ? (
                        <div className="structure-builder__empty">
                            默认结构 (单值)
                        </div>
                    ) : (
                        structureParts.map((part, idx) => (
                            <div key={idx} className="structure-part-row">
                                <div className="structure-part-inputs">
                                    <input 
                                        className="form-input part-input" 
                                        value={part.key} 
                                        onChange={e => updatePart(idx, 'key', e.target.value)}
                                        placeholder="字段Key (e.g. max)"
                                    />
                                    <input 
                                        className="form-input part-input" 
                                        value={part.label} 
                                        onChange={e => updatePart(idx, 'label', e.target.value)}
                                        placeholder="显示标签 (e.g. 最大值)"
                                    />
                                </div>
                                <div className="structure-part-actions">
                                    <button onClick={() => movePart(idx, -1)} disabled={idx === 0}><ChevronUp size={16}/></button>
                                    <button onClick={() => movePart(idx, 1)} disabled={idx === structureParts.length - 1}><ChevronDown size={16}/></button>
                                    <button onClick={() => removePart(idx)} className="delete"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                <button onClick={addPart} className="structure-builder__add-btn">
                    <Plus size={16} /> 添加字段
                </button>
            </div>

            <div className="form-group">
                <label className="form-label icon-label"><Eye size={14} /> 格式预览</label>
                <div className="format-preview">{getPreviewString()}</div>
            </div>

            <div className="form-group">
                <label className="form-label">AI 描述与指令</label>
                <textarea className="form-input" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="告诉 AI 这个条目代表什么..." />
            </div>
        </div>

        <div className="drawer__footer">
            <button onClick={onClose} className="btn btn--ghost">取消</button>
            <button onClick={handleSave} className="btn btn--primary"><Save size={16} /> 保存定义</button>
        </div>
      </div>
    </>
  );
};

export default DefinitionDrawer;
