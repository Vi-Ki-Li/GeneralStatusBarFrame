
import React, { useState, useRef, useEffect } from 'react';
import { User, Globe, Plus, Sparkles, Check, X, Trash2, Eye, EyeOff, PanelLeftClose, Database } from 'lucide-react';
// import './CharacterListSidebar.css'; // Now using ManagerLayout.css primarily

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
  onDeleteCharacter: (id: string) => void; // 此处添加1行
  onClose?: () => void;
}

const CharacterListSidebar: React.FC<CharacterListSidebarProps> = ({ 
  characters, 
  selectedId, 
  onSelect, 
  onAddCharacter,
  onResetData,
  onTogglePresence,
  onDeleteCharacter, // 此处添加1行
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
    <>
      <div className="th-manager__sidebar-header">
          <div className="th-manager__sidebar-title">
              <Database size={16} /> 数据源
          </div>
          {onClose && (
              <button onClick={onClose} className="th-manager__icon-btn desktop-only" title="收起侧边栏">
                  <PanelLeftClose size={16} />
              </button>
          )}
      </div>

      <div className="th-manager__sidebar-content">
        <button
            onClick={() => onSelect('SHARED')}
            className={`th-manager__list-item ${selectedId === 'SHARED' ? 'th-manager__list-item--active' : ''}`}
        >
            <div className="th-manager__item-main">
                <div className="th-manager__item-icon"><Globe size={18} /></div>
                <span className="th-manager__item-text">共享/世界</span>
            </div>
        </button>

        <div style={{
            marginTop: 'var(--spacing-lg)', 
            paddingTop: 'var(--spacing-sm)', 
            borderTop: '1px solid var(--border-base)',
            marginBottom: '4px'
        }}>
            <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '8px', 
                padding: '0 8px'
            }}>
                <span className="th-manager__sidebar-title" style={{fontSize: '0.75rem'}}>角色列表</span>
                <button 
                    onClick={handleStartAdd}
                    className="th-manager__icon-btn"
                    title="添加角色"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>

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
                className={`th-manager__list-item ${isSelected ? 'th-manager__list-item--active' : ''}`}
              >
                <div className="th-manager__item-main">
                    <div className="th-manager__item-icon">
                      {isUser ? <User size={16} /> : <Sparkles size={16} />}
                    </div>
                    <span className="th-manager__item-text">{char.name}</span>
                    {char.id !== 'char_user' && (
                        <span className="th-manager__item-meta">{char.id}</span>
                    )}
                </div>

                <div className="th-manager__item-actions">
                    {char.id !== 'char_user' && ( // 此处开始添加7行
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteCharacter(char.id); }}
                            className="th-manager__icon-btn th-manager__icon-btn--danger"
                            title="删除角色"
                        >
                            <Trash2 size={16} />
                        </button>
                    )} 
                    <button 
                        onClick={(e) => { e.stopPropagation(); onTogglePresence(char.id); }}
                        className={`th-manager__icon-btn`}
                        title={char.isPresent ? '角色在场 (Visible)' : '角色退场 (Hidden)'}
                        style={{color: char.isPresent ? 'var(--color-success)' : 'var(--text-tertiary)'}}
                    >
                        {char.isPresent ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
              </div>
            );
        })}
      </div>
      
      <div className="th-manager__sidebar-footer">
        {onResetData && (
          <button 
            onClick={onResetData}
            className="th-manager__list-item"
            style={{color: 'var(--text-tertiary)', justifyContent: 'center'}}
          >
            <Trash2 size={16} />
            <span>清空数据</span>
          </button>
        )}
      </div>
    </>
  );
};

export default CharacterListSidebar;
