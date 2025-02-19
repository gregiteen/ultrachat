import { usePersonalizationStore } from '../store/personalization';
import { useContextStore } from '../store/context';
import { useThreadStore } from '../store/chat';

export const initializeStores = async (userId: string) => {
  console.log('StoreInitializer - Starting sequential initialization for user:', userId);
  
  try {
    // Initialize personalization with delay to prevent UI blocking
    console.log('StoreInitializer - Initializing personalization');
    const { init: initPersonalization } = usePersonalizationStore.getState();
    await initPersonalization();
    console.log('StoreInitializer - Personalization initialized');
    
    // Initialize contexts
    console.log('StoreInitializer - Initializing contexts');
    const { fetchContexts } = useContextStore.getState();
    await fetchContexts();
    useContextStore.setState({ initialized: true, loading: false });
    
    // Initialize threads
    console.log('StoreInitializer - Initializing threads');
    const { fetchThreads } = useThreadStore.getState();
    await fetchThreads();
    console.log('StoreInitializer - Threads initialized');
    useThreadStore.setState({ initialized: true });
    
    console.log('StoreInitializer - All stores initialized successfully');
  } catch (error) {
    console.error('StoreInitializer - Error during initialization:', error);
    cleanupStores();
    throw error;
  }
};

const defaultPersonalInfo = {
  name: '',
  email: '',
  phone: '',
  preferences: [],
  interests: [],
  expertise_areas: [],
  communication_style: '',
  learning_style: '',
  work_style: '',
  goals: [],
  backstory: '',
  projects: '',
  resume: '',
  personalization_document: '',
  communication_preferences: {
    tone: ''
  },
  learning_preferences: {
    style: ''
  },
  work_preferences: {
    style: ''
  }
};

// Helper to cleanup stores
export const cleanupStores = () => {
  console.log('StoreInitializer - Resetting stores to initial state');
  
  // Reset stores to initial state using their state setters
  usePersonalizationStore.setState({ 
    initialized: false, 
    loading: false, 
    error: null,
    hasSeenWelcome: false,
    isActive: false,
    personalInfo: defaultPersonalInfo
  });
  
  useContextStore.setState({ 
    contexts: [], 
    initialized: false, 
    loading: false, 
    error: null 
  });
  
  useThreadStore.setState({ 
    threads: [], 
    currentThread: null, 
    loading: false, 
    error: null,
    initialized: false
  });
  
  console.log('StoreInitializer - Stores reset to initial state');
};