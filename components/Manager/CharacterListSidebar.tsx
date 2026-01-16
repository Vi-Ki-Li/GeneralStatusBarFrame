import React, { useState, useRef, useEffect } from 'react';
import { User, Globe, Plus, Sparkles, Check, X, Trash2 } from 'lucide-react';

interface CharacterListSidebarProps {
  characters: string[];
  selectedId: string; // 'SHARED' or charID
  onSelect: (id: string) => void;
  onAddCharacter: (name: string) => void;
  onResetData?: () => void;
}

const CharacterListSidebar: React.FC<CharacterListSidebarProps> = ({ 
  characters, 
  selectedId, 
  onSelect, 
  onAddCharacter,
  onResetData
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    if (newName.trim()) {
      onAddCharacter(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
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
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px', background: 'var(--bg-app)',
            borderRadius: '8px', border: '1px solid var(--color-primary)',
            marginBottom: '4px'
          }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="角色名..."
              style={{
                border: 'none', background: 'transparent', width: '100%',
                fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <button onClick={handleSubmit} style={{ padding: '4px', cursor: 'pointer', color: 'var(--color-success)', background: 'transparent', border: 'none' }}><Check size={14} /></button>
            <button onClick={handleCancel} style={{ padding: '4px', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'transparent', border: 'none' }}><X size={14} /></button>
          </div>
        )}

        {characters.map(char => {
          const isSelected = selectedId === char; // Note: parent passes Name, but logic might need ID. Let's assume parent handles conversion for now or passes consistent value.
          // FIX: In DataCenter, we pass the character NAME to this sidebar for display, but ID for selection logic.
          // Wait, this component receives `characters` as string array (names).
          // And `selectedId` might be name or ID.
          // Let's rely on the parent (DataCenter) passing matching values.
          const isUser = char === 'User';
          
          return (
            <button
              key={char}
              onClick={() => onSelect(char)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', width: '100%', border: 'none',
                background: isSelected ? 'var(--chip-bg)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: '0 8px 8px 0', cursor: 'pointer',
                fontWeight: isSelected ? 600 : 400, transition: 'all 0.2s ease', textAlign: 'left'
              }}
            >
              {isUser ? <User size={16} /> : <Sparkles size={16} />}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char}</span>
            </button>
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