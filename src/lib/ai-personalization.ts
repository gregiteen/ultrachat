import { use_mcp_tool } from './mcp';
import type { PersonalizationDocument, PersonalInfo } from '../types/personalization';

interface UserPreferences {
  communication: 'formal' | 'casual' | 'direct' | 'detailed' | 'collaborative';
  learning: 'visual' | 'hands-on' | 'theoretical' | 'mixed';
  workStyle: 'independent' | 'collaborative' | 'structured' | 'flexible';
  storage: 'local' | 'google_drive' | 'none';
}

interface CommunicationStyle {
  tone: 'professional' | 'friendly' | 'technical' | 'conversational';
  formality: 'formal' | 'semi-formal' | 'casual';
  detail_level: 'high' | 'medium' | 'low';
}

interface ChatResponse {
  message: string;
  extractedInfo?: Partial<PersonalInfo>;
  currentStep?: number;
  error?: string | null;
}

/**
 * AI-driven personalization service
 */
export class AIPersonalization {
  private static instance: AIPersonalization;
  
  private constructor() {}

  public static getInstance(): AIPersonalization {
    if (!AIPersonalization.instance) {
      AIPersonalization.instance = new AIPersonalization();
    }
    return AIPersonalization.instance;
  }

  /**
   * Generate a chat response based on user input
   */
  public async generateChatResponse(
    content: string,
    context: any,
    state: {
      currentStep: number;
      messages: Array<{ role: string; content: string }>;
      extractedInfo: PersonalInfo;
      isProcessing: boolean;
      error: string | null;
    }
  ): Promise<ChatResponse> {
    const response = await use_mcp_tool<ChatResponse>({
      server_name: 'gemini',
      tool_name: 'chat.generate',
      arguments: {
        content,
        context,
        state
      }
    });
    return response;
  }

  /**
   * Initialize personalization for a new user
   */
  public async initializePersonalization(
    initialMessages: Array<{ role: string; content: string }>,
    existingPreferences?: Partial<UserPreferences>
  ): Promise<PersonalizationDocument> {
    // Analyze initial messages to understand user's style
    const preferences = await this.analyzeUserPreferences(initialMessages, existingPreferences);
    const communicationStyle = await this.analyzeCommunicationStyle(initialMessages);
    
    // Create initial personalization document
    return {
      preferences,
      communication_style: communicationStyle,
      interests: [],
      goals: [],
      expertise: [],
      task_preferences: {
        notification_channels: ['email'],
        reminder_frequency: 'medium',
        preferred_tools: [],
        automation_level: 'medium',
        collaboration_style: 'mixed'
      }
    };
  }

  /**
   * Update personalization based on new interactions
   */
  public async updatePersonalization(
    doc: PersonalizationDocument,
    newMessages: Array<{ role: string; content: string }>,
    updates?: Partial<PersonalizationDocument>
  ): Promise<PersonalizationDocument> {
    // Analyze new messages
    const newPreferences = await this.analyzeUserPreferences(newMessages, doc.preferences);
    const newCommunicationStyle = await this.analyzeCommunicationStyle(newMessages);
    
    // Extract interests and expertise
    const { interests, expertise } = await this.extractTopics(newMessages);

    // Merge with existing document
    return {
      ...doc,
      ...updates,
      preferences: {
        ...doc.preferences,
        ...newPreferences
      },
      communication_style: {
        ...doc.communication_style,
        ...newCommunicationStyle
      },
      interests: [...new Set([...doc.interests, ...interests])],
      expertise: [...new Set([...doc.expertise, ...expertise])]
    };
  }

  /**
   * Analyze messages to determine user preferences
   */
  private async analyzeUserPreferences(
    messages: Array<{ role: string; content: string }>,
    existingPreferences?: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const defaultPreferences = {
      communication: 'casual' as const,
      learning: 'mixed' as const,
      workStyle: 'flexible' as const,
      storage: 'local' as const
    };

    // Analyze user's communication patterns
    const { communicationStyle, learningStyle, workStyle } = await this.analyzeInteractionPatterns(messages);
    
    return {
      communication: communicationStyle || existingPreferences?.communication || defaultPreferences.communication,
      learning: learningStyle || existingPreferences?.learning || defaultPreferences.learning,
      workStyle: workStyle || existingPreferences?.workStyle || defaultPreferences.workStyle,
      storage: existingPreferences?.storage || defaultPreferences.storage
    };
  }

  /**
   * Analyze messages to determine communication style
   */
  private async analyzeCommunicationStyle(
    messages: Array<{ role: string; content: string }>
  ): Promise<CommunicationStyle> {
    const userMessages = messages.filter(m => m.role === 'user');
    const combinedContent = userMessages.map(m => m.content).join('\n');

    const analysis = await use_mcp_tool<{
      tone: CommunicationStyle['tone'];
      formality: CommunicationStyle['formality'];
      detail_level: CommunicationStyle['detail_level'];
    }>({
      server_name: 'gemini',
      tool_name: 'analyze.style',
      arguments: {
        text: combinedContent,
        aspects: ['tone', 'formality', 'detail_level']
      }
    });

    return {
      tone: analysis.tone,
      formality: analysis.formality,
      detail_level: analysis.detail_level
    };
  }

  /**
   * Analyze interaction patterns
   */
  private async analyzeInteractionPatterns(
    messages: Array<{ role: string; content: string }>
  ) {
    const userMessages = messages.filter(m => m.role === 'user');
    const combinedContent = userMessages.map(m => m.content).join('\n');

    return use_mcp_tool<{
      communicationStyle: UserPreferences['communication'];
      learningStyle: UserPreferences['learning'];
      workStyle: UserPreferences['workStyle'];
    }>({
      server_name: 'gemini',
      tool_name: 'analyze.patterns',
      arguments: {
        text: combinedContent,
        aspects: ['communication', 'learning', 'work']
      }
    });
  }

  /**
   * Extract topics of interest and expertise
   */
  private async extractTopics(
    messages: Array<{ role: string; content: string }>
  ): Promise<{
    interests: string[];
    expertise: string[];
  }> {
    const userMessages = messages.filter(m => m.role === 'user');
    const combinedContent = userMessages.map(m => m.content).join('\n');

    return use_mcp_tool({
      server_name: 'gemini',
      tool_name: 'extract.topics',
      arguments: {
        text: combinedContent,
        categories: ['interests', 'expertise']
      }
    });
  }
}

export const aiPersonalization = AIPersonalization.getInstance();