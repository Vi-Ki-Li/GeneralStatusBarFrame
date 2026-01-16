import React, { useState, useEffect } from 'react';
import { ItemDefinition, LorebookEntry, CategoryDefinition } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { X, Save, BookOpen } from 'lucide-react';

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
    key: '', type: 'text', defaultCategory: 'Other', description: ''
  });
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (definition) {
      setFormData({ ...definition });
      setIsNew(false);
    } else {
      setFormData({ 
        key: '', type: 'text', defaultCategory: 'Other', description: '' 
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
    
    onSave(formData);
    onClose();
  };

  const handleInjectWorldbook = async () => {
    const { key, type, defaultCategory, description } = formData;
    const catName = categories[defaultCategory]?.name || defaultCategory;
    
    // 生成格式示例
    let formatExample = '';
    switch (type) {
        case 'numeric': formatExample = `[角色^${catName}|${key}::当前值@最大值]`; break;
        case 'array': formatExample = `[角色^${catName}|${key}::物品A|物品B]`; break;
        default: formatExample = `[角色^${catName}|${key}::内容文本]`;
    }

    const content = `条目: ${key}\n分类: ${catName}\n描述: ${description || '（暂无）'}\n\n格式参考：\n${formatExample}`;

    try {
        const entries = await tavernService.getLorebookEntries();
        // 查找逻辑
        let targetEntry = entries.find(e => e.comment === key);
        
        if (targetEntry) {
            const updatedEntry = { ...targetEntry, content, enabled: true };
            const updatedList = entries.map(e => e.uid === targetEntry!.uid ? updatedEntry : e);
            await tavernService.setLorebookEntries(updatedList);
            toast.success(`世界书条目 "${key}" 已更新`);
        } else {
            const maxUid = Math.max(...entries.map(e => e.uid), 0);
            const newEntry: LorebookEntry = {
                uid: maxUid + 1,
                key: [key],
                keysecondary: [],
                comment: key,
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
            
            <div className="form-group">
                <label className="form-label">Key (条目名)</label>
                <input 
                    className="form-input" 
                    value={formData.key} 
                    onChange={e => handleChange('key', e.target.value)}
                    placeholder="e.g. HP, Inventory"
                    disabled={!isNew}
                    style={{ fontWeight: 600, opacity: !isNew ? 0.7 : 1 }}
                />
            </div>

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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    这决定了新建该条目时的默认位置，以及注入世界书时的分类说明。
                </span>
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

export default DefinitionDrawer;