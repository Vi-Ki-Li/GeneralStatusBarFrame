import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './ManagerModal.css';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ManagerModal: React.FC<ManagerModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="manager-modal__overlay animate-fade-in">
      <div className="manager-modal__panel glass-panel animate-fade-in">
        <div className="manager-modal__panel-bg-overlay"></div>
        <div className="manager-modal__content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ManagerModal;