import React, { useState, useRef, useEffect } from 'react';
import { User, Globe, Plus, Sparkles, Check, X, Trash2, Eye, EyeOff, PanelLeftClose } from 'lucide-react';
import './CharacterListSidebar.css';

interface CharacterOption {
  id: string;
  name: string;
  isPresent: boolean;
}

interface CharacterListSidebarProps {
  characters: CharacterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddCharacter: (id: string, name: string) => void;
  onResetData?: () => void;
  onTogglePresence: (id: string) => void;
  onClose?: () => void; // Scheme A: Top toggle
}

const CharacterListSidebar: React.FC<CharacterListSidebarProps> = ({ 
  characters, 
  selectedId, 
  onSelect, 
  onAddCharacter,
  onResetData,
  onTogglePresence,
  onClose
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const idInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && idInputRef.current) {
      idInputRef.current.focus();
    }
  }, [isAdding]);

  const handleStartAdd = () => {
      setIsAdding(true);
  };

  const existingIds = characters.map(c => c.id);
  const isIdDuplicate = existingIds.includes(newId.trim());
  const isValid = newId.trim() && newName.trim() && !isIdDuplicate;

  const handleSubmit = () => {
    if (isValid) {
      onAddCharacter(newId.trim(), newName.trim());
      setNewId('');
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewId('');
    setNewName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="char-sidebar">
      <div className="char-sidebar__header-row">
          <div className="char-sidebar__group-title" style={{marginBottom:0}}>数据源</div>
          {onClose && (
              <button onClick={onClose} className="panel-toggle-btn desktop-only" title="收起侧边栏">
                  <PanelLeftClose size={16} />
              </button>
          )}
      </div>

      <div className="char-sidebar__group">
        <button
            onClick={() => onSelect('SHARED')}
            className={`char-sidebar__item ${selectedId === 'SHARED' ? 'char-sidebar__item--active' : ''}`}
        >
            <div className="char-sidebar__item-main">
                <div className="char-sidebar__item-icon"><Globe size={18} /></div>
                <span className="char-sidebar__item-name">共享/世界</span>
            </div>
        </button>
      </div>

      <div className="char-sidebar__group char-sidebar__group--characters">
        <div className="char-sidebar__group-header">
          <span className="char-sidebar__group-title">角色列表</span>
          <button 
            onClick={handleStartAdd}
            className="char-sidebar__add-btn"
            title="添加角色"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="char-sidebar__list">
          {isAdding && (
            <div className="char-sidebar__add-form animate-fade-in">
              <input
                ref={idInputRef}
                value={newId}
                onChange={e => setNewId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ID (e.g. char_001)"
                className={`char-sidebar__add-input ${isIdDuplicate ? 'error' : ''}`}
              />
              {isIdDuplicate && <div className="char-sidebar__add-error">ID 已存在</div>}
              
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="显示名 (e.g. Eria)"
                className="char-sidebar__add-input char-sidebar__add-input--name"
              />
              <div className="char-sidebar__add-actions">
                <button 
                  onClick={handleSubmit} 
                  disabled={!isValid}
                  className="char-sidebar__add-confirm"
                >
                    <Check size={16} />
                </button>
                <button onClick={handleCancel} className="char-sidebar__add-cancel"><X size={16} /></button>
              </div>
            </div>
          )}

          {characters.map(char => {
            const isSelected = selectedId === char.id; 
            const isUser = char.id === 'char_user';
            
            return (
              <div
                key={char.id}
                onClick={() => onSelect(char.id)}
                className={`char-sidebar__item ${isSelected ? 'char-sidebar__item--active' : ''}`}
              >
                <div className="char-sidebar__item-main">
                    <div className="char-sidebar__item-icon">
                      {isUser ? <User size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div className="char-sidebar__item-info">
                    <span className="char-sidebar__item-name">{char.name}</span>
                    {char.id !== 'char_user' && (
                        <span className="char-sidebar__item-id">{char.id}</span>
                    )}
                    </div>
                </div>

                <button 
                onClick={(e) => { e.stopPropagation(); onTogglePresence(char.id); }}
                className={`char-sidebar__presence-toggle ${char.isPresent ? 'present' : 'hidden'}`}
                title={char.isPresent ? '角色在场 (Visible)' : '角色退场 (Hidden)'}
                >
                    {char.isPresent ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="char-sidebar__footer">
        {onResetData && (
          <button 
            onClick={onResetData}
            className="char-sidebar__reset-btn"
          >
            <Trash2 size={16} />
            <span>清空数据</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CharacterListSidebar;