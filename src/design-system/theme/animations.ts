import { Theme } from './types';
import type { Variants, Transition } from 'framer-motion';

// Base transitions that can be extended
export const baseTransition: Transition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1], // Custom easing for smooth animations
};

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

// Page transition variants
export const pageTransitions: Variants = {
  initial: { 
    opacity: 0, 
    x: -10,
    transition: baseTransition 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: baseTransition 
  },
  exit: { 
    opacity: 0, 
    x: 10,
    transition: baseTransition 
  }
};

// Loading state variants
export const loadingStates = {
  button: {
    initial: { scale: 1 },
    loading: {
      scale: [1, 0.98, 1],
      transition: {
        ...baseTransition,
        duration: 1,
        repeat: Infinity,
        repeatType: 'reverse'
      }
    }
  },
  spinner: {
    rotate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    },
    dash: {
      strokeDasharray: ['1 100', '80 100', '1 100'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },
  skeleton: {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }
} as const;

// Micro-interaction variants
export const microInteractions = {
  hover: {
    scale: 1.02,
    transition: {
      ...baseTransition,
      duration: 0.2
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      ...baseTransition,
      duration: 0.1
    }
  },
  focus: {
    scale: 1.01,
    transition: springTransition
  }
} as const;

// Modal/Dialog animations
export const dialogTransitions: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    transition: baseTransition
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: springTransition
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: baseTransition
  }
};

// Dropdown/Menu animations
export const menuTransitions: Variants = {
  initial: { 
    opacity: 0, 
    y: -4,
    transition: baseTransition
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: springTransition
  },
  exit: { 
    opacity: 0, 
    y: -4,
    transition: baseTransition
  }
};

// Toast/Notification animations
export const toastTransitions: Variants = {
  initial: { 
    opacity: 0, 
    x: 20,
    transition: baseTransition
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: springTransition
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: baseTransition
  }
};

/**
 * Generates CSS keyframes for fade transitions
 */
export function generateFadeTransitions(theme: Theme): string {
  return `
    .fade-enter {
      opacity: 0;
      transform: translateY(8px);
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
      transform: translateY(-8px);
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

      /* Disable specific animations */
      .animate-spin,
      .animate-pulse,
      .animate-bounce {
        animation: none !important;
      }

      /* Ensure instant state changes */
      [data-motion="true"] {
        transition: none !important;
        transform: none !important;
      }
    }
  `;
}