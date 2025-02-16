import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { TaskExecutor } from '../lib/agents/executors/task';
import { createTaskChain } from '../lib/agents/chains/task';
import { useGeminiStore } from './gemini';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getSubtasks: (parentId: string) => Promise<Task[]>;
  filterTasks: (options: { status?: Task['status']; priority?: Task['priority'] }) => Task[];
  processTaskRequest: (request: string) => Promise<{
    success: boolean;
    message: string;
  }>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tasks: data || [] });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      console.error('Error fetching tasks:', error);
      set({ error: message });
      // Reset tasks array if there's an error to prevent stale data
      if (get().tasks.length > 0) {
        set({ tasks: [] });
      }
      throw error; // Re-throw to handle in component
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (task: Partial<Task>) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...task,
          user_id: user.id,
          status: task.status || 'todo',
          priority: task.priority || 'medium'
        }])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ tasks: [data, ...state.tasks] }));
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      console.error('Error creating task:', error);
      set({ error: message });
      // Reset loading state immediately on error
      set({ loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? data : t)),
      }));
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      console.error('Error updating task:', error);
      set({ error: message });
      // Reset loading state immediately on error
      set({ loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      console.error('Error deleting task:', error);
      set({ error: message });
      // Reset loading state immediately on error
      set({ loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getSubtasks: async (parentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  filterTasks: ({ status, priority }) => {
    const state = get();
    return state.tasks.filter(task => {
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      return true;
    });
  },

  processTaskRequest: async (request: string) => {
    const executor = new TaskExecutor();
    const model = useGeminiStore.getState().model;
    if (!model) throw new Error('Gemini model not initialized');

    const chain = createTaskChain(model, executor);
    const result = await chain.invoke({ input: request });

    if (result.error) {
      return {
        success: false,
        message: `Failed to process task: ${result.error}`,
      };
    }

    return { success: true, message: result.response };
  },
}));