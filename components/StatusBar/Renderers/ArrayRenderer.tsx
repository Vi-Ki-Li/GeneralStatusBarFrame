import React from 'react';
import { StatusBarItem } from '../../../types';
import { Lock } from 'lucide-react';

interface ArrayRendererProps {
  item: StatusBarItem;
  onInteract?: (item: StatusBarItem, value?: string) => void;
}

const ArrayRenderer: React.FC<ArrayRendererProps> = ({ item, onInteract }) => {
  const tags = item.values.filter(v => v && v !== 'nil' && v.trim() !== '');

  return (
    <div className="status-item-row" style={{ display: 'block' }}>
      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="status-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {item.key}
          {item.user_modified && (
             <span title="用户已锁定，AI无法修改" style={{ display: 'flex' }}>
               <Lock size={10} className="text-warning" style={{ opacity: 0.7 }} />
             </span>
          )}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{tags.length} 项</span>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {tags.length > 0 ? (
          tags.map((tag, idx) => (
            <span 
                key={idx} 
                className="tag-chip interactive-chip"
                onClick={() => onInteract && onInteract(item, tag)}
                title="点击引用此项"
                style={{ cursor: 'pointer' }}
            >
              {tag}
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>空</span>
        )}
      </div>
      <style>{`
        .interactive-chip:hover {
            border-color: var(--color-primary);
            color: var(--color-primary);
            background: rgba(var(--color-primary), 0.1);
        }
      `}</style>
    </div>
  );
};

export default ArrayRenderer;