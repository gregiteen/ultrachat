import React, { useMemo } from 'react';
import { motion, type HTMLMotionProps, type MotionProps, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils';
import { Spinner } from '../../feedback/Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-button-text hover:bg-primary/90 active:bg-primary/95',
        secondary: 'bg-secondary text-button-text hover:bg-secondary/90 active:bg-secondary/95',
        ghost: 'hover:bg-muted hover:text-foreground active:bg-muted/70',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:underline',
        outline: 'border border-input bg-background hover:bg-muted hover:text-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">,
    keyof VariantProps<typeof buttonVariants> | keyof MotionProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    loading, 
    icon, 
    children, 
    disabled, 
    style,
    ...props 
  }, ref) => {
    // Memoize motion variants
    const motionVariants = useMemo(() => ({
      hover: {
        scale: 1.02,
        transition: { duration: 0.2 }
      },
      tap: {
        scale: 0.98,
        transition: { duration: 0.1 }
      },
      loading: {
        scale: [1, 0.98, 1],
        transition: { 
          duration: 1, 
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }), []);

    // Memoize button classes
    const buttonClasses = useMemo(() => 
      cn(buttonVariants({ variant, size, fullWidth }), className),
      [variant, size, fullWidth, className]
    );

    const isDisabled = disabled || loading;

    return (
      <motion.button
        className={buttonClasses}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        whileHover={!isDisabled ? "hover" : undefined}
        whileTap={!isDisabled ? "tap" : undefined}
        animate={loading ? "loading" : undefined}
        variants={motionVariants}
        style={style}
        {...props}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mr-2"
            >
              <Spinner 
                size={size === 'lg' ? 'md' : 'sm'} 
                className="text-current"
              />
            </motion.span>
          ) : icon ? (
            <motion.span
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mr-2"
            >
              {icon}
            </motion.span>
          ) : null}
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';