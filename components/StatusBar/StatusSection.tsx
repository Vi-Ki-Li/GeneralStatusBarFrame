import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CircleHelp } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './StatusSection.css';

interface StatusSectionProps {
  title: string;
  iconName?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  layoutMode?: 'list' | 'grid' | 'tags';
  gridColumns?: number;
}

const StatusSection: React.FC<StatusSectionProps> = ({ 
  title, 
  iconName, 
  defaultExpanded = true, 
  children,
  className = '',
  layoutMode = 'list',
  gridColumns = 2
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const IconComponent = iconName && (LucideIcons as any)[iconName] 
    ? (LucideIcons as any)[iconName] 
    : CircleHelp;

  const getLayoutStyles = (): React.CSSProperties => {
      if (layoutMode === 'grid') {
          return {
              '--grid-columns': gridColumns,
          } as React.CSSProperties;
      }
      return {};
  };

  return (
    <div className={`status-section ${className}`}>
      <div 
        className="status-section__header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="status-section__toggle-icon">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        <div className="status-section__title">
          <IconComponent size={16} className="status-section__title-icon" />
          <span>{title}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div 
            className={`status-section__content animate-fade-in layout--${layoutMode}`}
            style={getLayoutStyles()}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default StatusSection;