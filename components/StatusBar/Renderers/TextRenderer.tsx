import React from 'react';
import { StatusBarItem } from '../../../types';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './TextRenderer.css';

interface TextRendererProps {
  item: StatusBarItem;
  label?: string;
  icon?: string;
  onInteract?: (item: StatusBarItem) => void;
}

const TextRenderer: React.FC<TextRendererProps> = ({ item, label, icon, onInteract }) => {
  const text = item.values.join(' ');
  const isLongText = text.length > 20;
  const displayLabel = label || item.key;
  
  const IconComponent = icon && (LucideIcons as any)[icon] ? (LucideIcons as any)[icon] : null;

  const layoutClass = isLongText ? 'status-item-row--text-block' : 'status-item-row--text-inline';

  return (
    <div className={`status-item-row ${layoutClass}`} title={`Key: ${item.key}`}>
      <div className="status-item-row__label">
        {IconComponent && <IconComponent size={14} className="status-item-row__icon" />}
        {displayLabel}
        {item.user_modified && (
          <span title="用户已锁定，AI无法修改" className="status-item-row__lock-icon">
            <Lock size={10} />
          </span>
        )}
      </div>
      
      <div 
        onClick={() => onInteract && onInteract(item)}
        className="text-renderer__value"
        title="点击引用"
      >
        {text || '-'}
      </div>
    </div>
  );
};

export default TextRenderer;