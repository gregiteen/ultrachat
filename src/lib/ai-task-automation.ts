import { aiPersonalization } from './ai-personalization';
import { use_mcp_tool } from './mcp';
import type { Task, PersonalInfo } from '../types';
import type { PersonalizationDocument } from '../types/personalization';

/**
 * AI-driven task automation service that integrates with the chat interface
 * and personalizes automation based on user context
 */
export class AITaskAutomation {
  private static instance: AITaskAutomation;
  
  private constructor() {}

  public static getInstance(): AITaskAutomation {
    if (!AITaskAutomation.instance) {
      AITaskAutomation.instance = new AITaskAutomation();
    }
    return AITaskAutomation.instance;
  }

  /**
   * Process natural language task requests and create automated workflows
   */
  public async processTaskRequest(
    input: string,
    personalInfo: PersonalInfo,
    personalizationDoc: PersonalizationDocument
  ) {
    const prompt = `As an AI assistant, analyze this task request and create appropriate automations.
    User's request: "${input}"

    User's Profile:
    ${JSON.stringify(personalInfo, null, 2)}

    Personalization Context:
    ${JSON.stringify(personalizationDoc, null, 2)}

    Consider:
    1. User's communication preferences
    2. Work style and preferences
    3. Existing tools and integrations
    4. Task complexity and dependencies
    5. Notification preferences
    6. Collaboration needs

    Return ONLY a JSON object with this structure:
    {
      "task": {
        "title": string,
        "description": string,
        "priority": "low" | "medium" | "high",
        "estimated_duration": string (in hours),
        "due_date": string (ISO date) or null,
        "automation": {
          "type": "recurring" | "dependent" | "deadline",
          "config": object with automation settings
        }
      },
      "integrations": {
        "calendar": boolean,
        "github": boolean,
        "slack": boolean
      },
      "notifications": {
        "channels": string[],
        "frequency": "high" | "medium" | "low"
      },
      "workflow": {
        "steps": string[],
        "dependencies": string[],
        "reminders": number[] (hours before deadline)
      }
    }`;

    try {
      const taskConfig = await use_mcp_tool({
        server_name: 'gemini',
        tool_name: 'generate',
        arguments: { prompt }
      });

      // Create the task with automations
      const task = await use_mcp_tool({
        server_name: 'task-automation',
        tool_name: 'task.create',
        arguments: taskConfig.task
      });

      // Set up integrations based on user's preferences
      if (taskConfig.integrations.calendar && personalizationDoc.preferences.workStyle === 'structured') {
        await this.setupCalendarIntegration(task, taskConfig);
      }

      if (taskConfig.integrations.github && personalizationDoc.expertise.includes('development')) {
        await this.setupGitHubIntegration(task, taskConfig);
      }

      if (taskConfig.integrations.slack && personalizationDoc.preferences.communication === 'collaborative') {
        await this.setupSlackIntegration(task, taskConfig);
      }

      // Configure notifications based on communication preferences
      await this.setupNotifications(task, taskConfig, personalizationDoc);

      return {
        success: true,
        task,
        message: this.generateResponseMessage(task, personalizationDoc)
      };
    } catch (error) {
      console.error('Error processing task request:', error);
      return {
        success: false,
        message: "I couldn't process that task request. Could you provide more details or try rephrasing it?"
      };
    }
  }

  /**
   * Generate a personalized response about the created task
   */
  private generateResponseMessage(task: Task, personalizationDoc: PersonalizationDocument): string {
    const style = personalizationDoc.communication_style;
    const tone = style.tone === 'professional' ? 'I have' : "I've";
    const detail = style.detail_level === 'high' ? 'with all the automations you typically prefer' : 'with the basic automations';

    return `${tone} created the task "${task.title}" ${detail}. ` +
           `${this.getIntegrationsMessage(task, personalizationDoc)}`;
  }

  /**
   * Set up calendar integration with personalized settings
   */
  private async setupCalendarIntegration(task: Task, config: any) {
    return use_mcp_tool({
      server_name: 'task-automation',
      tool_name: 'task.automate',
      arguments: {
        taskId: task.id,
        workflow: {
          trigger: 'task.created',
          actions: [{
            service: 'google',
            action: 'calendar.create',
            params: {
              title: task.title,
              description: task.description,
              dueDate: task.due_date,
              reminders: config.workflow.reminders
            }
          }]
        }
      }
    });
  }

  /**
   * Set up GitHub integration with personalized settings
   */
  private async setupGitHubIntegration(task: Task, config: any) {
    return use_mcp_tool({
      server_name: 'task-automation',
      tool_name: 'task.automate',
      arguments: {
        taskId: task.id,
        workflow: {
          trigger: 'task.updated',
          actions: [{
            service: 'github',
            action: 'issues.sync',
            params: {
              title: task.title,
              body: task.description,
              labels: ['automated', `priority-${task.priority}`],
              assignees: [task.user_id]
            }
          }]
        }
      }
    });
  }

  /**
   * Set up Slack integration with personalized settings
   */
  private async setupSlackIntegration(task: Task, config: any) {
    return use_mcp_tool({
      server_name: 'task-automation',
      tool_name: 'task.automate',
      arguments: {
        taskId: task.id,
        workflow: {
          trigger: 'task.status_changed',
          actions: [{
            service: 'slack',
            action: 'message.send',
            params: {
              text: `Task Update: ${task.title}`,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*${task.title}*\n${task.description}`
                  }
                },
                {
                  type: 'context',
                  elements: [
                    {
                      type: 'mrkdwn',
                      text: `Priority: ${task.priority} | Due: ${task.due_date}`
                    }
                  ]
                }
              ]
            }
          }]
        }
      }
    });
  }

  /**
   * Set up notifications based on user preferences
   */
  private async setupNotifications(task: Task, config: any, personalizationDoc: PersonalizationDocument) {
    const channels = config.notifications.channels.filter(channel => {
      // Only use channels that match user's preferences
      if (channel === 'email' && personalizationDoc.preferences.communication === 'formal') return true;
      if (channel === 'slack' && personalizationDoc.preferences.communication === 'collaborative') return true;
      if (channel === 'github' && personalizationDoc.expertise.includes('development')) return true;
      return false;
    });

    return use_mcp_tool({
      server_name: 'task-automation',
      tool_name: 'task.notify',
      arguments: {
        taskId: task.id,
        channels,
        frequency: config.notifications.frequency
      }
    });
  }

  /**
   * Generate a message about the integrations that were set up
   */
  private getIntegrationsMessage(task: Task, personalizationDoc: PersonalizationDocument): string {
    const integrations = [];
    
    if (task.automation_rules?.type === 'recurring') {
      integrations.push("I've set up recurring calendar events");
    }
    
    if (personalizationDoc.expertise.includes('development')) {
      integrations.push("synchronized it with GitHub");
    }
    
    if (personalizationDoc.preferences.communication === 'collaborative') {
      integrations.push("configured Slack notifications");
    }

    if (integrations.length === 0) {
      return "Let me know if you'd like me to set up any additional automations.";
    }

    return `I've ${integrations.join(', ')} based on your preferences. ` +
           "Would you like me to adjust any of these automations?";
  }
}

export const aiTaskAutomation = AITaskAutomation.getInstance();