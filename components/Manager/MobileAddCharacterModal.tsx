import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus } from 'lucide-react';

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
    if (!id.trim() || !name.trim()) return;
    if (!validate(id.trim())) return;
    onConfirm(id.trim(), name.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{ 
        width: '90%', maxWidth: '340px', padding: '24px',
        background: 'var(--bg-app)', border: '1px solid var(--chip-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} className="text-primary" />
            添加新角色
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}>
            <X size={20} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>唯一 ID</label>
            <input 
              value={id}
              onChange={handleIdChange}
              placeholder="e.g. char_001"
              autoFocus
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: error ? '1px solid var(--color-danger)' : '1px solid var(--chip-border)',
                background: 'rgba(0,0,0,0.03)', color: 'var(--text-primary)', outline: 'none',
                fontFamily: 'monospace', fontSize: '1rem'
              }}
            />
            {error && <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={12}/> {error}</div>}
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>显示名称</label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Eria"
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid var(--chip-border)',
                background: 'rgba(0,0,0,0.03)', color: 'var(--text-primary)', outline: 'none',
                fontSize: '1rem'
              }}
            />
          </div>

          <button 
            onClick={handleSubmit}
            className="btn btn--primary"
            disabled={!id || !name || !!error}
            style={{ 
                marginTop: '12px', justifyContent: 'center', padding: '12px',
                opacity: (!id || !name || !!error) ? 0.5 : 1 
            }}
          >
            <Check size={18} /> 确认创建
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAddCharacterModal;