import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../theme';
import type { Theme } from '../../../theme/types';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const { currentTheme } = useTheme();

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variants = {
    initial: { opacity: 0, y: 50, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
  };

  const getTypeStyles = (theme: Theme) => {
    switch (type) {
      case 'success':
        return {
          bg: theme.colors['accent-foreground'],
          icon: '✓'
        };
      case 'warning':
        return {
          bg: theme.colors.destructive,
          icon: '⚠'
        };
      case 'error':
        return {
          bg: theme.colors.destructive,
          icon: '✕'
        };
      default:
        return {
          bg: theme.colors.accent,
          icon: 'ℹ'
        };
    }
  };

  const { bg, icon } = getTypeStyles(currentTheme);

  return (
    <AnimatePresence>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        style={{
          background: bg,
          borderRadius: '0.375rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          color: currentTheme.colors.foreground,
          display: 'flex',
          alignItems: 'center',
          padding: '1rem',
          marginBottom: '0.5rem',
          minWidth: '200px',
          maxWidth: '400px'
        }}
      >
        <span 
          style={{ 
            marginRight: '0.5rem', 
            fontSize: '1.125rem'
          }}
        >
          {icon}
        </span>
        <span style={{ flex: 1 }}>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0.25rem',
              marginLeft: '0.5rem',
              opacity: 0.7,
              transition: 'opacity 150ms ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
          >
            ✕
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};