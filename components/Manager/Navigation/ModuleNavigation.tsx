import React from 'react';
import { Database, Paintbrush, LayoutTemplate, Settings, Box } from 'lucide-react';

export type ManagerModule = 'DATA' | 'DEFINITIONS' | 'STYLES' | 'LAYOUT' | 'SYSTEM';

interface ModuleNavigationProps {
  activeModule: ManagerModule;
  onSelect: (module: ManagerModule) => void;
  isMobile: boolean;
}

const ModuleNavigation: React.FC<ModuleNavigationProps> = ({ activeModule, onSelect, isMobile }) => {
  const navItems: { id: ManagerModule; label: string; icon: React.ElementType }[] = [
    { id: 'DATA', label: '数据中心', icon: Database },
    { id: 'DEFINITIONS', label: '定义工坊', icon: Box },
    { id: 'STYLES', label: '样式工坊', icon: Paintbrush },
    { id: 'LAYOUT', label: '布局编排', icon: LayoutTemplate },
    { id: 'SYSTEM', label: '系统配置', icon: Settings },
  ];

  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        background: 'var(--glass-bg)',
        borderTop: '1px solid var(--chip-border)',
        padding: '8px 4px',
        flexShrink: 0
      }}>
        {navItems.map(item => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)',
                flex: 1
              }}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <div style={{
      width: '80px',
      background: 'rgba(0,0,0,0.02)',
      borderRight: '1px solid var(--chip-border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 0',
      gap: '24px',
      flexShrink: 0
    }}>
      {navItems.map(item => {
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            title={item.label}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: 'none',
              background: isActive ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'transparent',
              color: isActive ? 'white' : 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <item.icon size={24} />
          </button>
        );
      })}
    </div>
  );
};

export default ModuleNavigation;