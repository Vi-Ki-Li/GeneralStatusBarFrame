import React, { useState } from 'react';
import { LorebookEntry } from '../../../types';
import { Save, X } from 'lucide-react';
import './StyleEditor.css';

interface StyleEditorProps {
  entry: LorebookEntry;
  onSave: (name: string, content: string) => void;
  onCancel: () => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ entry, onSave, onCancel }) => {
  const initialName = entry.comment.replace(/^样式-/, '');
  
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(entry.content);

  const handleSave = () => {
    if (name.trim()) {
      onSave(`样式-${name.trim()}`, content);
    }
  };

  return (
    <div className="style-editor">
      <div className="style-editor__header glass-panel">
        <div className="style-editor__name-input-wrapper">
            <label htmlFor="styleNameInput" className="style-editor__name-label">样式名称:</label>
            <div className="style-editor__name-input-field">
                <span className="style-editor__name-prefix">样式-</span>
                <input 
                    id="styleNameInput"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="输入样式名"
                    className="style-editor__name-input"
                />
            </div>
        </div>

        <div className="style-editor__actions">
            <button onClick={onCancel} className="btn btn--ghost">
                <X size={16} /> 取消
            </button>
            <button onClick={handleSave} className="btn btn--primary" disabled={!name.trim()}>
                <Save size={16} /> 保存更改
            </button>
        </div>
      </div>

      <div className="style-editor__editor-area glass-panel">
        <div className="style-editor__editor-header">
            <span>CSS Editor</span>
            <span className="style-editor__editor-hint">支持所有标准 CSS 语法</span>
        </div>
        <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            spellCheck={false}
            className="style-editor__textarea"
        />
      </div>
    </div>
  );
};

export default StyleEditor;