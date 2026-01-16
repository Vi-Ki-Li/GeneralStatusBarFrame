
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ManagerModal: React.FC<ManagerModalProps> = ({ isOpen, onClose, children }) => {
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* 
        Headless Panel: 只负责容器和全屏适配，不负责 Header
        Flex 布局确保 children 能撑开
      */}
      <div className="glass-panel manager-modal-panel animate-fade-in">
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--glass-bg)',
          opacity: 0.1, 
          pointerEvents: 'none'
        }}></div>

        {/* 关键修正：移除内建 Header，直接渲染 Children */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ManagerModal;
