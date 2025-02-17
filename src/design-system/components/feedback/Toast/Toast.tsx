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
  const { theme } = useTheme();

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
          bg: theme.colors.primary,
          icon: '✓'
        };
      case 'warning':
        return {
          bg: theme.colors.accent,
          icon: '⚠'
        };
      case 'error':
        return {
          bg: theme.colors.secondary,
          icon: '✕'
        };
      default:
        return {
          bg: theme.colors.primary,
          icon: 'ℹ'
        };
    }
  };

  const { bg, icon } = getTypeStyles(theme);

  return (
    <AnimatePresence>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        style={{
          background: bg,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.elevation.md,
          color: theme.colors.buttonText,
          display: 'flex',
          alignItems: 'center',
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          minWidth: '200px',
          maxWidth: '400px'
        }}
      >
        <span 
          style={{ 
            marginRight: theme.spacing.sm, 
            fontSize: theme.typography.fontSize.lg
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
              padding: theme.spacing.xs,
              marginLeft: theme.spacing.sm,
              opacity: 0.7,
              transition: `opacity ${theme.animation.duration.fast} ${theme.animation.easing.easeInOut}`
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