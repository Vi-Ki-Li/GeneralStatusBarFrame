import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CircleHelp } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

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
  
  // 动态获取图标组件
  const IconComponent = iconName && (LucideIcons as any)[iconName] 
    ? (LucideIcons as any)[iconName] 
    : CircleHelp;

  // 构建样式
  const getLayoutStyles = (): React.CSSProperties => {
      if (layoutMode === 'grid') {
          return {
              display: 'grid',
              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
              gap: '8px',
              padding: '0 12px 12px 12px'
          };
      }
      if (layoutMode === 'tags') {
          return {
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              padding: '0 12px 12px 12px'
          };
      }
      // List (Default)
      return {
          display: 'flex',
          flexDirection: 'column',
          padding: '0 16px 16px 16px'
      };
  };

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
        <div 
            className={`status-section-content animate-fade-in layout-${layoutMode}`}
            style={getLayoutStyles()}
        >
          {children}
        </div>
      )}
      
      {/* 响应式样式覆盖：手机端强制单列/双列，避免4列过于拥挤 */}
      <style>{`
         @media (max-width: 600px) {
             .layout-grid {
                 grid-template-columns: repeat(2, 1fr) !important;
             }
         }
      `}</style>
    </div>
  );
};

export default StatusSection;