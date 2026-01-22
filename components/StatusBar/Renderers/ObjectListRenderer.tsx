import React from 'react';
import { StatusBarItem, ItemDefinition } from '../../../types';
import { Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './ObjectListRenderer.css';

interface ObjectListRendererProps {
  item: StatusBarItem;
  label?: string;
  icon?: string;
  definition?: ItemDefinition;
  onInteract?: (item: StatusBarItem, value?: string) => void;
}

const ObjectListRenderer: React.FC<ObjectListRendererProps> = ({
  item,
  label,
  icon,
  definition,
  onInteract,
}) => {
  const displayLabel = definition?.name || label || item.key;
  const IconComponent = icon && (LucideIcons as any)[icon] ? (LucideIcons as any)[icon] : null;

  const objects = item.values
    .filter(v => v && v.trim() !== '' && v.trim() !== 'nil')
    .map((valueString, index) => {
      const parts = valueString.split(definition?.partSeparator || '@');
      return { id: `${item.key}-${index}`, parts };
    });
    
  const labels = definition?.structure?.labels || definition?.structure?.parts || [];

  return (
    <div className="status-item-row status-item-row--object-list" title={`Key: ${item.key}`}>
      <div className="object-list-renderer__header">
        <span className="status-item-row__label">
          {IconComponent && <IconComponent size={14} className="status-item-row__icon" />}
          {displayLabel}
          {item.user_modified && (
            <span title="用户已锁定，AI无法修改" className="status-item-row__lock-icon">
              <Lock size={10} />
            </span>
          )}
        </span>
        <span className="object-list-renderer__count">{objects.length} 项</span>
      </div>
      <div className="object-list-renderer__card-container">
        {objects.length > 0 ? (
          objects.map(obj => (
            <div
              key={obj.id}
              className="object-card"
              onClick={() => onInteract && onInteract(item, obj.parts.join(definition?.partSeparator || '@'))}
              title="点击引用此项"
            >
              {obj.parts.map((partValue, partIndex) => (
                <div key={partIndex} className="object-card__property">
                  <span className="object-card__label">{labels[partIndex] || `Part ${partIndex + 1}`}</span>
                  <span className="object-card__value">{partValue}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <span className="object-list-renderer__empty-text">空</span>
        )}
      </div>
    </div>
  );
};

export default ObjectListRenderer;
