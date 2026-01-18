import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './ToastContext.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (message: string, options?: { description?: string }) => void;
    error: (message: string, options?: { description?: string }) => void;
    info: (message: string, options?: { description?: string }) => void;
    warning: (message: string, options?: { description?: string }) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType, options?: { description?: string }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, description: options?.description }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, opts?: { description?: string }) => addToast(msg, 'success', opts),
    error: (msg: string, opts?: { description?: string }) => addToast(msg, 'error', opts),
    info: (msg: string, opts?: { description?: string }) => addToast(msg, 'info', opts),
    warning: (msg: string, opts?: { description?: string }) => addToast(msg, 'warning', opts),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type} animate-slide-in`}>
            <div className="toast__icon">
              {t.type === 'success' && <CheckCircle size={20} />}
              {t.type === 'error' && <AlertCircle size={20} />}
              {t.type === 'warning' && <AlertTriangle size={20} />}
              {t.type === 'info' && <Info size={20} />}
            </div>
            <div className="toast__content">
              <div className="toast__message">{t.message}</div>
              {t.description && <div className="toast__description">{t.description}</div>}
            </div>
            <button className="toast__close" onClick={() => removeToast(t.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};