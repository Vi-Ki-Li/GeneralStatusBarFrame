import React from 'react';
import { StatusBarItem } from '../../../types';
import { Lock } from 'lucide-react';

interface NumericRendererProps {
  item: StatusBarItem;
  onInteract?: (item: StatusBarItem) => void;
}

const NumericRenderer: React.FC<NumericRendererProps> = ({ item, onInteract }) => {
  const rawValue = item.values[0] || '0';
  const changeValue = item.values[1];
  
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

  // 计算百分比
  const percentage = hasMax && max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

  // 动态颜色逻辑
  let barColor = 'var(--color-primary)';
  if (hasMax) {
    if (percentage <= 20) barColor = 'var(--color-danger)';
    else if (percentage <= 50) barColor = 'var(--color-warning)';
    else barColor = 'var(--color-success)';
  }

  const isPositive = changeValue && changeValue.startsWith('+');
  const changeColor = isPositive ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    <div 
        className="status-item-row interactive-row" 
        onClick={() => onInteract && onInteract(item)}
        title="点击引用数值"
    >
      <div className="status-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {item.key}
        {item.user_modified && (
          <span title="用户已锁定，AI无法修改" style={{ display: 'flex' }}>
            <Lock size={10} className="text-warning" style={{ opacity: 0.7 }} />
          </span>
        )}
      </div>
      
      {hasMax ? (
        <div className="progress-container">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${percentage}%`,
              backgroundColor: barColor
            }}
          />
        </div>
      ) : (
        <div style={{ flex: 1 }}></div> 
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '60px', justifyContent: 'flex-end' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {current}
          {hasMax && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8em' }}>/{max}</span>}
        </span>
        
        {changeValue && changeValue !== '±0' && (
          <span style={{ 
            fontSize: '0.75rem', 
            color: changeColor,
            background: `rgba(${isPositive ? '16, 185, 129' : '239, 68, 68'}, 0.1)`,
            padding: '1px 4px',
            borderRadius: '4px',
            fontWeight: 500
          }}>
            {changeValue}
          </span>
        )}
      </div>
      <style>{`
        .interactive-row {
            cursor: pointer;
            transition: background 0.2s;
            border-radius: 4px;
            padding-right: 4px;
            padding-left: 4px;
            margin-left: -4px;
            margin-right: -4px;
        }
        .interactive-row:hover {
            background: rgba(0,0,0,0.03);
        }
        body.dark-mode .interactive-row:hover {
            background: rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
};

export default NumericRenderer;