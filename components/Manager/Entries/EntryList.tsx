import React, { useEffect, useState } from 'react';
import { LorebookEntry } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Check, CheckCircle2, Circle, Save, Search, RefreshCw, Folder } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../../../services/definitionRegistry'; // 使用默认定义

interface GroupedEntries {
  [category: string]: LorebookEntry[];
}

const EntryList: React.FC = () => {
  const [entries, setEntries] = useState<LorebookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const fetchedEntries = await tavernService.getLorebookEntries();
      const regularEntries = fetchedEntries.filter(e => 
        !e.comment.startsWith('设置-') && !e.comment.startsWith('样式-')
      );
      setEntries(regularEntries);
      setHasChanges(false);
    } catch (e) {
      toast.error("加载条目失败");
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
        toast.error("保存失败");
    }
  };

  const handleSelectAll = (select: boolean) => {
      setEntries(prev => prev.map(e => ({ ...e, enabled: select })));
      setHasChanges(true);
  };

  // 获取分类名称辅助函数
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
        // 简单匹配，不再校验 key 是否存在于 Mapping
        if (match) category = match[1];
        if (!groups[category]) groups[category] = [];
        groups[category].push(entry);
    });
    return groups;
  };

  const grouped = getGroupedEntries();
  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="搜索条目..." style={{ width: '100%', padding: '8px 8px 8px 36px', borderRadius: '8px', border: '1px solid var(--chip-border)', background: 'var(--bg-app)' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleSelectAll(true)} className="btn btn--ghost" style={{ padding: '8px' }}><CheckCircle2 size={18} /></button>
            <button onClick={() => handleSelectAll(false)} className="btn btn--ghost" style={{ padding: '8px' }}><Circle size={18} /></button>
            <button onClick={loadEntries} className="btn btn--ghost" style={{ padding: '8px' }}><RefreshCw size={18} /></button>
        </div>
        <button className={`btn ${hasChanges ? 'btn--primary' : 'btn--ghost'}`} disabled={!hasChanges} onClick={handleApply} style={{ opacity: hasChanges ? 1 : 0.5 }}>
            <Save size={16} /> 应用更改
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? <div>Loading...</div> : Object.keys(grouped).map(cat => (
            <div key={cat} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--chip-border)' }}>
                    <Folder size={16} /> {getCategoryName(cat)} ({grouped[cat].length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                    {grouped[cat].map(entry => (
                        <div key={entry.uid} onClick={() => handleToggleEntry(entry.uid)} className="glass-panel" style={{ padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', border: entry.enabled ? '1px solid var(--color-primary)' : '1px solid transparent', opacity: entry.enabled ? 1 : 0.7 }}>
                            <div style={{ width: '18px', height: '18px', background: entry.enabled ? 'var(--color-primary)' : 'transparent', border: entry.enabled ? 'none' : '2px solid var(--text-tertiary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{entry.enabled && <Check size={12} />}</div>
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