
import React, { useState, useEffect } from 'react';
import { ItemDefinition, LorebookEntry, CategoryDefinition } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import IconPicker from '../../Shared/IconPicker';
import { X, Save, BookOpen, ChevronRight, Eye } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

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
      setIsNew(false);
    } else {
      setFormData({ 
        key: '', name: '', icon: '', type: 'text', defaultCategory: 'Other', description: '', separator: '|' 
      });
      setIsNew(true);
    }
  }, [definition, isOpen]);

  const handleChange = (field: keyof ItemDefinition, value: any) => {
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
    
    // Clean up empty optional fields
    const toSave = { ...formData };
    if (!toSave.name) delete toSave.name;
    if (!toSave.icon) delete toSave.icon;

    onSave(toSave);
    onClose();
  };

  // 生成预览字符串
  const getPreviewString = () => {
    const { key, type, defaultCategory, separator } = formData;
    const catDef = categories[defaultCategory];
    const catName = catDef?.name || defaultCategory; // Use Name or Key? Standard suggests Key in protocol for stability, but Name for human readability. Protocol uses Category KEY.
    // Wait, parser uses Category Key or Name? Parser usually uses Category KEY in bracket `[Char^CAT|...]`. 
    // Let's assume we want to guide user to use Category KEY for stability.
    
    const catKey = catDef?.key || defaultCategory;
    const sep = separator || '|';
    
    let valueExample = '值';
    if (type === 'numeric') valueExample = '100@100';
    if (type === 'array') valueExample = `物品A${sep}物品B`;
    if (type === 'text') valueExample = '文本内容';

    return `[角色^${catKey}|${key}::${valueExample}]`;
  };

  const handleInjectWorldbook = async () => {
    const { key, type, defaultCategory, description, separator, name } = formData;
    const catName = categories[defaultCategory]?.name || defaultCategory;
    const sep = separator || '|';
    const preview = getPreviewString();

    const content = `条目: ${key}\n显示名: ${name || key}\n分类: ${catName}\n类型: ${type}\n分隔符: "${sep}"\n描述: ${description || '（暂无）'}\n\n格式参考：\n${preview}`;

    try {
        const entries = await tavernService.getLorebookEntries();
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const fuzzyRegex = new RegExp(`^${escapedKey}(\\(.*\\))?$`);

        let targetEntry = entries.find(e => fuzzyRegex.test(e.comment));
        
        if (targetEntry) {
            const updatedEntry = { ...targetEntry, content, enabled: true };
            const updatedList = entries.map(e => e.uid === targetEntry!.uid ? updatedEntry : e);
            await tavernService.setLorebookEntries(updatedList);
            toast.success(`世界书条目 "${targetEntry.comment}" 已更新`);
        } else {
            const maxUid = Math.max(...entries.map(e => e.uid), 0);
            const newEntry: LorebookEntry = {
                uid: maxUid + 1,
                key: [key],
                keysecondary: [],
                comment: key, // 新建时使用纯 Key
                content: content,
                enabled: true,
                position: maxUid + 1,
                constant: false,
                selective: false
            };
            await tavernService.setLorebookEntries([...entries, newEntry]);
            toast.success(`新建世界书条目 "${key}"`);
        }
    } catch (e) {
        toast.error("世界书注入失败");
    }
  };

  if (!isOpen) return null;

  const categoryList = Object.values(categories).sort((a,b) => a.order - b.order);
  const IconDisplay = formData.icon && (LucideIcons as any)[formData.icon] ? (LucideIcons as any)[formData.icon] : null;

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
                {isNew ? '新建条目定义' : `编辑: ${formData.key}`}
            </h3>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
                <X size={24} color="var(--text-secondary)" />
            </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Identity */}
            <div className="form-section">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                        <label className="form-label">Key (唯一键)</label>
                        <input 
                            className="form-input" 
                            value={formData.key} 
                            onChange={e => handleChange('key', e.target.value)}
                            placeholder="e.g. HP"
                            disabled={!isNew}
                            style={{ fontWeight: 600, opacity: !isNew ? 0.7 : 1, fontFamily: 'monospace' }}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">显示名称 (Name)</label>
                        <input 
                            className="form-input" 
                            value={formData.name || ''} 
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="e.g. 生命值"
                        />
                    </div>
                </div>
            </div>

            {/* 2. Format Preview */}
            <div className="glass-panel" style={{ padding: '12px', border: '1px solid var(--color-primary)', background: 'rgba(var(--color-primary), 0.05)' }}>
                <label className="form-label" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={14} /> 格式预览 (Format Preview)
                </label>
                <div style={{ 
                    marginTop: '8px', 
                    fontFamily: 'monospace', 
                    fontSize: '0.85rem', 
                    wordBreak: 'break-all',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-app)',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px dashed var(--chip-border)'
                }}>
                    {getPreviewString()}
                </div>
            </div>

            {/* 3. Configuration */}
            <div className="form-group">
                <label className="form-label">所属分类 (Default Category)</label>
                <select 
                    className="form-input"
                    value={formData.defaultCategory}
                    onChange={e => handleChange('defaultCategory', e.target.value)}
                >
                    {categoryList.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.name} ({cat.key})</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">渲染类型 (Type)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['text', 'numeric', 'array'].map(type => (
                        <button
                            key={type}
                            onClick={() => handleChange('type', type)}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                                borderColor: formData.type === type ? 'var(--color-primary)' : 'var(--chip-border)',
                                background: formData.type === type ? 'rgba(var(--color-primary), 0.1)' : 'transparent',
                                color: formData.type === type ? 'var(--color-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            {type === 'text' && '文本'}
                            {type === 'numeric' && '数值'}
                            {type === 'array' && '标签组'}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="form-group">
                <label className="form-label">图标 (Icon)</label>
                <div 
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="glass-panel"
                    style={{ 
                        padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        cursor: 'pointer', border: '1px solid var(--chip-border)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {IconDisplay ? <IconDisplay size={20} color="var(--color-primary)" /> : <span style={{color: 'var(--text-tertiary)'}}>无图标</span>}
                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{formData.icon || '选择图标...'}</span>
                    </div>
                    <ChevronRight size={16} color="var(--text-tertiary)" style={{ transform: showIconPicker ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                </div>
                {showIconPicker && (
                    <div className="glass-panel" style={{ marginTop: '8px', padding: '12px', height: '180px', border: '1px solid var(--chip-border)' }}>
                        <IconPicker 
                            selectedIcon={formData.icon || ''} 
                            onSelect={(icon) => { handleChange('icon', icon); setShowIconPicker(false); }} 
                        />
                    </div>
                )}
            </div>

            <div className="form-group">
                <label className="form-label">分隔符 (Separator)</label>
                <input 
                    className="form-input" 
                    value={formData.separator || '|'} 
                    onChange={e => handleChange('separator', e.target.value)}
                    placeholder="默认: |"
                    style={{ fontFamily: 'monospace' }}
                />
            </div>

            <div className="form-group">
                <label className="form-label">AI 描述与指令 (Description)</label>
                <textarea 
                    className="form-input" 
                    value={formData.description || ''} 
                    onChange={e => handleChange('description', e.target.value)}
                    placeholder="告诉 AI 这个条目代表什么..."
                    style={{ minHeight: '100px', lineHeight: 1.5 }}
                />
                <button 
                    onClick={handleInjectWorldbook}
                    className="btn btn--ghost"
                    style={{ marginTop: '12px', width: '100%', border: '1px dashed var(--color-success)', color: 'var(--color-success)' }}
                >
                    <BookOpen size={16} /> 注入/更新世界书
                </button>
            </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--chip-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--glass-bg)' }}>
            <button onClick={onClose} className="btn btn--ghost">取消</button>
            <button onClick={handleSave} className="btn btn--primary"><Save size={16} /> 保存定义</button>
        </div>
      </div>
      <style>{`
        .form-group { display: flex; flexDirection: column; gap: 8px; }
        .form-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
        .form-input { 
            padding: 10px; border-radius: 8px; border: 1px solid var(--chip-border); 
            background: var(--bg-app); color: var(--text-primary); outline: none; transition: 0.2s;
        }
        .form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1); }
      `}</style>
    </>
  );
};

export default DefinitionDrawer;