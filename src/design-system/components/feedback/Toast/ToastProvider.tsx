import React, { createContext, useContext, useCallback, useState } from 'react';
import { Toast, ToastProps } from './Toast';

interface ToastContextValue {
  addToast: (props: Omit<ToastProps, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...props, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      >
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <Toast {...toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};