import React from 'react';
import { User, Sparkles } from 'lucide-react';
import './CharacterTabs.css';

interface CharacterTabsProps {
  characters: string[];
  activeChar: string;
  onSelect: (char: string) => void;
}

const CharacterTabs: React.FC<CharacterTabsProps> = ({ characters, activeChar, onSelect }) => {
  return (
    <div className="character-tabs">
      {characters.map(char => {
        const isActive = char === activeChar;
        const Icon = char === 'User' ? User : Sparkles;
        
        return (
          <button
            key={char}
            onClick={() => onSelect(char)}
            className={`character-tabs__button ${isActive ? 'character-tabs__button--active' : ''}`}
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