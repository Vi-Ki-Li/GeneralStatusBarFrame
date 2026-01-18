import React, { useEffect, useState } from 'react';
import { LorebookEntry } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Check, CheckCircle2, Circle, Save, Search, RefreshCw, Folder } from 'lucide-react';
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
  const toast = useToast();

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const fetchedEntries = await tavernService.getLorebookEntries();
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

  const handleApply = async () => {
    try {
        const allEntries = await tavernService.getLorebookEntries();
        const updatedAll = allEntries.map(e => {
            const modified = entries.find(m => m.uid === e.uid);
            return modified || e;
        });
        await tavernService.setLorebookEntries(updatedAll);
        setHasChanges(false);
        toast.success("已更新");
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

  const getGroupedEntries = () => {
    const groups: GroupedEntries = {};
    const filtered = entries.filter(e => e.comment.toLowerCase().includes(filterText.toLowerCase()));

    filtered.forEach(entry => {
        const match = entry.comment.match(/\[(\w+)\|/);
        let category = 'Other';
        if (match) category = match[1];
        if (!groups[category]) groups[category] = [];
        groups[category].push(entry);
    });
    return groups;
  };

  const grouped = getGroupedEntries();
  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="entry-list">
      <div className="entry-list__header glass-panel">
        <div className="entry-list__search-wrapper">
            <Search size={16} className="entry-list__search-icon" />
            <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="搜索条目..." className="entry-list__search-input" />
        </div>
        <div className="entry-list__actions">
            <button onClick={() => handleSelectAll(true)} className="btn btn--ghost" title="全选"><CheckCircle2 size={18} /></button>
            <button onClick={() => handleSelectAll(false)} className="btn btn--ghost" title="全不选"><Circle size={18} /></button>
            <button onClick={loadEntries} className="btn btn--ghost" title="刷新"><RefreshCw size={18} /></button>
        </div>
        <button className={`btn ${hasChanges ? 'btn--primary' : 'btn--ghost'}`} disabled={!hasChanges} onClick={handleApply}>
            <Save size={16} /> 应用更改
        </button>
      </div>

      <div className="entry-list__content">
        {loading ? <div>Loading...</div> : Object.keys(grouped).map(cat => (
            <div key={cat} className="entry-list__category-group">
                <div className="entry-list__category-title">
                    <Folder size={16} /> {getCategoryName(cat)} ({grouped[cat].length})
                </div>
                <div className="entry-list__grid">
                    {grouped[cat].map(entry => (
                        <div key={entry.uid} onClick={() => handleToggleEntry(entry.uid)} className={`entry-list__item glass-panel ${entry.enabled ? 'entry-list__item--enabled' : ''}`}>
                            <div className="entry-list__checkbox">{entry.enabled && <Check size={12} />}</div>
                            <span>{entry.comment}</span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default EntryList;