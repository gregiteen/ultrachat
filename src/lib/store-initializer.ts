import { usePersonalizationStore } from '../store/personalization';
import { useThreadStore } from '../store/threadStore';
import { useMessageStore } from '../store/chat';

let isInitializing = false;
let initialized = false;

export const initializeStores = async (userId: string) => {
  if (isInitializing) {
    console.log('StoreInitializer - Already initializing, skipping');
    return;
  }

  if (initialized) {
    console.log('StoreInitializer - Already initialized, skipping');
    return;
  }

  isInitializing = true;
  try {
    console.log('StoreInitializer - Starting sequential initialization for user:', userId);

    // Initialize personalization
    console.log('StoreInitializer - Initializing personalization');
    await usePersonalizationStore.getState().init();
    console.log('StoreInitializer - Personalization initialized');

    // Initialize threads
    console.log('StoreInitializer - Initializing threads');
    await useThreadStore.getState().fetchThreads();
    console.log('StoreInitializer - Threads initialized');

    // Clear any existing messages
    console.log('StoreInitializer - Clearing message store');
    const currentThread = useThreadStore.getState().currentThread;
    if (currentThread) {
      useMessageStore.getState().clearThreadMessages(currentThread.id);
    }
    console.log('StoreInitializer - Message store cleared');

    console.log('StoreInitializer - All stores initialized successfully');
    initialized = true;
  } finally {
    isInitializing = false;
  }
};

export const cleanupStores = () => {
  console.log('StoreInitializer - Cleaning up stores');
  initialized = false;
  usePersonalizationStore.getState().resetPersonalization();
  useThreadStore.setState({
    threads: [], currentThread: null, initialized: false
  });
  const currentThread = useThreadStore.getState().currentThread;
  if (currentThread) {
    useMessageStore.getState().clearThreadMessages(currentThread.id);
  }
};