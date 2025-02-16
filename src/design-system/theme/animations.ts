import { Theme } from './types';

/**
 * Page transition variants for Framer Motion
 */
export const pageTransitions = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: {
    duration: 0.3,
    ease: 'easeInOut'
  }
};

/**
 * Loading state animations for different components
 */
export const loadingStates = {
  button: {
    initial: { scale: 1 },
    loading: {
      scale: [1, 0.98, 1],
      transition: {
        duration: 1,
        repeat: Infinity
      }
    }
  },
  skeleton: {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity
      }
    }
  }
};

/**
 * Micro-interaction variants for interactive elements
 */
export const microInteractions = {
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeInOut'
    }
  }
};

/**
 * Generates CSS keyframes for fade transitions
 */
export function generateFadeTransitions(theme: Theme): string {
  return `
    .fade-enter {
      opacity: 0;
      transform: translateY(10px);
    }
    
    .fade-enter-active {
      opacity: 1;
      transform: translateY(0);
      transition: opacity ${theme.animation.duration.normal} ${theme.animation.easing.easeOut},
                  transform ${theme.animation.duration.normal} ${theme.animation.easing.easeOut};
    }
    
    .fade-exit {
      opacity: 1;
      transform: translateY(0);
    }
    
    .fade-exit-active {
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity ${theme.animation.duration.normal} ${theme.animation.easing.easeIn},
                  transform ${theme.animation.duration.normal} ${theme.animation.easing.easeIn};
    }
  `;
}

/**
 * Generates CSS for reduced motion preferences
 */
export function generateReducedMotionStyles(): string {
  return `
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      .fade-enter, .fade-enter-active,
      .fade-exit, .fade-exit-active {
        transform: none !important;
        transition: opacity 0.01ms !important;
      }
    }
  `;
}