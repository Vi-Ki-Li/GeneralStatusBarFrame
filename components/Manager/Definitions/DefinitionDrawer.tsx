
import React, { useState, useEffect } from 'react';
import { ItemDefinition, LorebookEntry, CategoryDefinition } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import IconPicker from '../../Shared/IconPicker';
import { X, Save, BookOpen, ChevronRight, Eye } from 'lucide-react';
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

const DefinitionDrawer: React.FC<DefinitionDrawerProps> = ({ 
  definition, categories, isOpen, onClose, onSave, existingKeys 
}) => {
  const toast = useToast();
  
  const [formData, setFormData] = useState<ItemDefinition>({
    key: '', name: '', icon: '', type: 'text', defaultCategory: 'Other', description: '', separator: '|'
  });
  
  // Local state for structure inputs (comma separated strings)
  const [partsInput, setPartsInput] = useState('');
  const [labelsInput, setLabelsInput] = useState('');

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
      setPartsInput(definition.structure?.parts?.join(', ') || '');
      setLabelsInput(definition.structure?.labels?.join(', ') || '');
      setIsNew(false);
    } else {
      setFormData({ key: '', name: '', icon: '', type: 'text', defaultCategory: 'Other', description: '', separator: '|' });
      setPartsInput('');
      setLabelsInput('');
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
    const parts = partsInput.split(',').map(s => s.trim()).filter(s => s);
    const labels = labelsInput.split(',').map(s => s.trim()).filter(s => s);
    
    if (parts.length > 0) {
        toSave.structure = { parts };
        if (labels.length > 0) toSave.structure.labels = labels;
    } else {
        delete toSave.structure;
    }

    onSave(toSave);
    onClose();
  };

  const getPreviewString = () => {
    const { key, type, defaultCategory, separator } = formData;
    const catKey = categories[defaultCategory]?.key || defaultCategory;
    const sep = separator || '|';
    
    // Preview based on structure input
    const parts = partsInput.split(',').map(s => s.trim()).filter(s => s);
    
    let valueExample = '';
    if (parts.length > 0) {
        valueExample = parts.map((p, i) => {
            if (p === 'current' || p === 'value') return '80';
            if (p === 'max') return '100';
            return `[${p}]`;
        }).join(sep);
    } else {
        valueExample = type === 'numeric' ? '100|100' : type === 'array' ? `ItemA${sep}ItemB` : 'TextValue';
    }

    return `[角色^${catKey}|${key}::${valueExample}]`;
  };

  if (!isOpen) return null;

  const categoryList = Object.values(categories).sort((a,b) => a.order - b.order);
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
            <div className="form-group-grid">
                <div className="form-group">
                    <label className="form-label">Key (唯一键)</label>
                    <input className="form-input" value={formData.key} onChange={e => handleChange('key', e.target.value)} placeholder="e.g. HP" disabled={!isNew} />
                </div>
                <div className="form-group">
                    <label className="form-label">显示名称 (Name)</label>
                    <input className="form-input" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. 生命值" />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label icon-label"><Eye size={14} /> 格式预览 (Format Preview)</label>
                <div className="format-preview">{getPreviewString()}</div>
            </div>

            <div className="form-group">
                <label className="form-label">所属分类 (Default Category)</label>
                <select className="form-input" value={formData.defaultCategory} onChange={e => handleChange('defaultCategory', e.target.value)}>
                    {categoryList.map(cat => (<option key={cat.key} value={cat.key}>{cat.name} ({cat.key})</option>))}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">渲染类型 (Type)</label>
                <div className="type-selector">
                    {['text', 'numeric', 'array'].map(type => (
                        <button key={type} onClick={() => handleChange('type', type)} className={`type-selector__btn ${formData.type === type ? 'active' : ''}`}>
                            {type === 'text' ? '文本' : type === 'numeric' ? '数值' : '标签组'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group-grid">
                <div className="form-group">
                     <label className="form-label">分隔符 (Separator)</label>
                     <input className="form-input" value={formData.separator || '|'} onChange={e => handleChange('separator', e.target.value)} placeholder="默认: |" />
                </div>
                 <div className="form-group">
                    <label className="form-label">图标 (Icon)</label>
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

            <div className="form-group">
                <label className="form-label">结构定义 (Parts)</label>
                <input 
                    className="form-input" 
                    value={partsInput} 
                    onChange={e => setPartsInput(e.target.value)} 
                    placeholder="e.g. current, max, change" 
                />
                <span className="form-hint">用逗号分隔部分名称</span>
            </div>

            <div className="form-group">
                <label className="form-label">标签定义 (Labels)</label>
                <input 
                    className="form-input" 
                    value={labelsInput} 
                    onChange={e => setLabelsInput(e.target.value)} 
                    placeholder="e.g. 当前, 最大, 变化" 
                />
                <span className="form-hint">对应 Parts 的中文标签 (可选)</span>
            </div>

            <div className="form-group">
                <label className="form-label">AI 描述与指令 (Description)</label>
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