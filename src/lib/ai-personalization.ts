import { PersonalizationChatState, AIResponse, PersonalizationDocument } from '../types/personalization';
import type { PersonalInfo } from '../types';
import { gemini } from './gemini';

export class AIPersonalizationService {
  private static instance: AIPersonalizationService;
  private constructor() {}

  public static getInstance(): AIPersonalizationService {
    if (!AIPersonalizationService.instance) {
      AIPersonalizationService.instance = new AIPersonalizationService();
    }
    return AIPersonalizationService.instance;
  }

  public async generateChatResponse(
    input: string,
    files: string[] | null,
    currentState: PersonalizationChatState
  ): Promise<AIResponse> {
    // Handle special commands
    if (input === 'START_CHAT') {
      return {
        message: "Hello! I'm here to help personalize your experience. I'll ask you some questions to understand your preferences better. This information helps me provide a more tailored experience. Let's start with your name - what should I call you?",
        type: "greeting",
        intent: {
          category: "basic_info",
          action: "gather",
          confidence: 1.0,
          field: "name"
        },
        suggestions: [
          "My name is...",
          "You can call me...",
          "I go by..."
        ],
        extractedInfo: {}
      };
    }

    if (input.startsWith('FILE_SELECTED:')) {
      const filename = input.split(':')[1].split('/').pop();
      return {
        message: `I see you've shared ${filename}. This will help me understand your background better. Could you tell me what this file represents?`,
        type: "question",
        intent: {
          category: "files",
          action: "gather",
          confidence: 0.9,
          field: "file_context"
        },
        suggestions: [
          "This is my resume...",
          "This shows my background in...",
          "This represents my work on..."
        ],
        extractedInfo: {}
      };
    }

    const prompt = `You are a personalization assistant helping gather information for the user's profile. The profile includes these fields:

- Basic Info: name, email, phone
- Address: street, city, state, zip, country
- Professional: job, company, resume, projects
- Background: backstory, expertise
- Personal: height, weight, shoe_size, clothing_sizes (top/bottom)
- Preferences: favorite_foods, favorite_drinks
- Relationships: family, friends, love_interests
- Identity: cultural_groups, religion, worldview
- Interests: hobbies, interests, pets
- Goals: goals, dreams
- Health: health_concerns
- Other: keywords, freeform text

Current conversation:
${currentState.messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Current profile:
${Object.keys(currentState.extractedInfo).length > 0 ? JSON.stringify(currentState.extractedInfo, null, 2) : 'No information collected yet'}

Missing fields: ${(() => {
  const requiredFields = [
    'name',
    'email',
    'phone',
    'address',
    'job',
    'company',
    'backstory',
    'projects',
    'pets',
    'health_concerns',
    'height',
    'weight',
    'shoe_size',
    'clothing_sizes',
    'goals',
    'dreams',
    'resume',
    'hobbies',
    'family',
    'favorite_foods',
    'favorite_drinks',
    'friends',
    'love_interests',
    'cultural_groups',
    'religion',
    'worldview',
    'keywords',
    'interests',
    'expertise'
  ] as const;
  
  return Object.keys(currentState.extractedInfo).length > 0 
    ? requiredFields.filter(field => !(field in currentState.extractedInfo)).join(', ')
    : 'All fields need to be collected';
})()}
    job: true, company: true, backstory: true, projects: true,
    pets: true, health_concerns: true, height: true, weight: true,
    shoe_size: true, clothing_sizes: true, goals: true, dreams: true,
    resume: true, hobbies: true, family: true, favorite_foods: true,
    favorite_drinks: true, friends: true, love_interests: true,
    cultural_groups: true, religion: true, worldview: true,
    keywords: true, interests: true, expertise: true
  }).filter(([key]) => !currentState.extractedInfo[key]).map(([key]) => key).join(', ')
  : 'All fields need to be collected'}

Analyze their message "${input}" and respond with JSON:
{
  "message": "your response focusing on gathering profile information",
  "type": one of ["response", "question", "suggestion", "confirmation"],
  "intent": {
    "category": one of ["basic_info", "address", "professional", "background", "personal", "preferences", "relationships", "identity", "interests", "goals", "health"],
    "action": one of ["gather", "clarify", "suggest", "confirm"],
    "confidence": number between 0 and 1,
    "field": "specific field being gathered"
  },
  "suggestions": ["2-3 relevant follow-ups"],
  "extractedInfo": {
    // any new information for the profile fields
  }
}`;

    try {
      const result = await gemini.generateStructuredResponse(prompt);
      console.log('Generated response:', result);
      return result;
    } catch (error) {
      console.error('Error in personalization chat:', error);
      return {
        message: "I apologize for the interruption. Could you repeat that? I want to make sure I capture your information correctly.",
        type: "error",
        intent: {
          category: "basic_info",
          action: "gather",
          confidence: 0.5,
          field: "retry"
        },
        suggestions: [
          "Let me try again",
          "What I was saying was...",
          "About my information..."
        ],
        extractedInfo: {}
      };
    }
  }

  public async generatePersonalizationDocument(
    info: PersonalInfo,
    currentState: PersonalizationChatState
  ): Promise<PersonalizationDocument> {
    const prompt = `Create a personalization document based on this profile information:
${JSON.stringify(info, null, 2)}

Format as JSON:
{
  "preferences": {
    "communication": string,
    "learning": string,
    "workStyle": string
  },
  "interests": string[],
  "expertise": string[],
  "communication_style": {
    "tone": string,
    "formality": string,
    "detail_level": string
  },
  "personality_traits": string[],
  "goals": string[],
  "context_awareness": {
    "background": string,
    "current_focus": string,
    "future_aspirations": string
  }
}`;

    try {
      return await gemini.generateStructuredResponse(prompt);
    } catch (error) {
      console.error('Error generating personalization document:', error);
      return {
        preferences: {
          communication: "standard",
          learning: "adaptive",
          workStyle: "flexible"
        },
        interests: info.interests || ["to be determined"],
        expertise: info.expertise || ["to be determined"],
        communication_style: {
          tone: "neutral",
          formality: "adaptive",
          detail_level: "balanced"
        },
        personality_traits: ["adaptable"],
        goals: info.goals || ["to be determined"],
        context_awareness: {
          background: info.backstory || "To be determined",
          current_focus: "Building profile",
          future_aspirations: info.dreams?.[0] || "To be determined"
        }
      };
    }
  }
}

export const aiPersonalization = AIPersonalizationService.getInstance();