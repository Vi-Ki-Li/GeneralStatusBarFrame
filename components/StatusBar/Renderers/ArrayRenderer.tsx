import React from 'react';
import { StatusBarItem } from '../../../types';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './ArrayRenderer.css';

interface ArrayRendererProps {
  item: StatusBarItem;
  label?: string;
  icon?: string;
  onInteract?: (item: StatusBarItem, value?: string) => void;
}

const ArrayRenderer: React.FC<ArrayRendererProps> = ({ item, label, icon, onInteract }) => {
  const tags = item.values.filter(v => v && v !== 'nil' && v.trim() !== '');
  const displayLabel = label || item.key;
  
  const IconComponent = icon && (LucideIcons as any)[icon] ? (LucideIcons as any)[icon] : null;

  return (
    <div className="status-item-row status-item-row--array" title={`Key: ${item.key}`}>
      <div className="array-renderer__header">
        <span className="status-item-row__label">
          {IconComponent && <IconComponent size={14} className="status-item-row__icon" />}
          {displayLabel}
          {item.user_modified && (
             <span title="用户已锁定，AI无法修改" className="status-item-row__lock-icon">
               <Lock size={10} />
             </span>
          )}
        </span>
        <span className="array-renderer__count">{tags.length} 项</span>
      </div>
      
      <div className="array-renderer__tags-container">
        {tags.length > 0 ? (
          tags.map((tag, idx) => (
            <span 
                key={idx} 
                className="array-renderer__tag-chip"
                onClick={() => onInteract && onInteract(item, tag)}
                title="点击引用此项"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="array-renderer__empty-text">空</span>
        )}
      </div>
    </div>
  );
};

export default ArrayRenderer;