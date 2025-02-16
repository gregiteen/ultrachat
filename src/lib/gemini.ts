const GEMINI_API_URL = '/gemini/v1beta/models/gemini-pro:generateContent';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface PersonalizationContext {
  name?: string;
  personalDocument?: string;
  preferences?: {
    communication?: string;
    learning?: string;
    workStyle?: string;
  };
}

class Chat {
  private history: ChatMessage[] = [];
  private context: PersonalizationContext | null = null;

  constructor(private apiKey: string) {}

  setPersonalizationContext(context: PersonalizationContext) {
    this.context = context;
  }

  private getSystemPrompt(): string {
    let prompt = `You are UltraChat, a highly advanced AI assistant powered by Gemini Pro. You aim to provide exceptionally detailed, nuanced, and personalized responses while maintaining a friendly and professional tone. Your responses should demonstrate deep understanding and sophisticated analysis.

Key Traits:
- Highly knowledgeable and technically precise
- Friendly and personable, but professional
- Proactive in suggesting relevant information
- Clear and well-structured responses
- Maintains context and continuity

When providing code or technical information:
- Include detailed explanations
- Use proper formatting and syntax
- Consider best practices
- Explain your reasoning
- Provide examples when helpful`;

    if (this.context) {
      if (this.context.name) {
        prompt += `\n\nUser Name: ${this.context.name}`;
      }
      if (this.context.personalDocument) {
        prompt += `\n\nUser Information:\n${this.context.personalDocument}`;
      }
      if (this.context.preferences) {
        prompt += `\n\nPreferences:`;
        if (this.context.preferences.communication) {
          prompt += `\n- Communication Style: ${this.context.preferences.communication}`;
        }
        if (this.context.preferences.learning) {
          prompt += `\n- Learning Style: ${this.context.preferences.learning}`;
        }
        if (this.context.preferences.workStyle) {
          prompt += `\n- Work Style: ${this.context.preferences.workStyle}`;
        }
      }
    }

    return prompt;
  }

  async sendMessage(content: string): Promise<{ response: { text: () => string } }> {
    // Add user message to history
    const userMessage: ChatMessage = { role: 'user', content };
    this.history.push(userMessage);

    // Keep only last 10 messages for context window
    if (this.history.length > 20) {
      this.history = this.history.slice(-20);
    }

    try {
      const systemPrompt = this.getSystemPrompt();
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            { 
              role: 'user',
              parts: [{ text: systemPrompt }]
            },
            ...this.history.map(msg => ({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            }))
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 4096
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      console.log('Gemini response:', responseText);
      
      // Add AI response to history if unique
      if (!this.history.find(m => m.content === responseText)) {
        this.history.push({ role: 'model' as const, content: responseText });
      }

      return {
        response: {
          text: () => responseText
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }
}

class GeminiAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not found');
    }
  }

  startChat(): Chat {
    return new Chat(this.apiKey);
  }

  async generateText(prompt: string): Promise<string> {
    const chat = new Chat(this.apiKey);
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }

  async generateStructuredResponse(prompt: string): Promise<any> {
    const response = await this.generateText(prompt);
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing structured response:', error);
      throw new Error('Failed to parse structured response from Gemini');
    }
  }
}

export const gemini = new GeminiAPI();
export const getChatModel = () => gemini;