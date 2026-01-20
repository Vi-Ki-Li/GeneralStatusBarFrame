
import React from 'react';
import { StatusBarItem, ItemDefinition } from '../../../types';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './NumericRenderer.css';

interface NumericRendererProps {
  item: StatusBarItem;
  label?: string;
  icon?: string;
  onInteract?: (item: StatusBarItem) => void;
  definition?: ItemDefinition;
}

const NumericRenderer: React.FC<NumericRendererProps> = ({ item, label, icon, onInteract, definition }) => {
  const displayLabel = definition?.name || label || item.key;
  const IconComponent = icon && (LucideIcons as any)[icon] ? (LucideIcons as any)[icon] : null;

  // --- Core Logic: Map Values based on Definition Structure (Flat Format) ---
  let currentStr = '0';
  let maxStr = '';
  let changeStr = '';
  let reasonStr = '';
  let descStr = '';

  const values = item.values || [];

  if (definition?.structure?.parts) {
      // Definition Driven: Strictly map array indices to parts
      const parts = definition.structure.parts;
      
      const currIdx = parts.indexOf('current');
      if (currIdx >= 0 && values[currIdx] !== undefined) currentStr = values[currIdx];
      else if (parts.indexOf('value') >= 0) currentStr = values[parts.indexOf('value')];
      else if (values[0] !== undefined) currentStr = values[0];

      const maxIdx = parts.indexOf('max');
      if (maxIdx >= 0 && values[maxIdx]) maxStr = values[maxIdx];
      
      const changeIdx = parts.indexOf('change');
      if (changeIdx >= 0 && values[changeIdx]) changeStr = values[changeIdx];

      const reasonIdx = parts.indexOf('reason');
      if (reasonIdx >= 0 && values[reasonIdx]) reasonStr = values[reasonIdx];

      const descIdx = parts.indexOf('description');
      if (descIdx >= 0 && values[descIdx]) descStr = values[descIdx];
  } else {
      // Fallback Strategy
      if (values[0]) currentStr = values[0];
      if (values[1]) maxStr = values[1];
      if (values[2]) changeStr = values[2];
      if (values[3]) reasonStr = values[3];
      if (values[4]) descStr = values[4];
  }

  const current = parseFloat(currentStr);
  const max = maxStr ? parseFloat(maxStr) : 0;
  const hasMax = !!maxStr && max > 0;

  const percentage = hasMax ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

  let barColor = 'var(--color-primary)';
  if (hasMax) {
    if (percentage <= 20) barColor = 'var(--color-danger)';
    else if (percentage <= 50) barColor = 'var(--color-warning)';
    else barColor = 'var(--color-success)';
  }

  const isPositive = changeStr && (changeStr.includes('+') || parseFloat(changeStr) > 0);
  const changeColor = isPositive ? 'var(--color-success)' : 'var(--color-danger)';
  const changeBg = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  return (
    <div 
        className="status-item-row status-item-row--numeric"
        onClick={() => onInteract && onInteract(item)}
        title={`Key: ${item.key}`}
    >
      <div className="numeric-renderer__main-row">
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
            
            {changeStr && changeStr !== '0' && (
              <span 
                className="numeric-renderer__change-indicator"
                style={{ color: changeColor, background: changeBg }}
                title={reasonStr ? `原因: ${reasonStr}` : '变化量'}
              >
                {changeStr}
              </span>
            )}
          </div>
      </div>
      
      {(descStr || reasonStr) && (
        <div className="numeric-renderer__sub-row">
            {descStr && <span className="numeric-renderer__description">{descStr}</span>}
            {reasonStr && !changeStr && (
                 <span className="numeric-renderer__reason">({reasonStr})</span>
            )}
        </div>
      )}
    </div>
  );
};

export default NumericRenderer;
