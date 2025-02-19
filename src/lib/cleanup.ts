import { Root } from 'react-dom/client';

// Keep track of root instance
let currentRoot: Root | null = null;

export const setRoot = (root: Root) => {
  currentRoot = root;
};

export const getRoot = () => currentRoot;

// Cleanup function that properly handles root
export const cleanupApp = () => {
  console.log('Cleanup - Scheduling root unmount');
  if (currentRoot) {
    // Defer unmount to next tick to avoid React render conflicts
    setTimeout(() => {
      console.log('Cleanup - Unmounting root');
      currentRoot?.unmount();
      currentRoot = null;
    }, 0);
  }
};

// Register cleanup handlers
export const registerCleanupHandlers = () => {
  // Return cleanup function
  return () => {
    cleanupApp();
  };
};