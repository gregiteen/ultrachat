import { BaseMCPServer, MCPConfig, MCPAction, MCPEvent } from '../../../types/mcp';
import { MCPEventBus } from '../../utils/event-bus';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed';
  user_id: string;
  created_at: string;
  updated_at: string;
  automation?: {
    type: 'recurring' | 'dependent' | 'deadline';
    config: Record<string, unknown>;
  };
}

interface TaskWorkflow {
  id: string;
  trigger: string;
  actions: Array<{
    service: 'google' | 'github' | 'slack';
    action: string;
    params: Record<string, unknown>;
  }>;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

interface TaskAutomationConfig extends MCPConfig {
  integrations: {
    google?: {
      calendarId: string;
      notificationEmail: string;
    };
    github?: {
      repository: string;
      labels: string[];
    };
    slack?: {
      channel: string;
      mentions: string[];
    };
  };
}

class TaskAutomationServer extends BaseMCPServer {
  private config: TaskAutomationConfig;
  private eventBus: MCPEventBus;

  constructor(config: TaskAutomationConfig) {
    super();
    this.config = config;
    this.eventBus = new MCPEventBus();
    this.setupEventHandlers();
  }

  capabilities = [
    'task.create',
    'task.update',
    'task.delete',
    'task.automate',
    'task.workflow',
    'task.notify'
  ];

  tools = {
    'task.create': async (params: {
      title: string;
      description?: string;
      due_date?: string;
      priority?: 'low' | 'medium' | 'high';
      automation?: {
        type: 'recurring' | 'dependent' | 'deadline';
        config: Record<string, unknown>;
      };
    }): Promise<Task> => {
      // Create task with cross-platform integrations
      const task = await this.createTask(params);
      
      // Trigger automations based on task properties
      if (params.automation) {
        await this.setupAutomation(task, params.automation);
      }

      return task;
    },

    'task.automate': async (params: {
      taskId: string;
      workflow: {
        trigger: string;
        actions: Array<{
          service: keyof TaskAutomationConfig['integrations'];
          action: string;
          params: Record<string, unknown>;
        }>;
      };
    }): Promise<TaskWorkflow> => {
      const workflow = await this.createWorkflow(params.workflow);
      await this.attachWorkflowToTask(params.taskId, workflow);
      return workflow;
    },

    'task.notify': async (params: {
      taskId: string;
      message: string;
      channels: Array<'email' | 'slack' | 'github'>;
    }): Promise<unknown[]> => {
      return this.sendNotifications(params.taskId, params.message, params.channels);
    }
  };

  private async createTask(params: Parameters<typeof this.tools['task.create']>[0]): Promise<Task> {
    // Create task in the system
    const task: Task = {
      id: Math.random().toString(36).substring(2, 9),
      ...params,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'todo',
      user_id: 'system'
    };

    // Publish task creation event
    this.eventBus.publish({
      type: 'task.created',
      source: 'task-automation',
      timestamp: new Date().toISOString(),
      data: task
    });

    return task;
  }

  private async setupAutomation(task: Task, automation: NonNullable<Parameters<typeof this.tools['task.create']>[0]['automation']>) {
    const actions: MCPAction[] = [];

    switch (automation.type) {
      case 'recurring':
        if (this.config.integrations.google) {
          // Create recurring calendar event
          actions.push({
            name: 'google.calendar.createRecurring',
            parameters: {
              calendarId: this.config.integrations.google.calendarId,
              title: task.title,
              frequency: automation.config.frequency,
              dueDate: task.due_date
            }
          });
        }
        break;

      case 'dependent':
        if (this.config.integrations.github) {
          // Create GitHub issue with dependencies
          actions.push({
            name: 'github.issues.create',
            parameters: {
              repo: this.config.integrations.github.repository,
              title: task.title,
              body: `Depends on: ${(automation.config.dependsOn as string[]).join(', ')}`,
              labels: ['dependent']
            }
          });
        }
        break;

      case 'deadline':
        if (this.config.integrations.slack) {
          // Set up deadline notifications
          actions.push({
            name: 'slack.reminder.create',
            parameters: {
              channel: this.config.integrations.slack.channel,
              text: `Deadline approaching for: ${task.title}`,
              time: `${task.due_date}`,
              mentions: this.config.integrations.slack.mentions
            }
          });
        }
        break;
    }

    // Execute all automation actions
    await Promise.all(actions.map(action => this.executeAction(action)));
  }

  private async createWorkflow(workflow: Parameters<typeof this.tools['task.automate']>[0]['workflow']): Promise<TaskWorkflow> {
    return {
      id: Math.random().toString(36).substring(2, 9),
      ...workflow,
      status: 'active',
      created_at: new Date().toISOString()
    };
  }

  private async attachWorkflowToTask(taskId: string, workflow: TaskWorkflow): Promise<void> {
    // Attach workflow triggers and actions to task
    this.eventBus.subscribe(`task.${workflow.trigger}.${taskId}`, async (event: MCPEvent) => {
      for (const action of workflow.actions) {
        await this.executeAction({
          name: `${action.service}.${action.action}`,
          parameters: {
            ...action.params,
            taskId,
            event
          }
        });
      }
    });
  }

  private async sendNotifications(taskId: string, message: string, channels: Array<'email' | 'slack' | 'github'>): Promise<unknown[]> {
    const notifications = channels.map(channel => {
      switch (channel) {
        case 'email':
          if (!this.config.integrations.google?.notificationEmail) return null;
          return this.executeAction({
            name: 'google.gmail.send',
            parameters: {
              to: this.config.integrations.google.notificationEmail,
              subject: `Task Update: ${taskId}`,
              body: message
            }
          });

        case 'slack':
          if (!this.config.integrations.slack?.channel) return null;
          return this.executeAction({
            name: 'slack.message.send',
            parameters: {
              channel: this.config.integrations.slack.channel,
              text: message,
              mentions: this.config.integrations.slack.mentions
            }
          });

        case 'github':
          if (!this.config.integrations.github?.repository) return null;
          return this.executeAction({
            name: 'github.issues.comment',
            parameters: {
              repo: this.config.integrations.github.repository,
              issueId: taskId,
              body: message
            }
          });

        default:
          return null;
      }
    });

    return Promise.all(notifications.filter((n): n is Promise<unknown> => n !== null));
  }

  private setupEventHandlers(): void {
    // Handle task completion
    this.eventBus.subscribe('task.completed.*', async (event: MCPEvent) => {
      const task = event.data as Task;
      
      // Update calendar
      if (this.config.integrations.google) {
        await this.executeAction({
          name: 'google.calendar.updateEvent',
          parameters: {
            calendarId: this.config.integrations.google.calendarId,
            eventId: task.id,
            status: 'completed'
          }
        });
      }

      // Update GitHub issue
      if (this.config.integrations.github) {
        await this.executeAction({
          name: 'github.issues.update',
          parameters: {
            repo: this.config.integrations.github.repository,
            issueId: task.id,
            state: 'closed'
          }
        });
      }

      // Send Slack notification
      if (this.config.integrations.slack) {
        await this.executeAction({
          name: 'slack.message.send',
          parameters: {
            channel: this.config.integrations.slack.channel,
            text: `✅ Task completed: ${task.title}`,
            mentions: this.config.integrations.slack.mentions
          }
        });
      }
    });

    // Handle deadline approaching
    this.eventBus.subscribe('task.deadline.approaching.*', async (event: MCPEvent) => {
      const { task, hoursRemaining } = event.data as { task: Task; hoursRemaining: number };
      
      // Send notifications through all configured channels
      await this.sendNotifications(
        task.id,
        `⚠️ Deadline approaching in ${hoursRemaining} hours for: ${task.title}`,
        ['email', 'slack', 'github']
      );
    });
  }

  private async executeAction(action: MCPAction): Promise<unknown> {
    // Implementation would depend on your action execution system
    console.log('Executing action:', action);
    return action;
  }

  async destroy(): Promise<void> {
    this.eventBus.destroy();
  }
}

export const createTaskAutomationServer = (config: TaskAutomationConfig): TaskAutomationServer => {
  return new TaskAutomationServer(config);
};