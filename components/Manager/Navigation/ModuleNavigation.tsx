import React from 'react';
import { Database, Paintbrush, LayoutTemplate, Settings, Box } from 'lucide-react';
import './ModuleNavigation.css';

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
      <div className="module-nav module-nav--mobile">
        {navItems.map(item => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`module-nav__item--mobile ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="module-nav__label--mobile">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="module-nav module-nav--desktop">
      {navItems.map(item => {
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            title={item.label}
            className={`module-nav__item--desktop ${isActive ? 'active' : ''}`}
          >
            <item.icon size={24} />
          </button>
        );
      })}
    </div>
  );
};

export default ModuleNavigation;