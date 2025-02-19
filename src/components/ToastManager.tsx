import React from 'react';
import { useToast } from '../store/toastStore';
import { Toast, ToastContainer } from '../design-system/components/feedback/Toast';

export const ToastManager: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <ToastContainer>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type === 'warning' ? 'info' : toast.type} // Map warning to info since design system doesn't have warning
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContainer>
  );
};