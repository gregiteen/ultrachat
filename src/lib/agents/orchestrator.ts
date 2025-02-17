import { CalendarExecutor } from './executors/calendar';
import { GmailExecutor } from './executors/gmail';
import { TaskExecutor } from './executors/task';
import type { Task, AutomationRule, AutomationRuleInput, TaskNotification } from '../../types';
import { 
  validateDueDate, 
  createAutomationRule, 
  getTaskDueDate, 
  assertDueDate,
  createFailedAutomationRule 
} from './task-utils';

interface SchedulingResult {
  success: boolean;
  scheduledTime?: string;
  conflicts?: Array<{
    start: string;
    end: string;
    title: string;
  }>;
  error?: string;
}

export class TaskOrchestrator {
  private taskExecutor: TaskExecutor;
  private calendarExecutor: CalendarExecutor;
  private gmailExecutor: GmailExecutor;
  private notifications: Map<string, TaskNotification[]>;
  private automationRules: Map<string, AutomationRule>;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor(
    taskExecutor: TaskExecutor,
    calendarExecutor: CalendarExecutor,
    gmailExecutor: GmailExecutor
  ) {
    this.taskExecutor = taskExecutor;
    this.calendarExecutor = calendarExecutor;
    this.gmailExecutor = gmailExecutor;
    this.notifications = new Map();
    this.automationRules = new Map();
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < this.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
        }
      }
    }
    throw lastError;
  }

  async scheduleTask(task: Task): Promise<SchedulingResult> {
    try {
      if (!validateDueDate(task.due_date)) {
        return { success: true };
      }

      const dueDate = assertDueDate(task.due_date);

      // Check calendar conflicts with retry
      const conflicts = await this.withRetry(() => 
        this.calendarExecutor.findConflicts(
          dueDate,
          new Date(new Date(dueDate).getTime() + 60 * 60 * 1000).toISOString()
        )
      );

      if (conflicts.length > 0) {
        // Find next available slot
        const nextSlot = await this.findNextAvailableSlot(task);
        if (!nextSlot) {
          return {
            success: false,
            conflicts: conflicts.map(c => ({
              start: c.start.dateTime,
              end: c.end.dateTime,
              title: c.summary
            })),
            error: 'No available time slots found in the next week'
          };
        }

        // Update task with new time
        const newDueDate = nextSlot.toISOString();
        await this.withRetry(() =>
          this.taskExecutor.updateTask(task.id, {
            due_date: newDueDate
          })
        );
        task.due_date = newDueDate;
      }

      // Create calendar event with retry
      await this.withRetry(() =>
        this.calendarExecutor.createEvent({
          summary: task.title,
          description: task.description,
          start: { dateTime: assertDueDate(task.due_date) },
          end: { 
            dateTime: new Date(new Date(assertDueDate(task.due_date)).getTime() + 60 * 60 * 1000).toISOString()
          }
        })
      );

      // Set up notifications
      await this.setupNotifications(task);

      return {
        success: true,
        scheduledTime: task.due_date
      };
    } catch (error) {
      console.error('Error scheduling task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async findNextAvailableSlot(task: Task): Promise<Date | null> {
    const dueDate = getTaskDueDate(task);
    if (!dueDate) return null;

    const startDate = new Date(dueDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // Look up to a week ahead

    const workingHours = {
      start: 9, // 9 AM
      end: 17   // 5 PM
    };

    while (startDate < endDate) {
      // Skip to next day if outside working hours
      const hour = startDate.getHours();
      if (hour < workingHours.start || hour >= workingHours.end) {
        startDate.setHours(workingHours.start, 0, 0, 0);
        if (hour >= workingHours.end) {
          startDate.setDate(startDate.getDate() + 1);
        }
        continue;
      }

      try {
        const conflicts = await this.withRetry(() =>
          this.calendarExecutor.findConflicts(
            startDate.toISOString(),
            new Date(startDate.getTime() + 60 * 60 * 1000).toISOString()
          )
        );

        if (conflicts.length === 0) {
          return startDate;
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }

      startDate.setHours(startDate.getHours() + 1);
    }

    return null;
  }

  async setupNotifications(task: Task): Promise<void> {
    const notifications: TaskNotification[] = [];
    const dueDate = getTaskDueDate(task);

    if (dueDate) {
      // Add notifications based on task priority
      const notificationSchedule = this.getNotificationSchedule(task.priority);
      for (const hours of notificationSchedule) {
        notifications.push({
          type: 'email',
          task,
          scheduledFor: new Date(dueDate.getTime() - hours * 60 * 60 * 1000),
          message: this.generateNotificationMessage(task, hours),
          sent: false
        });
      }
    }

    this.notifications.set(task.id, notifications);
    await this.processNotifications(task.id);
  }

  private getNotificationSchedule(priority: Task['priority']): number[] {
    switch (priority) {
      case 'high':
        return [48, 24, 12, 4, 1]; // 2 days, 1 day, 12 hours, 4 hours, 1 hour
      case 'medium':
        return [24, 4, 1]; // 1 day, 4 hours, 1 hour
      case 'low':
        return [24, 1]; // 1 day, 1 hour
      default:
        return [24, 1];
    }
  }

  private generateNotificationMessage(task: Task, hoursBeforeDeadline: number): string {
    const dueDate = getTaskDueDate(task);
    if (!dueDate) return '';

    const timeString = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = dueDate.toLocaleDateString();

    if (hoursBeforeDeadline >= 24) {
      const days = Math.floor(hoursBeforeDeadline / 24);
      return `Reminder: Task "${task.title}" is due in ${days} day${days > 1 ? 's' : ''} (${dateString} at ${timeString})`;
    } else if (hoursBeforeDeadline > 1) {
      return `Reminder: Task "${task.title}" is due in ${hoursBeforeDeadline} hours (${timeString} today)`;
    } else {
      return `Urgent: Task "${task.title}" is due in 1 hour (${timeString} today)`;
    }
  }

  private async processNotifications(taskId: string): Promise<void> {
    const notifications = this.notifications.get(taskId);
    if (!notifications) return;

    for (const notification of notifications) {
      if (notification.type === 'email' && !notification.sent) {
        try {
          await this.withRetry(() =>
            this.gmailExecutor.sendMessage({
              to: [notification.task.user_id],
              subject: `Task Reminder: ${notification.task.title}`,
              body: notification.message
            })
          );
          notification.sent = true;
        } catch (error) {
          console.error('Failed to send notification:', error);
          // Will be retried during cleanup
        }
      }
    }
  }

  async setupAutomation(task: Task, ruleInput: AutomationRuleInput): Promise<void> {
    const automationRule = createAutomationRule(ruleInput);
    this.automationRules.set(task.id, automationRule);

    try {
      if (ruleInput.type === 'recurring' && ruleInput.config.frequency) {
        await this.handleRecurringTask(task, ruleInput.config.frequency);
      } else if (ruleInput.type === 'dependent' && ruleInput.config.dependsOn) {
        await this.handleDependentTask(task, ruleInput.config.dependsOn);
      }
    } catch (error) {
      console.error('Error setting up automation:', error);
      // Store failed automation for retry
      const failedRule = createFailedAutomationRule(
        ruleInput,
        error instanceof Error ? error.message : 'Unknown error'
      );
      await this.taskExecutor.updateTask(task.id, {
        automation_rules: failedRule
      });
    }
  }

  private async handleRecurringTask(task: Task, frequency: string): Promise<void> {
    const interval = this.parseFrequency(frequency);
    if (!interval) {
      throw new Error(`Invalid frequency: ${frequency}`);
    }

    const dueDate = getTaskDueDate(task);
    if (!dueDate) {
      throw new Error('Task has no valid due date');
    }

    // Create next occurrence
    const nextDate = new Date(dueDate);
    nextDate.setDate(nextDate.getDate() + interval);

    // Validate next occurrence
    const schedulingResult = await this.scheduleTask({
      ...task,
      id: '', // New task
      due_date: nextDate.toISOString(),
      status: 'todo'
    });

    if (!schedulingResult.success) {
      throw new Error(`Failed to schedule recurring task: ${schedulingResult.error}`);
    }
  }

  private parseFrequency(frequency: string): number | null {
    switch (frequency.toLowerCase()) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'biweekly': return 14;
      case 'monthly': return 30;
      default: return null;
    }
  }

  private async handleDependentTask(task: Task, dependsOn: string[]): Promise<void> {
    // Monitor dependent tasks
    for (const dependentTaskId of dependsOn) {
      const dependentTask = await this.withRetry(() =>
        this.taskExecutor.getTaskById(dependentTaskId)
      );
      
      if (!dependentTask) {
        throw new Error(`Dependent task ${dependentTaskId} not found`);
      }

      // If all dependencies are complete, update task status
      if (dependentTask.status === 'done') {
        const allDependencies = await Promise.all(
          dependsOn.map(id => this.withRetry(() =>
            this.taskExecutor.getTaskById(id)
          ))
        );

        if (allDependencies.every(t => t?.status === 'done')) {
          await this.withRetry(() =>
            this.taskExecutor.updateTaskStatus(task.id, 'in_progress')
          );
          
          // Send notification
          await this.withRetry(() =>
            this.gmailExecutor.sendMessage({
              to: [task.user_id],
              subject: 'Task Dependencies Completed',
              body: `All dependencies for task "${task.title}" are completed. You can now start working on this task.`
            })
          );
        }
      }
    }
  }

  async checkOverdueTasks(): Promise<void> {
    try {
      const tasks = await this.withRetry(() =>
        this.taskExecutor.listTasks({ status: 'todo' })
      );
      
      const now = new Date();

      for (const task of tasks) {
        const dueDate = getTaskDueDate(task);
        if (dueDate && dueDate < now) {
          // Send overdue notification
          await this.withRetry(() =>
            this.gmailExecutor.sendMessage({
              to: [task.user_id],
              subject: 'Task Overdue',
              body: `Task "${task.title}" is overdue. Original due date: ${dueDate.toLocaleString()}`
            })
          );

          // Suggest rescheduling
          const nextSlot = await this.findNextAvailableSlot(task);
          if (nextSlot) {
            await this.withRetry(() =>
              this.gmailExecutor.sendMessage({
                to: [task.user_id],
                subject: 'Suggested Reschedule',
                body: `Would you like to reschedule overdue task "${task.title}" to ${nextSlot.toLocaleString()}?`
              })
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
      // Will be retried during next cleanup
    }
  }

  // Cleanup method to handle any failed operations
  async cleanup(): Promise<void> {
    try {
      const tasks = await this.withRetry(() =>
        this.taskExecutor.listTasks()
      );

      for (const task of tasks) {
        // Retry failed automations
        if (task.automation_rules?.status === 'failed') {
          const { status, error, ...ruleInput } = task.automation_rules;
          await this.setupAutomation(task, ruleInput);
        }

        // Check for missed notifications
        const notifications = this.notifications.get(task.id);
        if (notifications) {
          const pendingNotifications = notifications.filter(n => 
            n.scheduledFor <= new Date() && !n.sent
          );
          
          if (pendingNotifications.length > 0) {
            await this.processNotifications(task.id);
          }
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}