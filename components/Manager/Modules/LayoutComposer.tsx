import React from 'react';
import { StatusBarData, CategoryDefinition } from '../../../types';
import { useToast } from '../../Toast/ToastContext';
import { LayoutGrid, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface LayoutComposerProps {
  data: StatusBarData;
  onUpdate: (newData: StatusBarData) => void;
}

const LayoutComposer: React.FC<LayoutComposerProps> = ({ data, onUpdate }) => {
  const toast = useToast();
  const categories = Object.values(data.categories || {}).sort((a, b) => a.order - b.order);

  const handleMove = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= categories.length) return;
    
    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[index + direction];
    newCats[index + direction] = temp;

    // Update orders based on new index
    newCats.forEach((cat, idx) => {
        cat.order = idx;
    });

    const newData = { ...data };
    if (!newData.categories) newData.categories = {};
    newCats.forEach(cat => {
        newData.categories[cat.key] = cat;
    });

    onUpdate(newData);
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutGrid size={22} style={{ color: 'var(--color-primary)' }} />
                布局编排器
             </h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                调整各个分类模块在状态栏中的显示顺序。
             </p>
        </div>

        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.map((cat, idx) => {
                const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.CircleHelp;
                const isTop = idx === 0;
                const isBottom = idx === categories.length - 1;

                return (
                    <div key={cat.key} className="glass-panel" style={{ 
                        padding: '16px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: '1px solid var(--chip-border)',
                        background: 'var(--glass-bg)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, width: '20px' }}>
                                {idx + 1}
                            </div>
                            <div style={{ 
                                width: '36px', height: '36px', borderRadius: '8px', 
                                background: 'var(--bg-app)', border: '1px solid var(--chip-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-secondary)'
                            }}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{cat.key}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                                onClick={() => handleMove(idx, -1)}
                                disabled={isTop}
                                className="btn btn--ghost"
                                style={{ padding: '8px', opacity: isTop ? 0.3 : 1 }}
                            >
                                <ArrowUp size={18} />
                            </button>
                            <button 
                                onClick={() => handleMove(idx, 1)}
                                disabled={isBottom}
                                className="btn btn--ghost"
                                style={{ padding: '8px', opacity: isBottom ? 0.3 : 1 }}
                            >
                                <ArrowDown size={18} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default LayoutComposer;