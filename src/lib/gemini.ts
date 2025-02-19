const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp-02-05:generateContent';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface PersonalizationContext {
  name?: string;
  personalDocument?: string;
  backstory?: string;
  interests?: string[];
  expertise_areas?: string[];
  preferences?: {
    communication?: {
      tone?: string;
      style?: string;
    };
    learning?: {
      style?: string;
    };
    work?: {
      style?: string;
    };
  };
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

interface SendMessageOptions {
  onStreamResponse?: (response: string) => void;
  signal?: AbortSignal;
}

export class Chat {
  private history: ChatMessage[] = [];
  private context: PersonalizationContext | null = null;
  private baseSystemMessage: string;

  constructor(private apiKey: string, systemMessage?: string) {
    this.baseSystemMessage = systemMessage || '';
    if (systemMessage) {
      this.history.push({ role: 'model', content: systemMessage });
    }
  }

  setPersonalizationContext(context: PersonalizationContext) {
    this.context = context;
  }

  private getSystemPrompt(isSearch: boolean = false): string {
    // Layer 1: Base System Message
    let prompt = this.baseSystemMessage + '\n\n';

    // Layer 2: Personalization Context (only if context exists)
    if (this.context) {
      prompt += 'Personalization Context:\n';
      if (this.context.name) prompt += `User Name: ${this.context.name}\n`;
      if (this.context.personalDocument) prompt += `Profile: ${this.context.personalDocument}\n`;
      if (this.context.backstory) prompt += `Background: ${this.context.backstory}\n`;
      if (this.context.interests?.length) prompt += `Interests: ${this.context.interests.join(', ')}\n`;
      if (this.context.expertise_areas?.length) prompt += `Expertise: ${this.context.expertise_areas.join(', ')}\n`;
      
      if (this.context.preferences) {
        const prefs = this.context.preferences;
        if (prefs.communication?.style) prompt += `Communication Style: ${prefs.communication.style}\n`;
        if (prefs.learning?.style) prompt += `Learning Style: ${prefs.learning.style}\n`;
        if (prefs.work?.style) prompt += `Work Style: ${prefs.work.style}\n`;
      }
      prompt += '\n';
    }

    // Layer 3: Search Context (only if search is enabled)
    if (isSearch) {
      prompt += 'Search Context:\n';
      prompt += '- Integrate search results naturally into responses\n';
      prompt += '- Cite sources when referencing search information\n';
      prompt += '- Maintain clear structure with sections\n\n';
    }

    // Layer 4: Available Tools (always included)
    prompt += 'Available Tools:\n';
    prompt += '1. Search Tools\n';
    prompt += '   - Web search for real-time information\n';
    prompt += '   - Document search within user files\n';
    prompt += '2. Task Tools\n';
    prompt += '   - Task creation and management\n';
    prompt += '   - Project organization\n';
    prompt += '3. File Tools\n';
    prompt += '   - Document processing\n';
    prompt += '   - Content extraction\n';
    prompt += '4. Integration Tools\n';
    prompt += '   - Calendar management\n';
    prompt += '   - Email and messaging\n';
    prompt += '   - Browser automation\n';
    prompt += '\n';

    return prompt;
  }

  async sendMessage(content: string, isSearch: boolean = false, options?: SendMessageOptions): Promise<{ response: { text: () => string } }> {
    // Add user message to history
    const userMessage: ChatMessage = { role: 'user', content };
    this.history.push(userMessage);

    // Keep only last 20 messages for context window
    if (this.history.length > 20) {
      this.history = this.history.slice(-20);
    }

    try {
      const systemPrompt = this.getSystemPrompt(isSearch);
      
      const fetchOptions: RequestInit = {
        signal: options?.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nConversation History:\n` + 
                this.history.map((msg, index) => {
                  // Skip system messages in history
                  if (index === 0 && msg.role === 'model' && msg.content === this.baseSystemMessage) return '';
                  return `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`;
                })
                .filter(Boolean)
                .join("\n") + 
                "\nAssistant:"
            }]
          }]
        })
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as GeminiResponse;
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      let responseText = '';
      const streamResponse = (text: string) => {
        responseText = text;
        if (options?.onStreamResponse) {
          options.onStreamResponse(responseText);
        }
      };

      // Simulate streaming by splitting response into chunks
      let fullResponse = data.candidates[0].content.parts[0].text.trim();
      const words = fullResponse.split(' ');
      const chunkSize = 3; // Number of words per chunk

      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        streamResponse(words.slice(0, i + chunkSize).join(' '));
        
        // Check if request was aborted
        if (options?.signal?.aborted) break;
        
        // Small delay between chunks to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Clean up response format
      fullResponse = fullResponse
        .replace(/<thinking>[\s\S]*?<\/thinking>/g, '') // Remove thinking tags
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
        .trim();

      // Add AI response to history
      this.history.push({ role: 'model', content: responseText });

      return {
        response: {
          text: () => responseText
        }
      };
    } catch (error) {
      // Handle aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      console.error('Gemini API error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get response: ${error.message}`);
      } else {
        throw new Error('Failed to get response from Gemini API. Please try again.');
      }
    }
  }
}

class GeminiAPI {
  private apiKey: string;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  startChat(systemMessage?: string): Chat {
    return new Chat(this.apiKey, systemMessage);
  }
  
  startChatWithContext(context: PersonalizationContext, systemMessage?: string): Chat {
    const chat = new Chat(this.apiKey, systemMessage);
    chat.setPersonalizationContext(context);
    return chat;
  }

  async generateText(prompt: string): Promise<string> {
    const chat = new Chat(this.apiKey);
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }
}

export const gemini = new GeminiAPI();
export const getChatModel = () => gemini;