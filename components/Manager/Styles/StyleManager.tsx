import React, { useEffect, useState } from 'react';
import { LorebookEntry } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Paintbrush, Plus, Edit3, Trash2, CheckCircle2, Circle } from 'lucide-react';
import StyleEditor from './StyleEditor';

// Default CSS Template for new styles
const DEFAULT_CSS_TEMPLATE = `/* 自定义样式 */
.status-bar-container {
  /* 示例：修改背景色 */
  /* background-color: rgba(255, 255, 255, 0.9); */
}

/* 示例：修改文字颜色 */
.status-label {
  /* color: #333; */
}
`;

const StyleManager: React.FC = () => {
  const [styles, setStyles] = useState<LorebookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEditorUid, setActiveEditorUid] = useState<number | null>(null);
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<number | null>(null); // For delete confirmation
  
  const toast = useToast();

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    setLoading(true);
    try {
      const allEntries = await tavernService.getLorebookEntries();
      const styleEntries = allEntries.filter(e => e.comment.startsWith('样式-'));
      setStyles(styleEntries);
    } catch (e) {
      toast.error("加载样式失败");
    } finally {
      setLoading(false);
    }
  };

  // Enable one style, disable others (Exclusive)
  const handleToggleStyle = async (targetUid: number, currentState: boolean) => {
    // If clicking an enabled style, just disable it (allow 0 active styles)
    // If clicking a disabled style, enable it and disable others
    
    try {
        const allEntries = await tavernService.getLorebookEntries();
        const updatedEntries = allEntries.map(entry => {
            // Only touch style entries
            if (!entry.comment.startsWith('样式-')) return entry;

            if (entry.uid === targetUid) {
                return { ...entry, enabled: !currentState }; // Toggle target
            } else {
                // If we are enabling target, disable everyone else
                // If we are disabling target, leave others alone (or disable them to be safe? logic says mutual exclusive so disable others is safe)
                return !currentState ? { ...entry, enabled: false } : entry;
            }
        });

        await tavernService.setLorebookEntries(updatedEntries);
        
        // Refresh local state
        const newStyles = updatedEntries.filter(e => e.comment.startsWith('样式-'));
        setStyles(newStyles);
        
        if (!currentState) {
            toast.success("已启用样式");
        }
    } catch (e) {
        toast.error("切换样式失败");
    }
  };

  const handleCreateStyle = async () => {
    try {
        const allEntries = await tavernService.getLorebookEntries();
        // Generate a unique ID (mock logic, real world usually handles this differently or backend does)
        const maxUid = Math.max(...allEntries.map(e => e.uid), 0);
        const newUid = maxUid + 1;
        const timestamp = new Date().getTime().toString().slice(-4);

        const newEntry: LorebookEntry = {
            uid: newUid,
            key: [],
            keysecondary: [],
            comment: `样式-新主题_${timestamp}`,
            content: DEFAULT_CSS_TEMPLATE,
            enabled: false,
            position: newUid // Use UID as position/order for now
        };

        await tavernService.setLorebookEntries([...allEntries, newEntry]);
        await loadStyles();
        toast.success("新样式已创建");
        setActiveEditorUid(newUid); // Auto open editor
    } catch (e) {
        toast.error("创建失败");
    }
  };

  const handleDeleteStyle = async (uid: number) => {
      try {
          const allEntries = await tavernService.getLorebookEntries();
          const updated = allEntries.filter(e => e.uid !== uid);
          await tavernService.setLorebookEntries(updated);
          await loadStyles();
          toast.success("样式已删除");
          setConfirmDeleteUid(null);
      } catch (e) {
          toast.error("删除失败");
      }
  };

  const handleSaveStyle = async (name: string, content: string) => {
      if (!activeEditorUid) return;
      try {
          const allEntries = await tavernService.getLorebookEntries();
          const updated = allEntries.map(e => {
              if (e.uid === activeEditorUid) {
                  return { ...e, comment: name, content: content };
              }
              return e;
          });
          
          await tavernService.setLorebookEntries(updated);
          await loadStyles();
          setActiveEditorUid(null); // Close editor
          toast.success("样式已保存");
      } catch (e) {
          toast.error("保存失败");
      }
  };

  // --- Render Editor Mode ---
  if (activeEditorUid) {
      const activeEntry = styles.find(s => s.uid === activeEditorUid);
      if (!activeEntry) {
          setActiveEditorUid(null);
          return null;
      }
      return (
          <div style={{ padding: '24px', height: '100%' }}>
              <StyleEditor 
                entry={activeEntry} 
                onSave={handleSaveStyle} 
                onCancel={() => setActiveEditorUid(null)} 
              />
          </div>
      );
  }

  // --- Render List Mode ---
  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="glass-panel" style={{ 
            padding: '20px', 
            marginBottom: '24px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(139, 92, 246, 0.05))'
        }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Paintbrush size={20} style={{ color: 'var(--color-secondary)' }} />
                    样式管理器
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    管理世界书中的 CSS 样式条目。同时只能启用一个样式。
                </p>
            </div>
            <button 
                className="btn btn--primary" 
                onClick={handleCreateStyle}
            >
                <Plus size={16} />
                新建样式
            </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>加载中...</div>
            ) : (
                styles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>暂无自定义样式</div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {styles.map(style => (
                            <div key={style.uid} className="glass-panel" style={{ 
                                padding: '16px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                border: style.enabled ? '1px solid var(--color-primary)' : '1px solid var(--chip-border)',
                                background: style.enabled ? 'rgba(var(--color-primary), 0.05)' : 'var(--glass-bg)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <button 
                                        onClick={() => handleToggleStyle(style.uid, style.enabled)}
                                        style={{ 
                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                            color: style.enabled ? 'var(--color-success)' : 'var(--text-tertiary)',
                                            transition: 'color 0.2s'
                                        }}
                                        title={style.enabled ? "点击禁用" : "点击启用"}
                                    >
                                        {style.enabled ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </button>
                                    
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                            {style.comment}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            UID: {style.uid}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        className="btn btn--ghost"
                                        style={{ padding: '8px' }}
                                        onClick={() => setActiveEditorUid(style.uid)}
                                        title="编辑代码"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    
                                    {confirmDeleteUid === style.uid ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>确认删除?</span>
                                            <button 
                                                onClick={() => handleDeleteStyle(style.uid)}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-danger)', fontWeight: 600 }}
                                            >
                                                是
                                            </button>
                                            <button 
                                                onClick={() => setConfirmDeleteUid(null)}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                            >
                                                否
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            className="btn btn--ghost"
                                            style={{ padding: '8px', color: 'var(--text-tertiary)' }}
                                            onClick={() => setConfirmDeleteUid(style.uid)}
                                            title="删除样式"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    </div>
  );
};

export default StyleManager;