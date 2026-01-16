import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CircleHelp } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface StatusSectionProps {
  title: string;
  iconName?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

const StatusSection: React.FC<StatusSectionProps> = ({ 
  title, 
  iconName, 
  defaultExpanded = true, 
  children,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // 动态获取图标组件
  const IconComponent = iconName && (LucideIcons as any)[iconName] 
    ? (LucideIcons as any)[iconName] 
    : CircleHelp;

  return (
    <div className={`status-section ${className}`}>
      <div 
        className="status-section-title" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
      >
        <div className="status-section-toggle" style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconComponent size={16} className="status-section-icon" />
          <span>{title}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="status-section-content animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

export default StatusSection;