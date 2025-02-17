import type { MCPWorkflow } from '../../../types/mcp';

/**
 * Predefined workflows for common task automation scenarios
 */
export const taskWorkflows = {
  // GitHub Issue to Slack Notification
  githubToSlack: (taskId: string): MCPWorkflow => ({
    steps: [
      {
        name: 'github.issues.subscribe',
        parameters: {
          taskId,
          events: ['created', 'updated', 'commented']
        }
      },
      {
        name: 'slack.message.send',
        parameters: {
          channel: process.env.SLACK_CHANNEL,
          template: 'github-update'
        }
      }
    ],
    conditions: {
      'github.authenticated': true,
      'slack.authenticated': true
    }
  }),

  // Calendar Event with Email Reminders
  calendarWithReminders: (taskId: string, reminderHours: number[]): MCPWorkflow => ({
    steps: [
      {
        name: 'google.calendar.create',
        parameters: {
          taskId,
          reminders: reminderHours.map(hours => ({
            method: 'email',
            minutes: hours * 60
          }))
        }
      },
      {
        name: 'google.gmail.createDraft',
        parameters: {
          template: 'task-reminder',
          taskId
        }
      }
    ],
    conditions: {
      'google.authenticated': true,
      'task.hasDeadline': true
    }
  }),

  // Task Dependencies with GitHub Projects
  githubProjectDependencies: (taskId: string, dependencies: string[]): MCPWorkflow => ({
    steps: [
      {
        name: 'github.project.addCard',
        parameters: {
          taskId,
          dependencies
        }
      },
      {
        name: 'github.issues.addLabels',
        parameters: {
          taskId,
          labels: ['has-dependencies']
        }
      },
      {
        name: 'github.issues.createComment',
        parameters: {
          taskId,
          body: `This task depends on: ${dependencies.join(', ')}`
        }
      }
    ],
    conditions: {
      'github.authenticated': true,
      'github.projectExists': true
    }
  }),

  // Recurring Task with Multi-Channel Notifications
  recurringTaskNotifications: (taskId: string, frequency: string): MCPWorkflow => ({
    steps: [
      {
        name: 'task.schedule',
        parameters: {
          taskId,
          frequency
        }
      },
      {
        name: 'slack.reminder.create',
        parameters: {
          taskId,
          frequency
        }
      },
      {
        name: 'google.calendar.createRecurring',
        parameters: {
          taskId,
          frequency
        }
      }
    ],
    conditions: {
      'slack.authenticated': true,
      'google.authenticated': true
    }
  }),

  // Task Status Updates Across Platforms
  crossPlatformStatusSync: (taskId: string): MCPWorkflow => ({
    steps: [
      {
        name: 'github.issues.update',
        parameters: {
          taskId,
          syncStatus: true
        }
      },
      {
        name: 'slack.message.update',
        parameters: {
          taskId,
          syncStatus: true
        }
      },
      {
        name: 'google.calendar.updateEvent',
        parameters: {
          taskId,
          syncStatus: true
        }
      }
    ],
    conditions: {
      'github.authenticated': true,
      'slack.authenticated': true,
      'google.authenticated': true
    }
  }),

  // Task Completion Celebration
  taskCompletionCelebration: (taskId: string): MCPWorkflow => ({
    steps: [
      {
        name: 'slack.message.send',
        parameters: {
          taskId,
          template: 'completion-celebration',
          reactions: ['tada', 'rocket', 'party_parrot']
        }
      },
      {
        name: 'github.issues.close',
        parameters: {
          taskId,
          comment: '🎉 Task completed!'
        }
      },
      {
        name: 'google.calendar.updateEvent',
        parameters: {
          taskId,
          status: 'completed',
          color: 'green'
        }
      }
    ],
    conditions: {
      'task.isComplete': true
    },
    onSuccess: (result) => {
      console.log('Task completion celebration successful:', result);
    }
  })
};

/**
 * Helper function to combine multiple workflows
 */
export function combineWorkflows(...workflows: MCPWorkflow[]): MCPWorkflow {
  return {
    steps: workflows.flatMap(w => w.steps),
    conditions: workflows.reduce((acc, w) => ({ ...acc, ...w.conditions }), {}),
    onSuccess: (result) => {
      workflows.forEach(w => w.onSuccess?.(result));
    },
    onError: (error) => {
      workflows.forEach(w => w.onError?.(error));
    }
  };
}

/**
 * Create a custom workflow
 */
export function createCustomWorkflow(
  steps: MCPWorkflow['steps'],
  conditions: MCPWorkflow['conditions'] = {},
  handlers?: {
    onSuccess?: MCPWorkflow['onSuccess'];
    onError?: MCPWorkflow['onError'];
  }
): MCPWorkflow {
  return {
    steps,
    conditions,
    ...handlers
  };
}