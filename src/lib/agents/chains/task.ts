import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import type { Task } from "../../../types";

const taskOutputSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    priority: { type: "string", enum: ["low", "medium", "high"] },
    due_date: { type: "string", format: "date-time" },
    subtasks: { 
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          estimated_duration: { type: "string" }
        }
      }
    },
    clarification_needed: { type: "boolean" },
    clarification_questions: { 
      type: "array",
      items: { type: "string" }
    }
  }
};

export function createTaskChain(model: ChatGoogleGenerativeAI) {
  const taskPrompt = PromptTemplate.fromTemplate(`
    Act as a task management assistant. Analyze the following request and:
    1. Extract task details
    2. Break down complex tasks into subtasks
    3. Identify any missing information
    4. Suggest deadlines if not specified
    5. Determine priority based on context and urgency

    User request: {input}

    Respond in JSON format matching the following schema:
    ${JSON.stringify(taskOutputSchema, null, 2)}
  `);

  return RunnableSequence.from([
    taskPrompt,
    model,
    new JsonOutputParser(),
    async (output: any): Promise<{
      task?: Partial<Task>;
      needsClarification: boolean;
      clarificationQuestions?: string[];
      response: string;
    }> => {
      if (output.clarification_needed) {
        return {
          needsClarification: true,
          clarificationQuestions: output.clarification_questions,
          response: "I need some clarification to better understand your task:"
        };
      }

      return {
        task: {
          title: output.title,
          description: output.description,
          priority: output.priority,
          due_date: output.due_date,
          status: "todo"
        },
        needsClarification: false,
        response: `I've created a task: "${output.title}"\n\nI've broken it down into ${output.subtasks.length} subtasks for better management.`
      };
    }
  ]);
}