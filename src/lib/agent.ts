import { getChatModel } from './gemini';
import type { Task } from '../types';

// Agent prompts and instructions
const AGENT_SYSTEM_PROMPT = `You are a helpful AI agent assistant. Your role is to:
1. Help users create and manage tasks
2. Ask clarifying questions when task details are unclear
3. Provide suggestions and assistance for task completion
4. Break down complex tasks into manageable steps
5. Track progress and provide updates

Always be proactive in asking for clarification when needed.

IMPORTANT: Always respond in valid JSON format with the following structure:
{
  "isTaskRequest": boolean,
  "needsClarification": boolean,
  "clarificationQuestions": string[] | null,
  "task": {
    "title": string | null,
    "description": string | null,
    "priority": "low" | "medium" | "high" | null,
    "due_date": string | null
  },
  "response": string
}`;

interface AgentResponse {
  isTaskRequest: boolean;
  needsClarification: boolean;
  clarificationQuestions: string[] | null;
  task: {
    title: string | null;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | null;
    due_date: string | null;
  } | null;
  response: string;
}

function isValidAgentResponse(response: any): response is AgentResponse {
  if (typeof response !== 'object' || response === null) return false;

  // Check required fields
  if (typeof response.isTaskRequest !== 'boolean') return false;
  if (typeof response.needsClarification !== 'boolean') return false;
  if (typeof response.response !== 'string') return false;

  // Check clarificationQuestions
  if (response.clarificationQuestions !== null && 
      (!Array.isArray(response.clarificationQuestions) || 
       !response.clarificationQuestions.every(q => typeof q === 'string'))) {
    return false;
  }

  // Check task object if present
  if (response.task !== null) {
    const task = response.task;
    if (typeof task !== 'object') return false;
    
    // Check task fields
    if (task.title !== null && typeof task.title !== 'string') return false;
    if (task.description !== null && typeof task.description !== 'string') return false;
    if (task.priority !== null && !['low', 'medium', 'high'].includes(task.priority)) return false;
    if (task.due_date !== null && typeof task.due_date !== 'string') return false;
  }

  return true;
}

function sanitizeResponse(text: string): string {
  // Find the first { and last } to extract the JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error('Invalid JSON response format');
  }

  return text.slice(start, end + 1);
}

export async function handleTaskRequest(message: string): Promise<{
  response: string;
  task?: Partial<Task>;
  needsClarification: boolean;
  clarificationQuestions?: string[];
}> {
  const model = getChatModel();
  const chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  });

  try {
    // Send system prompt
    await chat.sendMessage([{ text: AGENT_SYSTEM_PROMPT }]);

    // Analyze user message
    const result = await chat.sendMessage([
      { text: `User request: "${message}"\n\nAnalyze this request and respond in the specified JSON format.` }
    ]);

    // Get the response text and sanitize it
    const sanitizedResponse = sanitizeResponse(result.response.text());

    // Parse the response
    let analysis: AgentResponse;
    try {
      analysis = JSON.parse(sanitizedResponse);
    } catch (error) {
      console.error('Failed to parse agent response:', error);
      throw new Error('Failed to parse agent response');
    }

    // Validate the response structure
    if (!isValidAgentResponse(analysis)) {
      console.error('Invalid agent response structure:', analysis);
      throw new Error('Invalid agent response structure');
    }

    if (!analysis.isTaskRequest) {
      return {
        response: "I don't see a task in your message. Would you like to create a task? Just let me know what you'd like to do.",
        needsClarification: false
      };
    }

    if (analysis.needsClarification) {
      const questions = analysis.clarificationQuestions || ['Could you provide more details about the task?'];
      return {
        response: "I'd like to help you create this task, but I need some clarification:\n\n" + questions.join('\n'),
        needsClarification: true,
        clarificationQuestions: questions
      };
    }

    // Convert the agent's task format to our Task type
    const task = analysis.task ? {
      title: analysis.task.title || '',
      description: analysis.task.description || undefined,
      priority: analysis.task.priority || 'medium',
      due_date: analysis.task.due_date || undefined,
      status: 'todo' as const
    } : undefined;

    return {
      response: analysis.response,
      task,
      needsClarification: false
    };
  } catch (error) {
    console.error('Error in handleTaskRequest:', error);
    throw new Error(error instanceof Error ? error.message : 'An error occurred while processing your request');
  }
}