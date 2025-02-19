import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Prompt, Category } from '../types/prompts';
import { usePersonalizationStore } from './personalization';

interface PromptState {
  prompts: Prompt[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchPrompts: () => Promise<void>;
  savePrompt: (content: string, title?: string, metadata?: { assistant?: string; personalization?: boolean; search?: boolean; tools?: string[] }) => Promise<void>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addCategory: (name: string, parentId?: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  categories: [],
  loading: false,
  error: null,
  initialized: false,

  fetchPrompts: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch prompts and categories in parallel
      const [promptsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('prompts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('prompt_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })
      ]);

      if (promptsResponse.error) throw promptsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      set({
        prompts: promptsResponse.data || [],
        categories: categoriesResponse.data || [],
        initialized: true,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching prompts:', error);
      set({ error: 'Failed to fetch prompts', loading: false });
    }
  },

  savePrompt: async (content: string, title?: string, metadata?: { assistant?: string; personalization?: boolean; search?: boolean; tools?: string[] }) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current states
      const { isActive: personalizationActive, personalInfo } = usePersonalizationStore.getState();

      // Generate title if not provided
      const promptTitle = title || content.slice(0, 50).trim() + '...';

      // Create prompt object
      const prompt: Omit<Prompt, 'id' | 'created_at'> = {
        user_id: user.id,
        content,
        title: promptTitle,
        category: 'General', // Default category
        tags: [], // Can be updated later
        favorite: false,
        personalization_state: personalizationActive ? {
          isActive: true,
          context: {
            name: personalInfo.name,
            preferences: personalInfo.preferences,
            interests: personalInfo.interests,
            expertise_areas: personalInfo.expertise_areas
          }
        } : undefined,
        metadata
      };

      const { data, error } = await supabase
        .from('prompts')
        .insert([prompt])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        prompts: [data, ...state.prompts],
        loading: false
      }));
    } catch (error) {
      console.error('Error saving prompt:', error);
      set({ error: 'Failed to save prompt', loading: false });
    }
  },

  updatePrompt: async (id: string, updates: Partial<Prompt>) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        prompts: state.prompts.map(p =>
          p.id === id ? { ...p, ...updates } : p
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating prompt:', error);
      set({ error: 'Failed to update prompt', loading: false });
    }
  },

  deletePrompt: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        prompts: state.prompts.filter(p => p.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting prompt:', error);
      set({ error: 'Failed to delete prompt', loading: false });
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      const prompt = get().prompts.find(p => p.id === id);
      if (!prompt) throw new Error('Prompt not found');

      await get().updatePrompt(id, { favorite: !prompt.favorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      set({ error: 'Failed to toggle favorite' });
    }
  },

  addCategory: async (name: string, parentId?: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const category = {
        user_id: user.id,
        name,
        parent_id: parentId
      };

      const { data, error } = await supabase
        .from('prompt_categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        categories: [...state.categories, data],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding category:', error);
      set({ error: 'Failed to add category', loading: false });
    }
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('prompt_categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        categories: state.categories.map(c =>
          c.id === id ? { ...c, ...updates } : c
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating category:', error);
      set({ error: 'Failed to update category', loading: false });
    }
  },

  deleteCategory: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('prompt_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        categories: state.categories.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting category:', error);
      set({ error: 'Failed to delete category', loading: false });
    }
  }
}));