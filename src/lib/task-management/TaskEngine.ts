import { Task, AutomationRule } from '../../types';
import { EventEmitter } from 'events';

interface TaskEngineEvents {
  'task:created': (task: Task) => void;
  'task:updated': (task: Task) => void;
  'task:deleted': (taskId: string) => void;
  'task:completed': (task: Task) => void;
  'task:automated': (task: Task, rule: AutomationRule) => void;
  'task:dependency:resolved': (task: Task, dependencies: Task[]) => void;
  'task:deadline:approaching': (task: Task, hoursRemaining: number) => void;
}

declare interface TaskEngine {
  on<E extends keyof TaskEngineEvents>(event: E, listener: TaskEngineEvents[E]): this;
  emit<E extends keyof TaskEngineEvents>(event: E, ...args: Parameters<TaskEngineEvents[E]>): boolean;
}

class TaskEngine extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private automationQueue: Array<{ task: Task; rule: AutomationRule }> = [];
  private isProcessing: boolean = false;

  // Cache for dependency resolution
  private dependencyCache: Map<string, Set<string>> = new Map();
  
  // Task scheduling timeouts
  private scheduleTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.startAutomationProcessor();
  }

  /**
   * Adds or updates a task in the engine
   */
  async upsertTask(task: Task): Promise<Task> {
    const isNew = !this.tasks.has(task.id);
    this.tasks.set(task.id, task);

    // Clear dependency cache for this task
    this.dependencyCache.delete(task.id);

    // Process automation rules
    if (task.automation_rules) {
      this.queueAutomation(task, task.automation_rules);
    }

    // Emit appropriate event
    this.emit(isNew ? 'task:created' : 'task:updated', task);

    // Check if task completion affects other tasks
    if (task.status === 'done') {
      this.handleTaskCompletion(task);
    }

    return task;
  }

  /**
   * Removes a task from the engine
   */
  async deleteTask(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
    this.dependencyCache.delete(taskId);
    this.clearTaskSchedule(taskId);
    this.emit('task:deleted', taskId);
  }

  /**
   * Gets all dependencies for a task
   */
  async getTaskDependencies(taskId: string): Promise<Task[]> {
    const task = this.tasks.get(taskId);
    if (!task?.automation_rules?.config.dependsOn) {
      return [];
    }

    return Array.from(this.tasks.values())
      .filter(t => task.automation_rules?.config.dependsOn?.includes(t.id));
  }

  /**
   * Checks if all dependencies for a task are complete
   */
  async areDependenciesComplete(taskId: string): Promise<boolean> {
    const dependencies = await this.getTaskDependencies(taskId);
    return dependencies.every(task => task.status === 'done');
  }

  /**
   * Processes recurring task rules
   */
  private async handleRecurringTask(task: Task, rule: AutomationRule): Promise<void> {
    if (rule.type !== 'recurring' || !rule.config.frequency) return;

    const newTask: Omit<Task, 'id'> = {
      ...task,
      status: 'todo',
      created_at: new Date().toISOString(),
      automation_rules: {
        ...rule,
        status: 'active'
      }
    };

    // Calculate next due date based on frequency
    if (task.due_date) {
      const currentDue = new Date(task.due_date);
      switch (rule.config.frequency) {
        case 'daily':
          currentDue.setDate(currentDue.getDate() + 1);
          break;
        case 'weekly':
          currentDue.setDate(currentDue.getDate() + 7);
          break;
        case 'biweekly':
          currentDue.setDate(currentDue.getDate() + 14);
          break;
        case 'monthly':
          currentDue.setMonth(currentDue.getMonth() + 1);
          break;
      }
      newTask.due_date = currentDue.toISOString();
    }

    // Create the new recurring task
    const createdTask = await this.upsertTask(newTask as Task);
    this.emit('task:automated', createdTask, rule);
  }

  /**
   * Processes dependent task rules
   */
  private async handleDependentTask(task: Task, rule: AutomationRule): Promise<void> {
    if (rule.type !== 'dependent' || !rule.config.dependsOn?.length) return;

    const dependencies = await this.getTaskDependencies(task.id);
    const complete = await this.areDependenciesComplete(task.id);

    if (complete && task.status !== 'done') {
      const updatedTask: Task = {
        ...task,
        status: 'in_progress',
        automation_rules: {
          ...rule,
          status: 'completed'
        }
      };
      await this.upsertTask(updatedTask);
      this.emit('task:dependency:resolved', updatedTask, dependencies);
    }
  }

  /**
   * Processes deadline notification rules
   */
  private async handleDeadlineTask(task: Task, rule: AutomationRule): Promise<void> {
    if (rule.type !== 'deadline' || !task.due_date) return;

    const dueDate = new Date(task.due_date);
    const now = new Date();
    const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining <= (rule.config.notifyBefore || 24)) {
      this.emit('task:deadline:approaching', task, hoursRemaining);
    }
  }

  /**
   * Queues an automation rule for processing
   */
  private queueAutomation(task: Task, rule: AutomationRule): void {
    this.automationQueue.push({ task, rule });
    this.processAutomationQueue();
  }

  /**
   * Processes the automation queue
   */
  private async processAutomationQueue(): Promise<void> {
    if (this.isProcessing || this.automationQueue.length === 0) return;

    this.isProcessing = true;
    try {
      const { task, rule } = this.automationQueue.shift()!;

      switch (rule.type) {
        case 'recurring':
          await this.handleRecurringTask(task, rule);
          break;
        case 'dependent':
          await this.handleDependentTask(task, rule);
          break;
        case 'deadline':
          await this.handleDeadlineTask(task, rule);
          break;
      }
    } finally {
      this.isProcessing = false;
      if (this.automationQueue.length > 0) {
        this.processAutomationQueue();
      }
    }
  }

  /**
   * Starts the automation processor
   */
  private startAutomationProcessor(): void {
    setInterval(() => {
      Array.from(this.tasks.values()).forEach(task => {
        if (task.automation_rules?.status === 'active') {
          this.queueAutomation(task, task.automation_rules);
        }
      });
    }, 60000); // Check every minute
  }

  /**
   * Handles task completion
   */
  private async handleTaskCompletion(task: Task): Promise<void> {
    this.emit('task:completed', task);

    // Find dependent tasks
    const dependentTasks = Array.from(this.tasks.values())
      .filter(t => t.automation_rules?.type === 'dependent' &&
                  t.automation_rules.config.dependsOn?.includes(task.id));

    // Process dependent tasks
    for (const depTask of dependentTasks) {
      if (depTask.automation_rules) {
        this.queueAutomation(depTask, depTask.automation_rules);
      }
    }
  }

  /**
   * Clears scheduled tasks
   */
  private clearTaskSchedule(taskId: string): void {
    const timeout = this.scheduleTimeouts.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduleTimeouts.delete(taskId);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.scheduleTimeouts.forEach(clearTimeout);
    this.scheduleTimeouts.clear();
    this.tasks.clear();
    this.dependencyCache.clear();
    this.automationQueue = [];
  }
}

export const taskEngine = new TaskEngine();