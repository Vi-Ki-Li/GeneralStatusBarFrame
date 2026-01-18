import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus } from 'lucide-react';
import './MobileAddCharacterModal.css';

interface MobileAddCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, name: string) => void;
  existingIds: string[];
}

const MobileAddCharacterModal: React.FC<MobileAddCharacterModalProps> = ({ 
  isOpen, onClose, onConfirm, existingIds 
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setId('');
      setName('');
      setError('');
    }
  }, [isOpen]);

  const validate = (val: string) => {
    if (existingIds.includes(val)) {
      setError('ID 已存在');
      return false;
    }
    setError('');
    return true;
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setId(val);
    validate(val);
  };

  const handleSubmit = () => {
    if (!id.trim() || !name.trim() || !validate(id.trim())) return;
    onConfirm(id.trim(), name.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-add-char__overlay">
      <div className="mobile-add-char__panel glass-panel">
        <div className="mobile-add-char__header">
          <h3 className="mobile-add-char__title">
            <UserPlus size={20} /> 添加新角色
          </h3>
          <button onClick={onClose} className="mobile-add-char__close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="mobile-add-char__form">
          <div className="mobile-add-char__form-group">
            <label htmlFor="charIdInput" className="mobile-add-char__label">唯一 ID</label>
            <input 
              id="charIdInput"
              value={id}
              onChange={handleIdChange}
              placeholder="e.g. char_001"
              autoFocus
              className={`mobile-add-char__input ${error ? 'error' : ''}`}
            />
            {error && <div className="mobile-add-char__error"><X size={12}/> {error}</div>}
          </div>

          <div className="mobile-add-char__form-group">
            <label htmlFor="charNameInput" className="mobile-add-char__label">显示名称</label>
            <input 
              id="charNameInput"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Eria"
              className="mobile-add-char__input"
            />
          </div>

          <button 
            onClick={handleSubmit}
            className="btn btn--primary mobile-add-char__submit-btn"
            disabled={!id || !name || !!error}
          >
            <Check size={18} /> 确认创建
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAddCharacterModal;