import React, { useState, useEffect, useMemo } from 'react';
import { ItemDefinition, ItemDefinitionPart, CategoryDefinition, StyleDefinition } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import IconPicker from '../../Shared/IconPicker';
import { styleService } from '../../../services/styleService';
import { DEFAULT_STYLE_UNITS } from '../../../services/defaultStyleUnits'; 
import { X, Save, Eye, ChevronRight, ChevronUp, ChevronDown, Trash2, Plus, LayoutTemplate, UploadCloud, Paintbrush } from 'lucide-react'; // 此处修改1行
import * as LucideIcons from 'lucide-react';
import { generateLorebookContent } from '../../../utils/lorebookInjector';
import './DefinitionDrawer.css';

interface DefinitionDrawerProps {
  definition: ItemDefinition | null;
  categories: { [key: string]: CategoryDefinition };
  isOpen: boolean;
  onClose: () => void;
  onSave: (def: ItemDefinition) => void;
  onInject: (def: ItemDefinition) => Promise<any>;
  existingKeys: string[];
  preselectedCategory?: string | null;
  onGoToStyleEditor: (itemKey: string) => void; // 此处添加1行
}

interface StructurePart {
    key: string;
    label: string;
}

const DefinitionDrawer: React.FC<DefinitionDrawerProps> = ({ 
  definition, categories, isOpen, onClose, onSave, onInject, existingKeys, preselectedCategory, onGoToStyleEditor
}) => { // 此处修改1行
  const toast = useToast();
  
  const [formData, setFormData] = useState<ItemDefinition>({
    key: '', name: '', icon: '', type: 'text', defaultCategory: 'Other', description: '', separator: '|', partSeparator: '@'
  });
  
  const [structureParts, setStructureParts] = useState<StructurePart[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [userStyles, setUserStyles] = useState<StyleDefinition[]>([]);

  useEffect(() => {
    if (isOpen) {
      setUserStyles(styleService.getStyleDefinitions());
      if (definition) {
        setFormData({ 
            ...definition, 
            separator: definition.separator || '|', 
            partSeparator: definition.partSeparator || '@', 
            name: definition.name || '', 
            icon: definition.icon || '' 
        });
        
        if (definition.structure?.parts) {
            setStructureParts(definition.structure.parts);
        } else {
            setStructureParts([]);
        }
        setIsNew(false);
      } else {
        setFormData({ 
            key: '', name: '', icon: '', type: 'text', 
            defaultCategory: preselectedCategory || 'Other', 
            description: '', separator: '|', partSeparator: '@' 
        });
        setStructureParts([]);
        setIsNew(true);
      }
    }
  }, [definition, isOpen, preselectedCategory]);

  const availableStyles = useMemo(() => {
    // 1. Filter out themes from user styles
    const filteredUserStyles = userStyles.filter(s => s.dataType !== 'theme');
    
    // 2. Filter out themes from default styles (and maybe map them to StyleDefinition interface if needed)
    // Cast to StyleDefinition[] because defaults are readonly/special
    const defaultStyles = DEFAULT_STYLE_UNITS.filter(s => s.dataType !== 'theme') as unknown as StyleDefinition[];
    
    return [...defaultStyles, ...filteredUserStyles];
  }, [userStyles]);

  const handleChange = (field: keyof ItemDefinition, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const prepareSaveData = (): ItemDefinition | null => {
    if (!formData.key.trim()) {
      toast.error("必须填写唯一键 (Key)"); return null;
    }
    if (isNew && existingKeys.includes(formData.key)) {
      toast.error("该 Key 已存在，请使用唯一的 Key"); return null;
    }
    
    const toSave = { ...formData };
    if (!toSave.name) delete toSave.name;
    if (!toSave.icon) delete toSave.icon;
    if (!toSave.styleId) delete toSave.styleId;

    if (toSave.type !== 'list-of-objects') { 
        delete toSave.partSeparator;
    } 
    // FIX: Correctly form the structure object with ItemDefinitionPart[]
    if (structureParts.length > 0) {
        toSave.structure = {
            parts: structureParts.map(p => ({ key: p.key.trim(), label: p.label.trim() })).filter(p => p.key),
        };
    } else {
        delete toSave.structure;
    }
    return toSave;
  };

  const handleSave = () => {
    const dataToSave = prepareSaveData();
    if (dataToSave) {
        onSave(dataToSave);
        onClose();
    }
  };

  const handleSaveAndInject = async () => {
    const dataToSave = prepareSaveData();
    if (dataToSave) {
        onSave(dataToSave);
        await onInject(dataToSave);
        onClose();
    }
  };

  const handleGoToStyleEditor = () => { // 此处开始添加8行
    if (formData.key) {
      onGoToStyleEditor(formData.key);
      onClose();
    } else {
      toast.info("请先保存定义以创建 Key");
    }
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

  const applyTemplate = (type: 'numeric-5' | 'numeric-3' | 'numeric-simple' | 'text-simple' | 'list-of-objects') => {
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
              template = [ { key: 'value', label: '数值' } ];
              handleChange('type', 'numeric');
              break;
          case 'list-of-objects':
              template = [ { key: 'name', label: '名称' }, { key: 'description', label: '描述' }];
              handleChange('type', 'list-of-objects');
              break;
          default:
              template = [];
              handleChange('type', 'text');
              break;
      }
      setStructureParts(template);
  };

  const getPreviewContent = () => {
    // Construct a temporary definition object from the current form state
    const tempDef: ItemDefinition = { ...formData };
    if (structureParts.length > 0) {
        // FIX: Reconstruct structure correctly for preview
        tempDef.structure = {
            parts: structureParts
        };
    } else {
        delete tempDef.structure;
    }
    
    // Call the authoritative function
    return generateLorebookContent(tempDef, categories);
  };

  if (!isOpen) return null;

  const categoryList = (Object.values(categories) as CategoryDefinition[]).sort((a, b) => a.order - b.order);
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
                        <option value="list-of-objects">对象列表 (List of Objects)</option> 
                    </select>
                </div>
            </div>

            <div className="form-group-grid">
                <div className="form-group">
                     <label className="form-label">{formData.type === 'list-of-objects' ? '对象分隔符' : '分隔符'}</label> 
                     <input className="form-input" value={formData.separator || '|'} onChange={e => handleChange('separator', e.target.value)} placeholder="默认: |" />
                </div>
                {formData.type === 'list-of-objects' ? ( 
                    <div className="form-group animate-fade-in">
                         <label className="form-label">部分分隔符</label>
                         <input className="form-input" value={formData.partSeparator || '@'} onChange={e => handleChange('partSeparator', e.target.value)} placeholder="默认: @" />
                    </div>
                ) : (
                 <div className="form-group"> 
                    <label className="form-label">图标</label>
                    <div onClick={() => setShowIconPicker(!showIconPicker)} className="icon-selector__display">
                        <div className="icon-selector__display-info">
                            {IconDisplay ? <IconDisplay size={20} /> : <span>无</span>}
                        </div>
                        <ChevronRight size={16} className={`icon-selector__arrow ${showIconPicker ? 'open' : ''}`} />
                    </div>
                </div>
                )}
            </div>
            
            <div className="form-group">
                <label className="form-label">渲染样式 (可选覆盖)</label>
                <div className="def-drawer__style-select-group">
                    <select 
                        className="form-input" 
                        value={formData.styleId || ''}
                        onChange={e => {
                          const selectedValue = e.target.value;
                          handleChange('styleId', selectedValue === '' ? undefined : selectedValue);
                        }}
                    >
                        <option value="">默认 (使用该类型的默认样式)</option>
                        {availableStyles.map(style => (
                            <option key={style.id} value={style.id}>
                                {style.name} ({style.dataType})
                            </option>
                        ))}
                    </select>
                    <button onClick={handleGoToStyleEditor} className="def-drawer__style-link-btn" title="编辑/创建关联样式">
                        <Paintbrush size={16} />
                    </button>
                </div>
            </div>
            
            {formData.type === 'list-of-objects' && ( 
                 <div className="form-group animate-fade-in">
                    <label className="form-label">图标</label>
                    <div onClick={() => setShowIconPicker(!showIconPicker)} className="icon-selector__display">
                        <div className="icon-selector__display-info">
                            {IconDisplay ? <IconDisplay size={20} /> : <span>无</span>}
                        </div>
                        <ChevronRight size={16} className={`icon-selector__arrow ${showIconPicker ? 'open' : ''}`} />
                    </div>
                </div>
            )}
            
            {showIconPicker && ( 
                <div className="icon-selector__picker-wrapper glass-panel">
                    <IconPicker selectedIcon={formData.icon || ''} onSelect={(icon) => { handleChange('icon', icon); setShowIconPicker(false); }} />
                </div>
            )}

            <div className="form-group structure-builder">
                <div className="structure-builder__header">
                    <label className="form-label">数据结构定义</label>
                    <div className="structure-builder__templates">
                        <button onClick={() => applyTemplate('numeric-5')} title="标准5段式 (当前/最大/变化/原因/描述)"><LayoutTemplate size={14}/> 预设数值</button>
                        <button onClick={() => applyTemplate('list-of-objects')} title="对象列表 (名称/描述)"><LayoutTemplate size={14}/> 预设对象</button>
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
                <pre className="format-preview">{getPreviewContent()}</pre>
            </div>

            <div className="form-group">
                <label className="form-label">AI 描述与指令</label>
                <textarea className="form-input" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="告诉 AI 这个条目代表什么..." />
            </div>
        </div>

        <div className="drawer__footer">
            <button onClick={onClose} className="btn btn--ghost">取消</button>
            <div className="drawer__footer-actions">
                <button onClick={handleSave} className="btn btn--ghost"><Save size={16} /> 仅保存</button>
                <button onClick={handleSaveAndInject} className="btn btn--primary">
                    <UploadCloud size={16} /> 保存并注入
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

export default DefinitionDrawer;
