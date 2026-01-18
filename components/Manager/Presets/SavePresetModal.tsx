import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import './SavePresetModal.css';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  entryCount: number;
}

const SavePresetModal: React.FC<SavePresetModalProps> = ({ isOpen, onClose, onSave, entryCount }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="save-preset-modal__overlay">
      <div className="save-preset-modal__panel glass-panel">
        <div className="save-preset-modal__header">
          <h3 className="save-preset-modal__title">保存配置预设</h3>
          <button onClick={onClose} className="save-preset-modal__close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="save-preset-modal__content">
            <p className="save-preset-modal__info">
                当前有 <strong>{entryCount}</strong> 个启用的世界书条目将被保存。
            </p>
            <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="输入配置名称 (例如: 战斗模式)"
                className="save-preset-modal__input"
                onKeyDown={e => {
                    if (e.key === 'Enter' && name.trim()) {
                        onSave(name.trim());
                        setName('');
                    }
                }}
            />
        </div>

        <div className="save-preset-modal__actions">
          <button 
            onClick={onClose}
            className="btn btn--ghost"
          >
            取消
          </button>
          <button 
            onClick={() => {
                if(name.trim()) {
                    onSave(name.trim());
                    setName('');
                }
            }}
            className="btn btn--primary"
            disabled={!name.trim()}
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePresetModal;