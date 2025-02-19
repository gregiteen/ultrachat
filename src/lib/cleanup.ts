// Simplified cleanup that doesn't clear auth
export const cleanupApp = () => {
  console.log('Cleanup - No cleanup needed');
};

// Register cleanup handlers
export const registerCleanupHandlers = () => {
  // Return empty cleanup function
  return () => {
    console.log('Cleanup - No cleanup needed');
  };
};