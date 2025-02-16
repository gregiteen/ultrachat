import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import type { Task } from "../../../types";
import { TaskExecutor } from "../executors/task";

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

interface TaskChainOutput {
  task?: Partial<Task>;
  needsClarification: boolean;
  clarificationQuestions?: string[];
  response: string;
  error?: string;
}

interface SubTask {
  title: string;
  estimated_duration: string;
}

export function createTaskChain(model: ChatGoogleGenerativeAI, executor: TaskExecutor) {
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
    async (output: any): Promise<TaskChainOutput> => {
      if (output.clarification_needed) {
        return {
          needsClarification: true,
          clarificationQuestions: output.clarification_questions,
          response: "I need some clarification to better understand your task:"
        };
      }

      try {
        // Create main task
        const task = await executor.createTask({
          title: output.title,
          description: output.description,
          priority: output.priority,
          due_date: output.due_date,
          status: "todo"
        });

        // Create subtasks if any
        if (output.subtasks && output.subtasks.length > 0) {
          await Promise.all(output.subtasks.map((subtask: SubTask) =>
            executor.createTask({
              title: subtask.title,
              description: `Estimated duration: ${subtask.estimated_duration}`,
              priority: output.priority,
              due_date: output.due_date,
              status: "todo",
              parent_id: task.id
            })
          ));
        }

        return {
          task,
          needsClarification: false,
          response: `I've created a task: "${output.title}"\n\nI've broken it down into ${output.subtasks.length} subtasks for better management.`
        };
      } catch (error: any) {
        return {
          needsClarification: false,
          response: `Error creating task: ${error.message}`,
          error: error.message
        };
      }
    }
  ]);
}