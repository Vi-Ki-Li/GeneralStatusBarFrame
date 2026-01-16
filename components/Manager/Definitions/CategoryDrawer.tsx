import React, { useState, useEffect } from 'react';
import { CategoryDefinition } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import IconPicker from '../../Shared/IconPicker';
import { X, Save, ChevronRight, LayoutList, LayoutGrid, Tags } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

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
    key: '', name: '', icon: 'CircleHelp', order: 99,
    layout_mode: 'list', grid_columns: 2
  });
  const [isNew, setIsNew] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({ 
        ...category,
        layout_mode: category.layout_mode || 'list',
        grid_columns: category.grid_columns || 2
      });
      setIsNew(false);
    } else {
      setFormData({ 
        key: '', name: '', icon: 'CircleHelp', order: 99,
        layout_mode: 'list', grid_columns: 2
      });
      setIsNew(true);
    }
  }, [category, isOpen]);

  const handleChange = (field: keyof CategoryDefinition, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.key.trim()) {
      toast.error("必须填写唯一键 (Key)");
      return;
    }
    if (isNew && existingKeys.includes(formData.key)) {
      toast.error("该 Key 已存在，请使用唯一的 Key");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("必须填写显示名称");
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const IconDisplay = (LucideIcons as any)[formData.icon] || LucideIcons.CircleHelp;

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.2)', zIndex: 100,
          backdropFilter: 'blur(1px)'
        }}
      />
      <div className="drawer-panel" style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-app)',
        borderLeft: '1px solid var(--chip-border)',
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-5px 0 25px rgba(0,0,0,0.1)',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--chip-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                {isNew ? '新建分类' : `编辑分类: ${formData.name}`}
            </h3>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
                <X size={24} color="var(--text-secondary)" />
            </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="form-group">
                <label className="form-label">Key (分类代码)</label>
                <input 
                    className="form-input" 
                    value={formData.key} 
                    onChange={e => handleChange('key', e.target.value)}
                    placeholder="e.g. ST, CP, INV"
                    disabled={!isNew}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600, opacity: !isNew ? 0.7 : 1 }}
                />
            </div>

            <div className="form-group">
                <label className="form-label">显示名称 (Name)</label>
                <input 
                    className="form-input" 
                    value={formData.name} 
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="e.g. 角色状态"
                />
            </div>

            <div className="form-group">
                <label className="form-label">布局模式 (Layout)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                        { id: 'list', label: '列表', icon: LayoutList },
                        { id: 'grid', label: '网格', icon: LayoutGrid },
                        { id: 'tags', label: '流式标签', icon: Tags },
                    ].map(mode => {
                        const Icon = mode.icon;
                        const isSelected = formData.layout_mode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => handleChange('layout_mode', mode.id)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                    padding: '12px', borderRadius: '8px', border: '1px solid',
                                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--chip-border)',
                                    background: isSelected ? 'rgba(var(--color-primary), 0.05)' : 'var(--glass-bg)',
                                    color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={20} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {formData.layout_mode === 'grid' && (
                <div className="form-group animate-fade-in">
                    <label className="form-label">网格列数: {formData.grid_columns || 2}</label>
                    <input 
                        type="range"
                        min="2" max="4" step="1"
                        value={formData.grid_columns || 2}
                        onChange={e => handleChange('grid_columns', parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        <span>2列</span>
                        <span>3列</span>
                        <span>4列</span>
                    </div>
                </div>
            )}

            <div className="form-group">
                <label className="form-label">排序权重 (Order)</label>
                <input 
                    type="number"
                    className="form-input" 
                    value={formData.order} 
                    onChange={e => handleChange('order', parseInt(e.target.value))}
                />
            </div>

            <div className="form-group">
                <label className="form-label">图标 (Icon)</label>
                <div 
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="glass-panel"
                    style={{ 
                        padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        cursor: 'pointer', border: '1px solid var(--chip-border)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <IconDisplay size={24} color="var(--color-primary)" />
                        <span style={{ fontFamily: 'monospace' }}>{formData.icon}</span>
                    </div>
                    <ChevronRight size={16} color="var(--text-tertiary)" style={{ transform: showIconPicker ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                </div>
                {showIconPicker && (
                    <div className="glass-panel" style={{ marginTop: '8px', padding: '12px', height: '200px', border: '1px solid var(--chip-border)' }}>
                        <IconPicker 
                            selectedIcon={formData.icon} 
                            onSelect={(icon) => { handleChange('icon', icon); setShowIconPicker(false); }} 
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--chip-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--glass-bg)' }}>
            <button onClick={onClose} className="btn btn--ghost">取消</button>
            <button onClick={handleSave} className="btn btn--primary"><Save size={16} /> 保存分类</button>
        </div>
      </div>
      <style>{`
        .form-group { display: flex; flexDirection: column; gap: 8px; }
        .form-label { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); }
        .form-input { 
            padding: 10px; border-radius: 8px; border: 1px solid var(--chip-border); 
            background: var(--bg-app); color: var(--text-primary); outline: none; transition: 0.2s;
        }
        .form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1); }
      `}</style>
    </>
  );
};

export default CategoryDrawer;