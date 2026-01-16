import React, { useEffect, useState } from 'react';
import { LorebookEntry } from '../../../types';
import { tavernService } from '../../../services/mockTavernService';
import { useToast } from '../../Toast/ToastContext';
import { Check, CheckCircle2, Circle, Save, Search, RefreshCw, Folder } from 'lucide-react';
import { CATEGORY_MAPPING } from '../../../constants';

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
      // Filter out settings and styles if needed, or keep them in a specific group
      const regularEntries = fetchedEntries.filter(e => 
        !e.comment.startsWith('设置-') && 
        !e.comment.startsWith('样式-')
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
    setEntries(prev => prev.map(entry => {
      if (entry.uid === uid) {
        return { ...entry, enabled: !entry.enabled };
      }
      return entry;
    }));
    setHasChanges(true);
  };

  const handleApply = async () => {
    try {
        // Fetch fresh to avoid overwriting unrelated stuff (simulated merge)
        const allEntries = await tavernService.getLorebookEntries();
        const updatedAll = allEntries.map(e => {
            const modified = entries.find(m => m.uid === e.uid);
            if (modified) return modified;
            return e;
        });
        
        await tavernService.setLorebookEntries(updatedAll);
        setHasChanges(false);
        toast.success("条目状态已更新");
    } catch (e) {
        toast.error("保存失败");
    }
  };

  const handleSelectAll = (select: boolean) => {
      setEntries(prev => prev.map(e => ({ ...e, enabled: select })));
      setHasChanges(true);
  };

  // Group entries
  const getGroupedEntries = () => {
    const groups: GroupedEntries = {};
    const filtered = entries.filter(e => e.comment.toLowerCase().includes(filterText.toLowerCase()));

    filtered.forEach(entry => {
        // Try to extract category [ST|...]
        const match = entry.comment.match(/\[(\w+)\|/);
        let category = 'Other';
        if (match && CATEGORY_MAPPING[match[1] as any]) {
            category = match[1];
        }
        
        if (!groups[category]) groups[category] = [];
        groups[category].push(entry);
    });

    return groups;
  };

  const grouped = getGroupedEntries();
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      
      {/* Header / Toolbar */}
      <div className="glass-panel" style={{ 
          padding: '16px', 
          marginBottom: '20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="搜索条目..."
                style={{
                    width: '100%',
                    padding: '8px 8px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--chip-border)',
                    background: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                }}
            />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
            <button 
                onClick={() => handleSelectAll(true)}
                className="btn btn--ghost"
                title="全选"
                style={{ padding: '8px' }}
            >
                <CheckCircle2 size={18} />
            </button>
            <button 
                onClick={() => handleSelectAll(false)}
                className="btn btn--ghost"
                title="全不选"
                style={{ padding: '8px' }}
            >
                <Circle size={18} />
            </button>
            <button 
                onClick={loadEntries}
                className="btn btn--ghost"
                title="重置/刷新"
                style={{ padding: '8px' }}
            >
                <RefreshCw size={18} />
            </button>
        </div>

        <button 
            className={`btn ${hasChanges ? 'btn--primary' : 'btn--ghost'}`}
            disabled={!hasChanges}
            onClick={handleApply}
            style={{ opacity: hasChanges ? 1 : 0.5, transition: 'all 0.3s' }}
        >
            <Save size={16} />
            应用更改
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>加载中...</div>
        ) : (
            Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>未找到条目</div>
            ) : (
                sortedCategories.map(cat => (
                    <div key={cat} style={{ marginBottom: '24px' }}>
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            marginBottom: '12px', 
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            paddingBottom: '4px',
                            borderBottom: '1px solid var(--chip-border)'
                        }}>
                            <Folder size={16} />
                            {CATEGORY_MAPPING[cat as any]?.name || cat}
                            <span style={{ fontSize: '0.8em', opacity: 0.7 }}>({grouped[cat].length})</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                            {grouped[cat].map(entry => (
                                <div 
                                    key={entry.uid}
                                    onClick={() => handleToggleEntry(entry.uid)}
                                    className="glass-panel"
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        border: entry.enabled ? '1px solid var(--color-primary)' : '1px solid transparent',
                                        background: entry.enabled ? 'rgba(var(--color-primary), 0.05)' : 'var(--glass-bg)',
                                        opacity: entry.enabled ? 1 : 0.7,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ 
                                        width: '18px', height: '18px', borderRadius: '4px',
                                        border: entry.enabled ? 'none' : '2px solid var(--text-tertiary)',
                                        background: entry.enabled ? 'var(--color-primary)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white',
                                        flexShrink: 0
                                    }}>
                                        {entry.enabled && <Check size={12} />}
                                    </div>
                                    <span style={{ 
                                        fontSize: '0.9rem', 
                                        color: entry.enabled ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        {entry.comment}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )
        )}
      </div>
    </div>
  );
};

export default EntryList;