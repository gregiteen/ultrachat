import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import type { Task } from "../../../types";
import { TaskExecutor } from "../executors/task";
import { TaskOrchestrator } from "../orchestrator";
import { CalendarExecutor } from "../executors/calendar";
import { GmailExecutor } from "../executors/gmail";

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
    automation: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["recurring", "dependent", "deadline"] },
        config: {
          type: "object",
          properties: {
            frequency: { type: "string" },
            dependsOn: { type: "array", items: { type: "string" } },
            notifyBefore: { type: "number" }
          }
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
  task?: Task;
  needsClarification: boolean;
  clarificationQuestions?: string[];
  response: string;
  error?: string;
}

interface SubTask {
  title: string;
  estimated_duration: string;
}

export function createTaskChain(
  model: ChatGoogleGenerativeAI, 
  taskExecutor: TaskExecutor,
  calendarExecutor: CalendarExecutor,
  gmailExecutor: GmailExecutor
) {
  const orchestrator = new TaskOrchestrator(
    taskExecutor,
    calendarExecutor,
    gmailExecutor
  );

  const taskPrompt = PromptTemplate.fromTemplate(`
    Act as an intelligent task management assistant. Analyze the following request and:
    1. Extract task details and create a structured task
    2. Break down complex tasks into subtasks with estimated durations
    3. Identify any missing information
    4. Suggest optimal deadlines based on task complexity and priority
    5. Determine priority based on context and urgency
    6. Identify if the task should be:
       - Recurring (daily, weekly, monthly)
       - Dependent on other tasks
       - Have specific deadline notifications
    7. Consider calendar availability and scheduling conflicts

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
        const task = await taskExecutor.createTask({
          title: output.title,
          description: output.description,
          priority: output.priority,
          due_date: output.due_date,
          status: "todo",
          estimated_duration: output.subtasks?.reduce(
            (total: number, st: SubTask) => total + parseInt(st.estimated_duration),
            0
          )?.toString()
        });

        // Create subtasks if any
        if (output.subtasks && output.subtasks.length > 0) {
          const subtaskPromises = output.subtasks.map((subtask: SubTask) =>
            taskExecutor.createTask({
              title: subtask.title,
              description: `Estimated duration: ${subtask.estimated_duration}`,
              priority: output.priority,
              due_date: output.due_date,
              status: "todo",
              parent_id: task.id,
              estimated_duration: subtask.estimated_duration
            })
          );

          await Promise.all(subtaskPromises);
        }

        // Schedule task and set up automation
        await orchestrator.scheduleTask(task);

        if (output.automation) {
          await orchestrator.setupAutomation(task, {
            type: output.automation.type,
            config: output.automation.config
          });
        }

        let response = `I've created and scheduled the task: "${output.title}"\n\n`;
        
        if (output.subtasks?.length > 0) {
          response += `I've broken it down into ${output.subtasks.length} subtasks for better management.\n\n`;
        }

        if (output.automation) {
          response += `I've set up ${output.automation.type} automation for this task.\n`;
          if (output.automation.type === 'recurring') {
            response += `The task will recur ${output.automation.config.frequency}.\n`;
          } else if (output.automation.type === 'dependent') {
            response += `The task will start when its dependencies are completed.\n`;
          }
        }

        return {
          task,
          needsClarification: false,
          response
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