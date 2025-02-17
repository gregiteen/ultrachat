import React, { useMemo } from 'react';
import { motion, type SVGMotionProps } from 'framer-motion';
import { cn } from '../../../utils';
import { useTheme, type Theme } from '../../../theme';

export interface SpinnerProps {
  size?: keyof typeof sizeMap;
  color?: keyof Theme['colors'];
  thickness?: number;
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
  'aria-label'?: string;
}

const sizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
} as const;

const speedMap = {
  slow: 1.5,
  normal: 1,
  fast: 0.75,
} as const;

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ 
    size = 'md', 
    color = 'primary', 
    thickness = 2, 
    speed = 'normal',
    className,
    'aria-label': ariaLabel = 'Loading',
    ...props
  }, ref) => {
    const { theme } = useTheme();
    
    // Memoize animation variants
    const spinAnimation = useMemo(() => ({
      animate: {
        rotate: 360,
        transition: {
          duration: speedMap[speed],
          repeat: Infinity,
          ease: "linear"
        }
      }
    }), [speed]);

    // Memoize dash animation
    const dashAnimation = useMemo(() => ({
      animate: {
        strokeDasharray: ["1 100", "80 100", "1 100"],
        transition: {
          duration: speedMap[speed] * 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }), [speed]);

    // Memoize SVG props
    const svgProps: SVGMotionProps<SVGSVGElement> = useMemo(() => ({
      viewBox: "0 0 24 24",
      className: cn(sizeMap[size]),
      ...spinAnimation
    }), [size, spinAnimation]);

    // Memoize circle props
    const circleProps = useMemo(() => ({
      cx: "12",
      cy: "12",
      r: "10",
      stroke: theme.colors[color],
      strokeWidth: thickness,
      fill: "none"
    }), [theme.colors, color, thickness]);

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center shrink-0',
          className
        )}
        role="status"
        aria-label={ariaLabel}
        {...props}
      >
        <motion.svg {...svgProps}>
          {/* Background circle */}
          <circle
            className="opacity-25"
            {...circleProps}
          />
          {/* Animated circle */}
          <motion.circle
            className="opacity-75"
            {...circleProps}
            strokeDasharray="1 100"
            {...dashAnimation}
          />
        </motion.svg>
        {/* Screen reader text */}
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';