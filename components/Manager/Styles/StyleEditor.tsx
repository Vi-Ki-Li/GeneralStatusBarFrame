import React, { useState } from 'react';
import { LorebookEntry } from '../../../types';
import { Save, X, RotateCcw } from 'lucide-react';

interface StyleEditorProps {
  entry: LorebookEntry;
  onSave: (name: string, content: string) => void;
  onCancel: () => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ entry, onSave, onCancel }) => {
  // Strip "样式-" prefix for display/editing
  const initialName = entry.comment.replace(/^样式-/, '');
  
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(entry.content);

  const handleSave = () => {
    if (name.trim()) {
      onSave(`样式-${name.trim()}`, content);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Editor Header */}
      <div className="glass-panel" style={{ 
          padding: '16px', 
          marginBottom: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '16px'
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>样式名称:</span>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'var(--bg-app)', 
                padding: '0 10px', 
                borderRadius: '8px', 
                border: '1px solid var(--chip-border)',
                flex: 1,
                maxWidth: '300px'
            }}>
                <span style={{ color: 'var(--text-tertiary)', marginRight: '2px', fontSize: '0.9rem' }}>样式-</span>
                <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="输入样式名"
                    style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '8px 0',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        width: '100%',
                        fontWeight: 500
                    }}
                />
            </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                onClick={onCancel}
                className="btn btn--ghost"
            >
                <X size={16} /> 取消
            </button>
            <button 
                onClick={handleSave}
                className="btn btn--primary"
                disabled={!name.trim()}
            >
                <Save size={16} /> 保存更改
            </button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="glass-panel" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          padding: '0',
          position: 'relative'
      }}>
        <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(0,0,0,0.05)', 
            borderBottom: '1px solid var(--chip-border)',
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
            display: 'flex',
            justifyContent: 'space-between'
        }}>
            <span>CSS Editor</span>
            <span style={{ opacity: 0.7 }}>支持所有标准 CSS 语法</span>
        </div>
        <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            spellCheck={false}
            style={{
                flex: 1,
                width: '100%',
                resize: 'none',
                border: 'none',
                padding: '16px',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                outline: 'none'
            }}
        />
      </div>
    </div>
  );
};

export default StyleEditor;