import React from 'react';
import { StatusBarItem } from '../../../types';
import { Lock } from 'lucide-react';

interface TextRendererProps {
  item: StatusBarItem;
  onInteract?: (item: StatusBarItem) => void;
}

const TextRenderer: React.FC<TextRendererProps> = ({ item, onInteract }) => {
  const text = item.values.join(' ');
  const isLongText = text.length > 20;

  return (
    <div className="status-item-row" style={{ alignItems: isLongText ? 'flex-start' : 'center', flexDirection: isLongText ? 'column' : 'row' }}>
      <div className="status-label" style={{ 
          marginBottom: isLongText ? '4px' : '0', 
          width: isLongText ? '100%' : 'auto',
          display: 'flex', alignItems: 'center', gap: '4px' 
      }}>
        {item.key}
        {item.user_modified && (
          <span title="用户已锁定，AI无法修改" style={{ display: 'flex' }}>
            <Lock size={10} className="text-warning" style={{ opacity: 0.7 }} />
          </span>
        )}
      </div>
      
      <div 
        onClick={() => onInteract && onInteract(item)}
        className="interactive-value"
        style={{ 
          color: 'var(--text-primary)', 
          fontSize: '0.9rem', 
          lineHeight: 1.5,
          textAlign: isLongText ? 'left' : 'right',
          width: isLongText ? '100%' : 'auto',
          background: isLongText ? 'var(--chip-bg)' : 'transparent',
          padding: isLongText ? '8px 10px' : '0',
          borderRadius: isLongText ? '8px' : '0',
          border: isLongText ? '1px solid var(--chip-border)' : 'none',
          cursor: 'pointer',
          transition: 'color 0.2s'
        }}
        title="点击引用"
      >
        {text || '-'}
      </div>
      <style>{`
        .interactive-value:hover {
            color: var(--color-primary) !important;
            text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default TextRenderer;