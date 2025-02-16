import { create } from 'zustand';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

interface GeminiState {
  model: ChatGoogleGenerativeAI | null;
  loading: boolean;
  error: string | null;
  initializeModel: () => Promise<void>;
}

export const useGeminiStore = create<GeminiState>((set) => ({
  model: null,
  loading: false,
  error: null,

  initializeModel: async () => {
    set({ loading: true, error: null });
    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
        modelName: "gemini-pro",
        maxOutputTokens: 2048,
        temperature: 0.7,
      });

      set({ model });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to initialize Gemini model';
      console.error('Error initializing Gemini model:', error);
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },
}));