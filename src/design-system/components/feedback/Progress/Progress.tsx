import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils';

export interface ProgressProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'error' | 'warning';
  indeterminate?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
} as const;

const variantMap = {
  default: 'bg-primary',
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500'
} as const;

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  indeterminate = false,
  label,
  showValue = false,
  className,
  ...props
}, ref) => {
  // Normalize value between 0 and 100
  const percentage = useMemo(() => 
    Math.min(100, Math.max(0, (value / max) * 100)),
    [value, max]
  );

  // Indeterminate animation variants
  const indeterminateVariants = {
    initial: {
      scaleX: 0.5,
      x: '-100%'
    },
    animate: {
      scaleX: [0.5, 1, 0.5],
      x: ['0%', '100%', '0%'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  // Determinate animation variants
  const determinateVariants = {
    initial: { width: 0 },
    animate: {
      width: `${percentage}%`,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuetext={indeterminate ? 'Loading...' : `${percentage}%`}
      aria-label={label}
      className="w-full"
      ref={ref}
      {...props}
    >
      {/* Label and value */}
      {(label || showValue) && (
        <div className="flex justify-between text-sm mb-1">
          {label && (
            <span className="text-muted-foreground">
              {label}
            </span>
          )}
          {showValue && !indeterminate && (
            <span className="text-muted-foreground font-medium">
              {percentage}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-muted',
          sizeMap[size],
          className
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            variantMap[variant]
          )}
          initial="initial"
          animate="animate"
          variants={indeterminate ? indeterminateVariants : determinateVariants}
          style={indeterminate ? {
            width: '100%',
            transformOrigin: 'left'
          } : undefined}
        />
      </div>
    </div>
  );
});

Progress.displayName = 'Progress';