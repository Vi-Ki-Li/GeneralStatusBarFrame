import React from 'react';
import { User, Sparkles } from 'lucide-react';

interface CharacterTabsProps {
  characters: string[];
  activeChar: string;
  onSelect: (char: string) => void;
}

const CharacterTabs: React.FC<CharacterTabsProps> = ({ characters, activeChar, onSelect }) => {
  return (
    <div className="status-char-selector" style={{ 
      display: 'flex', 
      overflowX: 'auto', 
      gap: '8px', 
      paddingBottom: '8px',
      scrollbarWidth: 'none',
      marginBottom: '10px'
    }}>
      {characters.map(char => {
        const isActive = char === activeChar;
        // User 角色用不同图标区分
        const Icon = char === 'User' ? User : Sparkles;
        
        return (
          <button
            key={char}
            onClick={() => onSelect(char)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
              borderRadius: '8px',
              background: isActive ? 'var(--bg-card)' : 'rgba(255,255,255,0.3)',
              color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Icon size={14} />
            {char}
          </button>
        );
      })}
    </div>
  );
};

export default CharacterTabs;