
import React, { useEffect, useState } from 'react';
import { LorebookEntry } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Check, CheckCircle2, Circle, Save, Search, RefreshCw, Folder, ChevronDown, Filter, Edit2, X } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../../../services/definitionRegistry';
import './EntryList.css';

interface GroupedEntries {
  [category: string]: LorebookEntry[];
}

const EntryList: React.FC = () => {
  const [entries, setEntries] = useState<LorebookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedUids, setExpandedUids] = useState<Set<number>>(new Set());
  
  // Edit State
  const [editingEntry, setEditingEntry] = useState<LorebookEntry | null>(null);
  const [editContent, setEditContent] = useState('');

  const toast = useToast();

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const fetchedEntries = await tavernService.getLorebookEntries();
      // Filter out internal system entries
      const regularEntries = fetchedEntries.filter(e => 
        !e.comment.startsWith('设置-') && !e.comment.startsWith('样式-')
      );
      setEntries(regularEntries);
      setHasChanges(false);
    } catch (e) { toast.error("加载条目失败"); } 
    finally { setLoading(false); }
  };

  const handleToggleEntry = (uid: number) => {
    setEntries(prev => prev.map(entry => entry.uid === uid ? { ...entry, enabled: !entry.enabled } : entry));
    setHasChanges(true);
  };

  const handleToggleExpand = (uid: number) => {
    setExpandedUids(prev => {
        const newSet = new Set(prev);
        if (newSet.has(uid)) {
            newSet.delete(uid);
        } else {
            newSet.add(uid);
        }
        return newSet;
    });
  };

  const handleApply = async () => {
    try {
        const allEntries = await tavernService.getLorebookEntries();
        const updatedAll = allEntries.map(e => {
            const modified = entries.find(m => m.uid === e.uid);
            return modified || e;
        });
        await tavernService.setLorebookEntries(updatedAll);
        setHasChanges(false);
        toast.success("世界书已更新");
    } catch (e) { toast.error("保存失败"); }
  };

  const handleSelectAll = (select: boolean) => {
      setEntries(prev => prev.map(e => ({ ...e, enabled: select })));
      setHasChanges(true);
  };

  const getCategoryName = (catKey: string) => {
      const def = DEFAULT_CATEGORIES.find(d => d.key === catKey);
      return def ? def.name : catKey;
  };

  // --- Edit Logic ---
  const handleEditClick = (e: React.MouseEvent, entry: LorebookEntry) => {
      e.stopPropagation();
      setEditingEntry(entry);
      setEditContent(entry.content);
  };

  const handleSaveEdit = () => {
      if (editingEntry) {
          setEntries(prev => prev.map(e => e.uid === editingEntry.uid ? { ...e, content: editContent } : e));
          setHasChanges(true);
          setEditingEntry(null);
          toast.info("条目内容已更新 (需点击应用更改以保存)");
      }
  };

  const getGroupedEntries = () => {
    const groups: GroupedEntries = {};
    const filtered = entries.filter(e => e.comment.toLowerCase().includes(filterText.toLowerCase()));

    filtered.forEach(entry => {
        const match = entry.content.match(/\[(?:[^\]\^]+\^)?(\w+)\|/);
        let category = 'Other';
        if (match && match[1]) {
            category = match[1];
        }
        if (!groups[category]) groups[category] = [];
        groups[category].push(entry);
    });
    return groups;
  };

  const grouped = getGroupedEntries();
  const sortedCategories = Object.keys(grouped).sort((a,b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
  });

  return (
    <div className="entry-list">
      {/* Standard Toolbar */}
      <div className="th-toolbar">
        <div className="th-search-box">
            <Search size={16} />
            <input 
                value={filterText} 
                onChange={e => setFilterText(e.target.value)} 
                placeholder="搜索条目..." 
            />
        </div>
        
        <div className="entry-list__selection-tools">
            <button onClick={() => handleSelectAll(true)} className="th-manager__icon-btn" title="全选"><CheckCircle2 size={18} /></button>
            <button onClick={() => handleSelectAll(false)} className="th-manager__icon-btn" title="全不选"><Circle size={18} /></button>
            <button onClick={loadEntries} className="th-manager__icon-btn" title="刷新"><RefreshCw size={18} /></button>
        </div>

        <div style={{flex: 1}} />

        <button 
            className={`btn ${hasChanges ? 'btn--primary pulse' : 'btn--ghost'}`} 
            disabled={!hasChanges} 
            onClick={handleApply}
        >
            <Save size={16} /> 应用更改
        </button>
      </div>

      <div className="entry-list__content">
        {loading ? (
            <div className="entry-list__loading">加载中...</div>
        ) : sortedCategories.length === 0 ? (
            <div className="entry-list__empty">无匹配条目</div>
        ) : (
            sortedCategories.map(cat => (
            <div key={cat} className="entry-list__section">
                <div className="entry-list__section-header">
                    <Folder size={16} /> 
                    <span>{getCategoryName(cat)}</span>
                    <span className="count">{grouped[cat].length}</span>
                </div>
                <div className="entry-list__grid">
                    {grouped[cat].map(entry => {
                        const isExpanded = expandedUids.has(entry.uid);
                        return (
                            <div key={entry.uid} className={`entry-card glass-panel ${entry.enabled ? 'enabled' : ''}`}>
                                <div className="entry-card__top">
                                    <div className="entry-card__check-area" onClick={() => handleToggleEntry(entry.uid)}>
                                        <div className="checkbox">{entry.enabled && <Check size={12} />}</div>
                                        <span className="title">{entry.comment}</span>
                                    </div>
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <button 
                                            className="entry-card__action-btn"
                                            onClick={(e) => handleEditClick(e, entry)}
                                            title="编辑内容"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            className="entry-card__toggle-btn" 
                                            onClick={() => handleToggleExpand(entry.uid)}
                                        >
                                            <ChevronDown size={16} className={isExpanded ? 'rotated' : ''} />
                                        </button>
                                    </div>
                                </div>
                                <div className="entry-card__body" onClick={() => handleToggleExpand(entry.uid)}>
                                    {isExpanded ? (
                                        <div className="entry-card__full-text animate-fade-in">
                                            {entry.content}
                                        </div>
                                    ) : (
                                        <div className="entry-card__preview-text">
                                            {entry.content.split('\n')[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )))}
      </div>

      {/* Inline Modal for Editing */}
      {editingEntry && (
          <div className="entry-editor-overlay animate-fade-in">
              <div className="entry-editor-modal glass-panel">
                  <div className="entry-editor-header">
                      <h3>编辑条目: {editingEntry.comment}</h3>
                      <button onClick={() => setEditingEntry(null)}><X size={20}/></button>
                  </div>
                  <textarea 
                      className="entry-editor-textarea"
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      placeholder="条目内容..."
                  />
                  <div className="entry-editor-footer">
                      <button className="btn btn--ghost" onClick={() => setEditingEntry(null)}>取消</button>
                      <button className="btn btn--primary" onClick={handleSaveEdit}>确认修改</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default EntryList;