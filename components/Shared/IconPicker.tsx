import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import './IconPicker.css';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  const [search, setSearch] = useState('');

  const iconList = useMemo(() => {
    return Object.keys(LucideIcons).filter(key => key !== 'createLucideIcon' && key !== 'default');
  }, []);

  const filteredIcons = useMemo(() => {
    if (!search) return iconList.slice(0, 100);
    const lower = search.toLowerCase();
    return iconList.filter(name => name.toLowerCase().includes(lower)).slice(0, 50);
  }, [search, iconList]);

  return (
    <div className="icon-picker">
      <div className="icon-picker__search-wrapper">
        <Search size={16} className="icon-picker__search-icon" />
        <input 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索图标 (英文)..."
          className="icon-picker__search-input"
        />
      </div>

      <div className="icon-picker__grid">
        {filteredIcons.map(iconName => {
          const Icon = (LucideIcons as any)[iconName];
          const isSelected = selectedIcon === iconName;
          
          return (
            <button
              key={iconName}
              onClick={() => onSelect(iconName)}
              title={iconName}
              className={`icon-picker__item ${isSelected ? 'icon-picker__item--selected' : ''}`}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
      
      {filteredIcons.length === 0 && (
         <div className="icon-picker__no-results">
             未找到相关图标
         </div>
      )}
    </div>
  );
};

export default IconPicker;