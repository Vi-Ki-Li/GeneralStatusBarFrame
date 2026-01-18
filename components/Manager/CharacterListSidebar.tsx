import React, { useState, useRef, useEffect } from 'react';
import { User, Globe, Plus, Sparkles, Check, X, Trash2, Eye, EyeOff } from 'lucide-react';

interface CharacterOption {
  id: string;
  name: string;
  isPresent: boolean;
}

interface CharacterListSidebarProps {
  characters: CharacterOption[];
  selectedId: string; // 'SHARED' or charID
  onSelect: (id: string) => void;
  onAddCharacter: (id: string, name: string) => void;
  onResetData?: () => void;
  onTogglePresence: (id: string) => void;
}

const CharacterListSidebar: React.FC<CharacterListSidebarProps> = ({ 
  characters, 
  selectedId, 
  onSelect, 
  onAddCharacter,
  onResetData,
  onTogglePresence
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

  // Validation
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
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      background: 'rgba(0,0,0,0.02)'
    }}>
      <div style={{ 
        fontSize: '0.75rem', 
        fontWeight: 600, 
        color: 'var(--text-tertiary)', 
        marginBottom: '8px', 
        paddingLeft: '12px', 
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        数据源
      </div>
      
      <button
          onClick={() => onSelect('SHARED')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            width: '100%',
            border: 'none',
            background: selectedId === 'SHARED' ? 'var(--color-primary)' : 'transparent',
            color: selectedId === 'SHARED' ? '#fff' : 'var(--text-secondary)',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '4px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
      >
          <Globe size={18} />
          <span>共享/世界</span>
      </button>

      <div style={{ 
        marginBottom: '8px', 
        padding: '16px 8px 0 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid var(--chip-border)',
        marginTop: '12px'
      }}>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          color: 'var(--text-tertiary)', 
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          角色列表
        </span>
        <button 
          onClick={() => setIsAdding(true)}
          style={{ 
            background: 'rgba(0,0,0,0.05)', 
            border: '1px solid var(--chip-border)', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            color: 'var(--color-primary)', 
            padding: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          className="hover-bg-accent"
        >
          <Plus size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {isAdding && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '6px',
            padding: '8px', background: 'var(--bg-app)',
            borderRadius: '8px', border: '1px solid var(--color-primary)',
            marginBottom: '4px'
          }}>
            <input
              ref={idInputRef}
              value={newId}
              onChange={e => setNewId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ID (e.g. char_001)"
              style={{
                border: isIdDuplicate ? '1px solid var(--color-danger)' : 'none',
                background: 'rgba(0,0,0,0.05)', width: '100%', padding: '4px 8px', borderRadius: '4px',
                fontSize: '0.85rem', color: isIdDuplicate ? 'var(--color-danger)' : 'var(--text-primary)', 
                outline: 'none', fontFamily: 'monospace'
              }}
            />
            {isIdDuplicate && <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', paddingLeft: '4px' }}>ID 已存在</div>}
            
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="显示名 (e.g. Eria)"
              style={{
                border: 'none', background: 'transparent', width: '100%', padding: '0 8px',
                fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
               <button 
                onClick={handleSubmit} 
                disabled={!isValid}
                style={{ 
                    padding: '4px', cursor: isValid ? 'pointer' : 'not-allowed', 
                    color: isValid ? 'var(--color-success)' : 'var(--text-tertiary)', 
                    background: 'transparent', border: 'none', opacity: isValid ? 1 : 0.5 
                }}
               >
                   <Check size={16} />
               </button>
               <button onClick={handleCancel} style={{ padding: '4px', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'transparent', border: 'none' }}><X size={16} /></button>
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
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', width: '100%', border: 'none',
                background: isSelected ? 'var(--chip-bg)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                borderRadius: '0 8px 8px 0', cursor: 'pointer',
                transition: 'all 0.2s ease', 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {isUser ? <User size={16} /> : <Sparkles size={16} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ 
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 600 : 400 
                    }}>
                        {char.name}
                    </span>
                    {char.id !== 'char_user' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{char.id}</span>
                    )}
                  </div>
              </div>

              {/* Presence Toggle */}
              <button 
                onClick={(e) => { e.stopPropagation(); onTogglePresence(char.id); }}
                style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: char.isPresent ? 'var(--color-success)' : 'var(--text-tertiary)',
                    padding: '4px', display: 'flex', alignItems: 'center'
                }}
                title={char.isPresent ? '角色在场 (Visible)' : '角色退场 (Hidden)'}
              >
                  {char.isPresent ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          );
        })}
      </div>
      
      {onResetData && (
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--chip-border)' }}>
          <button 
            onClick={onResetData}
            style={{
              width: '100%', padding: '10px 12px', fontSize: '0.85rem',
              color: 'var(--color-danger)', background: 'transparent',
              borderRadius: '8px', border: '1px dashed transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
              fontWeight: 500, opacity: 0.8
            }}
            className="hover-danger-dashed"
          >
            <Trash2 size={16} />
            <span>清空数据</span>
          </button>
        </div>
      )}
      <style>{`
        .hover-bg-accent:hover { background: rgba(var(--color-primary), 0.1) !important; border-color: var(--color-primary) !important; }
        .hover-danger-dashed:hover { background: rgba(var(--color-danger), 0.05) !important; border-color: var(--color-danger) !important; opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default CharacterListSidebar;