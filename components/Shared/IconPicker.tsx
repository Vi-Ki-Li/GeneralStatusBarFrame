import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  const [search, setSearch] = useState('');

  // 1. 获取所有图标名称列表 (过滤掉非组件导出)
  const iconList = useMemo(() => {
    return Object.keys(LucideIcons).filter(key => key !== 'createLucideIcon' && key !== 'default');
  }, []);

  // 2. 过滤逻辑
  const filteredIcons = useMemo(() => {
    if (!search) return iconList.slice(0, 100); // 默认只显示前100个避免卡顿
    const lower = search.toLowerCase();
    return iconList.filter(name => name.toLowerCase().includes(lower)).slice(0, 50);
  }, [search, iconList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '400px' }}>
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索图标 (英文)..."
          style={{
            width: '100%',
            padding: '8px 8px 8px 36px',
            borderRadius: '8px',
            border: '1px solid var(--chip-border)',
            background: 'var(--bg-app)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', 
        gap: '8px',
        paddingRight: '4px'
      }}>
        {filteredIcons.map(iconName => {
          const Icon = (LucideIcons as any)[iconName];
          const isSelected = selectedIcon === iconName;
          
          return (
            <button
              key={iconName}
              onClick={() => onSelect(iconName)}
              title={iconName}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                borderRadius: '8px',
                border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--chip-border)',
                background: isSelected ? 'rgba(var(--color-primary), 0.1)' : 'var(--glass-bg)',
                color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
      
      {filteredIcons.length === 0 && (
         <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
             未找到相关图标
         </div>
      )}
    </div>
  );
};

export default IconPicker;