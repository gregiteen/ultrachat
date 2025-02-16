import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils';
import { useTheme, Theme } from '../../../theme';

export interface SpinnerProps {
  size?: keyof typeof sizeMap;
  color?: keyof Theme['colors'];
  thickness?: number;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', color = 'primary', thickness = 2, className }, ref) => {
    const { theme } = useTheme();
    
    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        role="status"
        aria-label="Loading"
      >
        <motion.svg
          className={cn(sizeMap[size])}
          viewBox="0 0 24 24"
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke={theme.colors[color]}
            strokeWidth={thickness}
            fill="none"
          />
          <motion.circle
            className="opacity-75"
            cx="12"
            cy="12"
            r="10"
            stroke={theme.colors[color]}
            strokeWidth={thickness}
            fill="none"
            strokeDasharray="1 100"
            animate={{
              strokeDasharray: ["1 100", "80 100", "1 100"]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.svg>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';