import React from 'react';
import { StatusBarItem } from '../../../types';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './NumericRenderer.css';

interface NumericRendererProps {
  item: StatusBarItem;
  label?: string;
  icon?: string;
  onInteract?: (item: StatusBarItem) => void;
}

const NumericRenderer: React.FC<NumericRendererProps> = ({ item, label, icon, onInteract }) => {
  const rawValue = item.values[0] || '0';
  const changeValue = item.values[1];
  const displayLabel = label || item.key;
  
  const IconComponent = icon && (LucideIcons as any)[icon] ? (LucideIcons as any)[icon] : null;
  
  let current = 0;
  let max = 0;
  let hasMax = false;

  if (rawValue.includes('@')) {
    const parts = rawValue.split('@');
    current = parseFloat(parts[0]);
    max = parseFloat(parts[1]);
    hasMax = true;
  } else {
    current = parseFloat(rawValue);
  }

  const percentage = hasMax && max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

  let barColor = 'var(--color-primary)';
  if (hasMax) {
    if (percentage <= 20) barColor = 'var(--color-danger)';
    else if (percentage <= 50) barColor = 'var(--color-warning)';
    else barColor = 'var(--color-success)';
  }

  const isPositive = changeValue && changeValue.startsWith('+');
  const changeColor = isPositive ? 'var(--color-success)' : 'var(--color-danger)';
  const changeBg = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  return (
    <div 
        className="status-item-row status-item-row--numeric"
        onClick={() => onInteract && onInteract(item)}
        title={`Key: ${item.key}`}
    >
      <div className="status-item-row__label">
        {IconComponent && <IconComponent size={14} className="status-item-row__icon" />}
        {displayLabel}
        {item.user_modified && (
          <span title="用户已锁定，AI无法修改" className="status-item-row__lock-icon">
            <Lock size={10} />
          </span>
        )}
      </div>
      
      {hasMax ? (
        <div className="numeric-renderer__progress-container">
          <div 
            className="numeric-renderer__progress-fill"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: barColor
            }}
          />
        </div>
      ) : (
        <div className="status-item-row__spacer"></div> 
      )}

      <div className="numeric-renderer__value-group">
        <span className="numeric-renderer__value">
          {current}
          {hasMax && <span className="numeric-renderer__value-max">/{max}</span>}
        </span>
        
        {changeValue && changeValue !== '±0' && (
          <span 
            className="numeric-renderer__change-indicator"
            style={{ color: changeColor, background: changeBg }}
          >
            {changeValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default NumericRenderer;