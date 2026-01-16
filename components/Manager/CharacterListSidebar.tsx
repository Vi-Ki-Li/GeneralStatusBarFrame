import React, { useState, useRef, useEffect } from 'react';
import { User, Globe, Plus, Sparkles, Camera, Check, X, Trash2, Layers, ListFilter, Paintbrush, CircleHelp, Box } from 'lucide-react';

interface CharacterListSidebarProps {
  characters: string[];
  selectedChar: string | 'SHARED' | 'SNAPSHOT' | 'PRESETS' | 'ENTRIES' | 'STYLES' | 'HELP' | 'DEFINITIONS'; // Updated
  onSelect: (id: string | 'SHARED' | 'SNAPSHOT' | 'PRESETS' | 'ENTRIES' | 'STYLES' | 'HELP' | 'DEFINITIONS') => void; // Updated
  onAddCharacter: (name: string) => void;
  onResetData?: () => void;
}

const CharacterListSidebar: React.FC<CharacterListSidebarProps> = ({ 
  characters, 
  selectedChar, 
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
    console.log('[Sidebar] Submitting new character:', newName);
    if (newName.trim()) {
      onAddCharacter(newName.trim());
      setNewName('');
      setIsAdding(false);
    } else {
      console.warn('[Sidebar] Empty character name, ignored.');
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

  const renderNavButton = (id: string, icon: React.ReactNode, label: string, isDanger = false) => {
      const isSelected = selectedChar === id;
      return (
        <button
            onClick={() => onSelect(id as any)}
            style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            width: '100%',
            border: 'none',
            background: isSelected ? 'var(--color-primary)' : 'transparent',
            color: isSelected ? '#fff' : (isDanger ? 'var(--color-danger)' : 'var(--text-secondary)'),
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '4px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            textAlign: 'left'
            }}
        >
            {icon}
            <span>{label}</span>
        </button>
      );
  };

  return (
    <div style={{
      width: '240px',
      background: 'rgba(0,0,0,0.05)',
      borderRight: '1px solid var(--chip-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px'
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
        全局数据
      </div>
      
      {renderNavButton('SHARED', <Globe size={18} />, '共享/世界')}
      {renderNavButton('DEFINITIONS', <Box size={18} />, '定义工作室')}
      {renderNavButton('STYLES', <Paintbrush size={18} />, '样式管理')}
      {renderNavButton('ENTRIES', <ListFilter size={18} />, '条目管理')}
      {renderNavButton('PRESETS', <Layers size={18} />, '配置预设')}

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
          onClick={(e) => {
            console.log('[Sidebar] Add Character button clicked');
            e.preventDefault();
            e.stopPropagation();
            setIsAdding(true);
          }}
          style={{ 
            background: 'rgba(0,0,0,0.05)', 
            border: '1px solid var(--chip-border)', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            color: 'var(--color-primary)', 
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          className="hover-bg-accent"
          title="添加新角色"
        >
          <Plus size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {isAdding && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px',
            background: 'var(--bg-app)',
            borderRadius: '8px',
            border: '1px solid var(--color-primary)',
            marginBottom: '4px'
          }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="角色名..."
              style={{
                border: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                outline: 'none',
                minWidth: 0
              }}
            />
            <button 
              onClick={handleSubmit} 
              style={{ padding: '4px', cursor: 'pointer', color: 'var(--color-success)', background: 'transparent', border: 'none' }}
            >
              <Check size={14} />
            </button>
            <button 
              onClick={handleCancel} 
              style={{ padding: '4px', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'transparent', border: 'none' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {characters.map(char => {
          const isSelected = selectedChar === char;
          const isUser = char === 'User';
          
          return (
            <button
              key={char}
              onClick={() => onSelect(char)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                width: '100%',
                border: 'none',
                background: isSelected ? 'var(--chip-bg)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: '0 8px 8px 0',
                cursor: 'pointer',
                fontWeight: isSelected ? 600 : 400,
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
            >
              {isUser ? <User size={16} /> : <Sparkles size={16} />}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {char}
              </span>
            </button>
          );
        })}
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--chip-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => onSelect('SNAPSHOT')}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '0.85rem',
            color: selectedChar === 'SNAPSHOT' ? '#fff' : 'var(--text-secondary)',
            background: selectedChar === 'SNAPSHOT' ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'transparent',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 500,
            transition: 'all 0.2s',
            boxShadow: selectedChar === 'SNAPSHOT' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
          }}
        >
          <Camera size={16} />
          <span>动态世界快照</span>
        </button>

        {renderNavButton('HELP', <CircleHelp size={18} />, '使用指南')}

        {/* Reset Data Button */}
        {onResetData && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onResetData();
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '0.85rem',
              color: 'var(--color-danger)',
              background: 'transparent',
              borderRadius: '8px',
              border: '1px dashed transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 500,
              transition: 'all 0.2s',
              opacity: 0.8
            }}
            className="hover-danger-dashed"
            title="点击此按钮将清空所有数据"
          >
            <Trash2 size={16} />
            <span>清空数据</span>
          </button>
        )}
      </div>

      <style>{`
        .hover-bg-accent:hover {
          background: rgba(var(--color-primary), 0.1) !important;
          border-color: var(--color-primary) !important;
        }
        .hover-danger-dashed:hover {
          background: rgba(var(--color-danger), 0.05) !important;
          border-color: var(--color-danger) !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default CharacterListSidebar;