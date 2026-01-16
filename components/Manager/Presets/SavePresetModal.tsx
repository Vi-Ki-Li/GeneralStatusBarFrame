import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

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
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60
    }}>
      <div className="glass-panel" style={{
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        background: 'var(--bg-app)',
        border: '1px solid var(--chip-border)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>保存配置预设</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                当前有 <strong style={{ color: 'var(--color-primary)' }}>{entryCount}</strong> 个启用的世界书条目将被保存。
            </p>
            <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="输入配置名称 (例如: 战斗模式)"
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--chip-border)',
                    background: 'rgba(0,0,0,0.05)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '1rem'
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter' && name.trim()) {
                        onSave(name.trim());
                        setName('');
                    }
                }}
            />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
            style={{ opacity: !name.trim() ? 0.5 : 1 }}
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