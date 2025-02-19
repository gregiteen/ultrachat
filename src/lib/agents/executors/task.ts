import { supabase } from '../../supabase-client';
import type { Task } from '../../../types';

export interface TaskInput {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  status: 'todo' | 'in_progress' | 'done';
  parent_id?: string;
  estimated_duration?: string;
  dependencies?: string[];
  automation_rules?: {
    type: 'recurring' | 'dependent' | 'deadline';
    config: {
      frequency?: string;
      dependsOn?: string[];
      notifyBefore?: number;
    };
  };
}

export class TaskExecutor {
  async createTask(input: TaskInput): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        due_date: input.due_date,
        status: input.status,
        parent_id: input.parent_id,
        estimated_duration: input.estimated_duration,
        dependencies: input.dependencies,
        automation_rules: input.automation_rules
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(taskId: string, updates: Partial<TaskInput>): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(taskId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async listTasks(options: {
    status?: TaskInput['status'];
    priority?: TaskInput['priority'];
    parent_id?: string;
  } = {}): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);

    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.priority) {
      query = query.eq('priority', options.priority);
    }
    if (options.parent_id) {
      query = query.eq('parent_id', options.parent_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      throw error;
    }
    return data;
  }

  async updateTaskStatus(taskId: string, status: TaskInput['status']): Promise<Task> {
    return this.updateTask(taskId, { status });
  }

  async updateTaskPriority(taskId: string, priority: TaskInput['priority']): Promise<Task> {
    return this.updateTask(taskId, { priority });
  }

  async getSubtasks(parentId: string): Promise<Task[]> {
    return this.listTasks({ parent_id: parentId });
  }

  async getDependentTasks(taskId: string): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .contains('dependencies', [taskId]);

    if (error) throw error;
    return data || [];
  }

  async updateDependencies(taskId: string, dependencies: string[]): Promise<Task> {
    return this.updateTask(taskId, { dependencies });
  }

  async updateAutomationRules(
    taskId: string,
    automationRules: TaskInput['automation_rules']
  ): Promise<Task> {
    return this.updateTask(taskId, { automation_rules: automationRules });
  }
}