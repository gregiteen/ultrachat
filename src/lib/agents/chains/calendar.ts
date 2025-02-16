import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { CalendarExecutor } from "../executors/calendar";

const calendarOutputSchema = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["create", "update", "delete", "query"] },
    event: {
      type: "object",
      properties: {
        title: { type: "string" },
        start_time: { type: "string", format: "date-time" },
        end_time: { type: "string", format: "date-time" },
        description: { type: "string" },
        attendees: { type: "array", items: { type: "string" } }
      }
    },
    query_params: {
      type: "object",
      properties: {
        start_date: { type: "string", format: "date" },
        end_date: { type: "string", format: "date" },
        search_term: { type: "string" }
      }
    }
  }
};

export function createCalendarChain(model: ChatGoogleGenerativeAI, executor: CalendarExecutor) {
  const calendarPrompt = PromptTemplate.fromTemplate(`
    Act as a calendar management assistant. Analyze the following request and:
    1. Determine the calendar action needed
    2. Extract event details or query parameters
    3. Format dates and times appropriately
    4. Handle scheduling conflicts
    5. Suggest alternative times if needed

    User request: {input}

    Respond in JSON format matching the following schema:
    ${JSON.stringify(calendarOutputSchema, null, 2)}
  `);

  return RunnableSequence.from([
    calendarPrompt,
    model,
    new JsonOutputParser(),
    async (output) => {
      try {
        switch (output.action) {
          case "create": {
            const event = await executor.createEvent({
              summary: output.event.title,
              description: output.event.description,
              start: {
                dateTime: output.event.start_time,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: output.event.end_time,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              attendees: output.event.attendees,
            });
            return {
              success: true,
              message: "Event created successfully",
              event,
            };
          }
          case "update": {
            const event = await executor.updateEvent(output.event.id, {
              summary: output.event.title,
              description: output.event.description,
              start: {
                dateTime: output.event.start_time,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: output.event.end_time,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              attendees: output.event.attendees,
            });
            return {
              success: true,
              message: "Event updated successfully",
              event,
            };
          }
          case "delete":
            await executor.deleteEvent(output.event.id);
            return { success: true, message: "Event deleted successfully" };
          case "query":
            const events = await executor.listEvents(output.query_params);
            return { success: true, events };
        }
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  ]);
}