import { aiTaskAutomation } from './ai-task-automation';
import type { AIResponse, PersonalizationDocument } from '../types/personalization';
import type { PersonalInfo } from '../types';

/**
 * Handles task-related intents in the AI chat system
 */
export class AITaskIntentHandler {
  /**
   * Process task-related messages and generate appropriate responses
   */
  static async handleTaskIntent(
    input: string,
    personalInfo: PersonalInfo,
    personalizationDoc: PersonalizationDocument,
    intent: AIResponse['intent']
  ): Promise<AIResponse> {
    // Task creation intent
    if (input.toLowerCase().includes('create') || input.toLowerCase().includes('new task')) {
      return this.handleTaskCreation(input, personalInfo, personalizationDoc);
    }

    // Task automation intent
    if (input.toLowerCase().includes('automate') || input.toLowerCase().includes('workflow')) {
      return this.handleTaskAutomation(input, personalInfo, personalizationDoc);
    }

    // Task query intent
    if (input.toLowerCase().includes('show') || input.toLowerCase().includes('list')) {
      return this.handleTaskQuery(input, personalizationDoc);
    }

    // Default task-related response
    return this.generateTaskSuggestions(personalizationDoc);
  }

  /**
   * Handle task creation requests
   */
  private static async handleTaskCreation(
    input: string,
    personalInfo: PersonalInfo,
    personalizationDoc: PersonalizationDocument
  ): Promise<AIResponse> {
    const result = await aiTaskAutomation.processTaskRequest(
      input,
      personalInfo,
      personalizationDoc
    );

    if (!result.success) {
      return {
        message: result.message,
        type: 'error',
        intent: {
          category: 'preferences',
          action: 'clarify',
          confidence: 0.8,
          field: 'task_details'
        },
        suggestions: [
          "Let me try explaining what I want to do...",
          "Could you help me create a simpler task?",
          "What information do you need from me?"
        ],
        extractedInfo: {}
      };
    }

    // Generate response based on user's communication preferences
    const style = personalizationDoc.communication_style;
    const isDetailedResponse = style.detail_level === 'high';
    const isFormalTone = style.formality === 'formal';

    const message = isFormalTone
      ? `I've created the task "${result.task.title}" with the following automations:`
      : `Great! I've set up "${result.task.title}" for you with some helpful automations:`;

    const details = isDetailedResponse
      ? this.generateDetailedTaskResponse(result.task, personalizationDoc)
      : this.generateSimpleTaskResponse(result.task, personalizationDoc);

    return {
      message: `${message}\n${details}`,
      type: 'confirmation',
      intent: {
        category: 'preferences',
        action: 'confirm',
        confidence: 1,
        field: 'task_automation'
      },
      suggestions: [
        "Can you adjust the automation settings?",
        "Show me what other tasks I have",
        "Create another similar task"
      ],
      extractedInfo: {
        task_id: result.task.id,
        automation_type: result.task.automation?.type
      }
    };
  }

  /**
   * Handle task automation requests
   */
  private static async handleTaskAutomation(
    input: string,
    personalInfo: PersonalInfo,
    personalizationDoc: PersonalizationDocument
  ): Promise<AIResponse> {
    const workStyle = personalizationDoc.preferences.workStyle;
    const expertise = personalizationDoc.expertise;

    let suggestedAutomations = [];

    if (workStyle === 'structured') {
      suggestedAutomations.push('calendar integration with reminders');
    }
    if (expertise.includes('development')) {
      suggestedAutomations.push('GitHub issue tracking');
    }
    if (personalizationDoc.preferences.communication === 'collaborative') {
      suggestedAutomations.push('Slack notifications');
    }

    return {
      message: `Based on your work style and preferences, I can help automate your tasks with ${
        suggestedAutomations.join(', ')
      }. Would you like me to set these up for you?`,
      type: 'suggestion',
      intent: {
        category: 'preferences',
        action: 'suggest',
        confidence: 0.9,
        field: 'task_automation'
      },
      suggestions: [
        "Yes, set up all the automations",
        "Show me more automation options",
        "Let's customize the automation settings"
      ],
      extractedInfo: {
        suggested_automations: suggestedAutomations
      }
    };
  }

  /**
   * Handle task query requests
   */
  private static async handleTaskQuery(
    input: string,
    personalizationDoc: PersonalizationDocument
  ): Promise<AIResponse> {
    const detailLevel = personalizationDoc.communication_style.detail_level;
    const tone = personalizationDoc.communication_style.tone;

    return {
      message: "I'll help you find your tasks. Would you like to see them organized by deadline, priority, or project?",
      type: 'question',
      intent: {
        category: 'preferences',
        action: 'clarify',
        confidence: 0.9,
        field: 'task_organization'
      },
      suggestions: [
        "Show tasks by deadline",
        "Show high priority tasks",
        "Show tasks by project"
      ],
      extractedInfo: {
        query_type: 'task_list',
        detail_level: detailLevel,
        tone
      }
    };
  }

  /**
   * Generate general task suggestions
   */
  private static generateTaskSuggestions(
    personalizationDoc: PersonalizationDocument
  ): Promise<AIResponse> {
    const workStyle = personalizationDoc.preferences.workStyle;
    const expertise = personalizationDoc.expertise;

    let suggestions = [];

    if (workStyle === 'structured') {
      suggestions.push("Create a scheduled task with reminders");
    }
    if (expertise.includes('development')) {
      suggestions.push("Set up a coding task with GitHub integration");
    }
    if (personalizationDoc.preferences.communication === 'collaborative') {
      suggestions.push("Create a team task with Slack updates");
    }

    return Promise.resolve({
      message: "I can help you manage your tasks more effectively. What would you like to do?",
      type: 'suggestion',
      intent: {
        category: 'preferences',
        action: 'suggest',
        confidence: 0.8,
        field: 'task_management'
      },
      suggestions,
      extractedInfo: {}
    });
  }

  /**
   * Generate a detailed task response
   */
  private static generateDetailedTaskResponse(task: any, personalizationDoc: PersonalizationDocument): string {
    const parts = [
      `• Priority: ${task.priority}`,
      `• Due date: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}`,
      `• Estimated duration: ${task.estimated_duration || 'Not set'} hours`,
    ];

    if (task.automation) {
      parts.push(`• Automation: ${this.formatAutomationType(task.automation.type)}`);
      
      if (personalizationDoc.integrations?.calendar?.auto_schedule) {
        parts.push(`• Calendar: Event created with ${personalizationDoc.integrations.calendar.reminder_times.length} reminders`);
      }
      
      if (personalizationDoc.integrations?.github?.auto_assign) {
        parts.push(`• GitHub: Issue created with ${personalizationDoc.integrations.github.preferred_labels.join(', ')} labels`);
      }
      
      if (personalizationDoc.integrations?.slack?.use_threads) {
        parts.push(`• Slack: Notifications set up in ${personalizationDoc.integrations.slack.preferred_channels[0]}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Generate a simple task response
   */
  private static generateSimpleTaskResponse(task: any, personalizationDoc: PersonalizationDocument): string {
    const automations = [];
    
    if (task.automation) {
      if (personalizationDoc.integrations?.calendar?.auto_schedule) {
        automations.push('calendar events');
      }
      if (personalizationDoc.integrations?.github?.auto_assign) {
        automations.push('GitHub tracking');
      }
      if (personalizationDoc.integrations?.slack?.use_threads) {
        automations.push('Slack updates');
      }
    }

    return automations.length > 0
      ? `I've set up ${automations.join(' and ')} for you.`
      : 'The task has been created successfully.';
  }

  /**
   * Format automation type for display
   */
  private static formatAutomationType(type: string): string {
    switch (type) {
      case 'recurring':
        return 'Recurring schedule';
      case 'dependent':
        return 'Task dependencies';
      case 'deadline':
        return 'Deadline reminders';
      default:
        return type;
    }
  }
}