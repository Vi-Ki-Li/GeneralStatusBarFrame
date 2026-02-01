
import React, { useState } from 'react';
import { CircleHelp, X } from 'lucide-react';
import './ContextHelpButton.css';

interface ContextHelpButtonProps {
  title: string;
  content: React.ReactNode;
}

const ContextHelpButton: React.FC<ContextHelpButtonProps> = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="th-manager__icon-btn" 
        title="功能说明"
        style={{ color: 'var(--color-primary)' }}
      >
        <CircleHelp size={18} />
      </button>

      {isOpen && (
        <div className="context-help-overlay" onClick={() => setIsOpen(false)}>
          <div className="context-help-modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="context-help-header">
              <h3><CircleHelp size={18}/> {title}</h3>
              <button onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>
            <div className="context-help-content">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextHelpButton;
