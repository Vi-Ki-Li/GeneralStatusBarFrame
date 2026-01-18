import React, { useEffect, useState } from 'react';
import { LorebookEntry } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Paintbrush, Plus, Edit3, Trash2, CheckCircle2, Circle } from 'lucide-react';
import StyleEditor from './StyleEditor';
import './StyleManager.css';

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
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<number | null>(null);
  
  const toast = useToast();

  useEffect(() => { loadStyles(); }, []);

  const loadStyles = async () => {
    setLoading(true);
    try {
      const allEntries = await tavernService.getLorebookEntries();
      const styleEntries = allEntries.filter(e => e.comment.startsWith('样式-'));
      setStyles(styleEntries);
    } catch (e) { toast.error("加载样式失败"); } 
    finally { setLoading(false); }
  };

  const handleToggleStyle = async (targetUid: number, currentState: boolean) => {
    try {
        const allEntries = await tavernService.getLorebookEntries();
        const updatedEntries = allEntries.map(entry => {
            if (!entry.comment.startsWith('样式-')) return entry;
            if (entry.uid === targetUid) {
                return { ...entry, enabled: !currentState };
            } else {
                return !currentState ? { ...entry, enabled: false } : entry;
            }
        });

        await tavernService.setLorebookEntries(updatedEntries);
        
        const newStyles = updatedEntries.filter(e => e.comment.startsWith('样式-'));
        setStyles(newStyles);
        
        if (!currentState) toast.success("已启用样式");
    } catch (e) { toast.error("切换样式失败"); }
  };

  const handleCreateStyle = async () => {
    try {
        const allEntries = await tavernService.getLorebookEntries();
        const maxUid = Math.max(...allEntries.map(e => e.uid), 0);
        const newUid = maxUid + 1;
        const timestamp = new Date().getTime().toString().slice(-4);

        const newEntry: LorebookEntry = {
            uid: newUid, key: [], keysecondary: [], comment: `样式-新主题_${timestamp}`,
            content: DEFAULT_CSS_TEMPLATE, enabled: false, position: newUid
        };

        await tavernService.setLorebookEntries([...allEntries, newEntry]);
        await loadStyles();
        toast.success("新样式已创建");
        setActiveEditorUid(newUid);
    } catch (e) { toast.error("创建失败"); }
  };

  const handleDeleteStyle = async (uid: number) => {
      try {
          const allEntries = await tavernService.getLorebookEntries();
          const updated = allEntries.filter(e => e.uid !== uid);
          await tavernService.setLorebookEntries(updated);
          await loadStyles();
          toast.success("样式已删除");
          setConfirmDeleteUid(null);
      } catch (e) { toast.error("删除失败"); }
  };

  const handleSaveStyle = async (name: string, content: string) => {
      if (!activeEditorUid) return;
      try {
          const allEntries = await tavernService.getLorebookEntries();
          const updated = allEntries.map(e => 
              e.uid === activeEditorUid ? { ...e, comment: name, content: content } : e
          );
          
          await tavernService.setLorebookEntries(updated);
          await loadStyles();
          setActiveEditorUid(null);
          toast.success("样式已保存");
      } catch (e) { toast.error("保存失败"); }
  };

  if (activeEditorUid) {
      const activeEntry = styles.find(s => s.uid === activeEditorUid);
      if (!activeEntry) {
          setActiveEditorUid(null);
          return null;
      }
      return (
          <div className="style-manager__editor-view">
              <StyleEditor 
                entry={activeEntry} 
                onSave={handleSaveStyle} 
                onCancel={() => setActiveEditorUid(null)} 
              />
          </div>
      );
  }

  return (
    <div className="style-manager">
        <div className="style-manager__header glass-panel">
            <div>
                <h3 className="style-manager__title"><Paintbrush size={20} /> 样式管理器</h3>
                <p className="style-manager__subtitle">管理世界书中的 CSS 样式条目。同时只能启用一个样式。</p>
            </div>
            <button className="btn btn--primary" onClick={handleCreateStyle}>
                <Plus size={16} /> 新建样式
            </button>
        </div>

        <div className="style-manager__list-container">
            {loading ? (
                <div className="style-manager__message">加载中...</div>
            ) : (
                styles.length === 0 ? (
                    <div className="style-manager__message">暂无自定义样式</div>
                ) : (
                    <div className="style-manager__list">
                        {styles.map(style => (
                            <div key={style.uid} className={`style-item glass-panel ${style.enabled ? 'style-item--enabled' : ''}`}>
                                <div className="style-item__main">
                                    <button 
                                        onClick={() => handleToggleStyle(style.uid, style.enabled)}
                                        className="style-item__toggle"
                                        title={style.enabled ? "点击禁用" : "点击启用"}
                                    >
                                        {style.enabled ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </button>
                                    <div>
                                        <div className="style-item__name">{style.comment}</div>
                                        <div className="style-item__uid">UID: {style.uid}</div>
                                    </div>
                                </div>
                                <div className="style-item__actions">
                                    <button className="btn btn--ghost" onClick={() => setActiveEditorUid(style.uid)} title="编辑代码">
                                        <Edit3 size={18} />
                                    </button>
                                    {confirmDeleteUid === style.uid ? (
                                        <div className="style-item__confirm-delete">
                                            <span>确认?</span>
                                            <button onClick={() => handleDeleteStyle(style.uid)}>是</button>
                                            <button onClick={() => setConfirmDeleteUid(null)}>否</button>
                                        </div>
                                    ) : (
                                        <button className="btn btn--ghost btn--delete" onClick={() => setConfirmDeleteUid(style.uid)} title="删除样式">
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