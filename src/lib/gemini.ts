const GEMINI_API_URL = import.meta.env.DEV ? '/v1beta/models/gemini-2.0-pro-exp-02-05:generateContent' : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp-02-05:generateContent';

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

class Chat {
  private history: ChatMessage[] = [];
  private context: PersonalizationContext | null = null;

  constructor(private apiKey: string) {}

  setPersonalizationContext(context: PersonalizationContext) {
    this.context = context;
  }

  private getSystemPrompt(isSearch: boolean = false): string {
    let prompt = `You are UltraChat, a highly advanced AI assistant powered by Gemini 2.0 Pro Experimental. You aim to provide exceptionally detailed, nuanced, and personalized responses while maintaining a professional tone. Your responses should demonstrate deep understanding and sophisticated analysis.

Response Format:
1. Always start with a clear, direct answer
2. Use proper paragraph breaks for readability
3. Format lists and technical information clearly
4. Keep responses concise but informative
5. Separate sections with clear headings when needed

When thinking about a response:
1. Use <thinking> tags to show your analysis
2. Keep thoughts separate from the final response
3. Structure thoughts logically
4. Consider all relevant context

When answering questions:
1. Start with the most relevant information
2. Use proper formatting:
   - Paragraphs for explanations
   - Bullet points for lists
   - Headers for sections
   - Code blocks for code
3. Cite sources when available
4. Include relevant context

Search Results Format:
1. Integrate search information naturally
2. Maintain clear structure with sections
3. Use proper citation format`;

    if (this.context) {
      prompt += '\n\nPersonalization Context:';
      
      if (this.context.name) {
        prompt += `\nName: ${this.context.name}`;
      }
      
      if (this.context.backstory) {
        prompt += `\nBackground: ${this.context.backstory}`;
      }
      
      if (this.context.interests?.length) {
        prompt += `\nInterests: ${this.context.interests.join(', ')}`;
      }
      
      if (this.context.expertise_areas?.length) {
        prompt += `\nExpertise Areas: ${this.context.expertise_areas.join(', ')}`;
      }
      
      if (this.context.personalDocument) {
        prompt += `\n\nDetailed Profile:\n${this.context.personalDocument}`;
      }
      
      if (this.context.preferences) {
        prompt += '\n\nPreferences:';
        if (this.context.preferences.communication?.tone) {
          prompt += `\n- Communication Tone: ${this.context.preferences.communication.tone}`;
          prompt += `\n- Communication Style: ${this.context.preferences.communication.style || 'Not specified'}`;
          prompt += `\n- Learning Style: ${this.context.preferences.learning?.style || 'Not specified'}`;
          prompt += `\n- Work Style: ${this.context.preferences.work?.style || 'Not specified'}`;
        }
      }
      
      prompt += '\n\nPlease tailor your responses to match these preferences and context.';
    }

    return prompt;
  }

  async sendMessage(content: string, isSearch: boolean = false, options?: SendMessageOptions): Promise<{ response: { text: () => string } }> {
    // Add user message to history
    const userMessage: ChatMessage = { role: 'user', content };
    this.history.push(userMessage);

    // Keep only last 10 messages for context window
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
              text: systemPrompt + "\n\n" + this.history.map(msg => 
                `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
              ).join("\n") + "\n\nUser: " + content
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

  startChat(): Chat {
    return new Chat(this.apiKey);
  }
  
  startChatWithContext(context: PersonalizationContext): Chat {
    const chat = new Chat(this.apiKey);
    chat.setPersonalizationContext(context);
    return chat;
  }

  async generateText(prompt: string): Promise<string> {
    const chat = new Chat(this.apiKey);
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }

  async generateStructuredResponse(prompt: string): Promise<any> {
    const response = await this.generateText(prompt);
    try {
      // Clean up the response to handle markdown code blocks
      let cleanResponse = response;
      
      // Remove markdown code block markers if present
      if (response.includes('```json')) {
        cleanResponse = response
          .replace(/```json\n?/, '')
          .replace(/```(\n)?$/, '')
          .trim();
      }
      
      // Parse and validate the response
      const parsed = JSON.parse(cleanResponse);
      
      return parsed;
    } catch (error) {
      console.error('Error parsing structured response:', error);
      throw new Error('Failed to parse structured response from Gemini');
    }
  }

  async generatePersonalizationResponse(prompt: string): Promise<any> {
    const chat = new Chat(this.apiKey);
    const result = await chat.sendMessage(prompt);
    const response = result.response.text();

    try {
      // Clean up the response to handle markdown code blocks
      let cleanResponse = response;
      
      // Remove markdown code blocks if present
      if (response.includes('```json')) {
        cleanResponse = response.replace(/```json\n?/, '').replace(/```(\n)?$/, '').trim();
      }
      
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error parsing personalization response:', error, '\nRaw response:', response);
      throw new Error('Failed to parse personalization response from Gemini');
    }
  }
}

export const gemini = new GeminiAPI();
export const getChatModel = () => gemini;