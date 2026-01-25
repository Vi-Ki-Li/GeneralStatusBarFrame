import React, { useState, useEffect } from 'react';
import { CategoryDefinition } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import IconPicker from '../../Shared/IconPicker';
import { X, Save, ChevronRight, LayoutList, LayoutGrid, Tags } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './CategoryDrawer.css';

interface CategoryDrawerProps {
  category: CategoryDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (def: CategoryDefinition) => void;
  existingKeys: string[];
}

const CategoryDrawer: React.FC<CategoryDrawerProps> = ({ 
  category, isOpen, onClose, onSave, existingKeys 
}) => {
  const toast = useToast();
  
  const [formData, setFormData] = useState<CategoryDefinition>({
    key: '', name: '', icon: 'CircleHelp', order: 99, layout_mode: 'list', grid_columns: 2, scope: 'character'
  });
  const [isNew, setIsNew] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({ 
        ...category, 
        layout_mode: category.layout_mode || 'list', 
        grid_columns: category.grid_columns || 2,
        scope: category.scope || 'character' // 保证旧数据兼容性
      });
      setIsNew(false);
    } else {
      setFormData({ key: '', name: '', icon: 'CircleHelp', order: 99, layout_mode: 'list', grid_columns: 2, scope: 'character' });
      setIsNew(true);
    }
  }, [category, isOpen]);

  const handleChange = (field: keyof CategoryDefinition, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.key.trim()) { toast.error("必须填写唯一键 (Key)"); return; }
    if (isNew && existingKeys.includes(formData.key)) { toast.error("该 Key 已存在，请使用唯一的 Key"); return; }
    if (!formData.name.trim()) { toast.error("必须填写显示名称"); return; }

    // 【重要】作用域变更警告
    const originalScope = category?.scope || 'character';
    if (originalScope === 'character' && formData.scope === 'shared') {
        toast.warning('作用域已变更为“共享”', {
            description: `分类 "${formData.name}" 中已存在的角色数据将被隐藏。此操作可逆。`
        });
    } else if (originalScope === 'shared' && formData.scope === 'character') { 
        toast.warning('作用域已变更为“角色”', {
            description: `分类 "${formData.name}" 中已存在的共享数据将被隐藏。此操作可逆。`
        });
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const IconDisplay = (LucideIcons as any)[formData.icon] || LucideIcons.CircleHelp;

  return (
    <>
      <div className="drawer__overlay" onClick={onClose} />
      <div className="drawer__panel animate-slide-in">
        <div className="drawer__header">
            <h3 className="drawer__title">{isNew ? '新建分类' : `编辑分类: ${formData.name}`}</h3>
            <button onClick={onClose} className="drawer__close-btn"><X size={24} /></button>
        </div>

        <div className="drawer__content">
            <div className="form-group">
                <label className="form-label">Key (分类代码)</label>
                <input className="form-input" value={formData.key} onChange={e => handleChange('key', e.target.value)} placeholder="e.g. ST, CP, INV" disabled={!isNew} />
            </div>

            <div className="form-group">
                <label className="form-label">显示名称 (Name)</label>
                <input className="form-input" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. 角色状态" />
            </div>
            
            <div className="form-group">
                <label className="form-label">作用域 (Scope)</label>
                <select className="form-input" value={formData.scope || 'character'} onChange={e => handleChange('scope', e.target.value)}>
                    <option value="character">角色数据 (Character)</option>
                    <option value="shared">共享数据 (Shared)</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">布局模式 (Layout)</label>
                <div className="layout-selector">
                    {[
                        { id: 'list', label: '列表', icon: LayoutList },
                        { id: 'grid', label: '网格', icon: LayoutGrid },
                        { id: 'tags', label: '流式标签', icon: Tags },
                    ].map(mode => {
                        const Icon = mode.icon;
                        const isSelected = formData.layout_mode === mode.id;
                        return (
                            <button key={mode.id} onClick={() => handleChange('layout_mode', mode.id)} className={`layout-selector__btn ${isSelected ? 'active' : ''}`}>
                                <Icon size={20} />
                                <span className="layout-selector__label">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {formData.layout_mode === 'grid' && (
                <div className="form-group animate-fade-in">
                    <label className="form-label">网格列数: {formData.grid_columns || 2}</label>
                    <input type="range" min="2" max="4" step="1" value={formData.grid_columns || 2} onChange={e => handleChange('grid_columns', parseInt(e.target.value))} className="form-range-slider" />
                    <div className="form-range-labels"><span>2列</span><span>3列</span><span>4列</span></div>
                </div>
            )}

            <div className="form-group">
                <label className="form-label">排序权重 (Order)</label>
                <input type="number" className="form-input" value={formData.order} onChange={e => handleChange('order', parseInt(e.target.value))} />
            </div>

            <div className="form-group">
                <label className="form-label">图标 (Icon)</label>
                <div onClick={() => setShowIconPicker(!showIconPicker)} className="icon-selector__display">
                    <div className="icon-selector__display-info">
                        <IconDisplay size={24} />
                        <span>{formData.icon}</span>
                    </div>
                    <ChevronRight size={16} className={`icon-selector__arrow ${showIconPicker ? 'open' : ''}`} />
                </div>
                {showIconPicker && (
                    <div className="icon-selector__picker-wrapper glass-panel">
                        <IconPicker selectedIcon={formData.icon} onSelect={(icon) => { handleChange('icon', icon); setShowIconPicker(false); }} />
                    </div>
                )}
            </div>
        </div>

        <div className="drawer__footer">
            <button onClick={onClose} className="btn btn--ghost">取消</button>
            <button onClick={handleSave} className="btn btn--primary"><Save size={16} /> 保存分类</button>
        </div>
      </div>
    </>
  );
};

export default CategoryDrawer;