import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createRetrieverChain } from "./chains/retriever";
import { createBrowsingChain } from "./chains/browser";
import { createTaskChain } from "./chains/task";
import { createEmailChain } from "./chains/email";
import { createCalendarChain } from "./chains/calendar";
import { CalendarExecutor } from "./executors/calendar";
import { TaskExecutor } from "./executors/task";
import { GmailExecutor } from "./executors/gmail";
import { Document } from "langchain/document";

// Initialize the model
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.0-pro-exp-02-05",
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  maxOutputTokens: 2048,
  temperature: 0.7,
});

// Initialize embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

// Initialize executors
const taskExecutor = new TaskExecutor();
const calendarExecutor = new CalendarExecutor(import.meta.env.VITE_GOOGLE_ACCESS_TOKEN);
const gmailExecutor = new GmailExecutor(import.meta.env.VITE_GOOGLE_ACCESS_TOKEN);

// Initialize chains
const taskChain = createTaskChain(model, taskExecutor, calendarExecutor, gmailExecutor);
const browserChain = createBrowsingChain(model);
const emailChain = createEmailChain(model);
const calendarChain = createCalendarChain(model, calendarExecutor);

// Initialize vector store and retriever chain
const initializeRetriever = async () => {
  const vectorStore = new MemoryVectorStore(embeddings);
  await vectorStore.addDocuments([new Document({ pageContent: "" })]);
  return createRetrieverChain(model, vectorStore);
};

let retrieverChain: Awaited<ReturnType<typeof createRetrieverChain>>;

// Create intent determination prompt
const intentPrompt = PromptTemplate.fromTemplate(`
  Analyze the following user request and determine the primary intent:
  {input}
  
  Respond with one of: TASK, BROWSE, EMAIL, CALENDAR, SEARCH
`);

// Create intent determination chain
const determineIntent = async (message: string) => {
  const chain = RunnableSequence.from([
    intentPrompt,
    model,
    new StringOutputParser(),
  ]);
  return chain.invoke({ input: message });
};

// Create input transformer
const transformInput = (message: string) => ({
  message,
  input: message
});

// Create the main agent chain
async function routeRequest(message: string) {
  // Initialize retriever chain if not already initialized
  if (!retrieverChain) {
    retrieverChain = await initializeRetriever();
  }

  const intent = await determineIntent(message);
  const input = transformInput(message);

  switch (intent) {
    case "TASK":
      return taskChain.invoke(input);
    case "BROWSE":
      return browserChain.invoke(input);
    case "EMAIL":
      return emailChain.invoke(input);
    case "CALENDAR":
      return calendarChain.invoke(input);
    case "SEARCH":
      return retrieverChain.invoke(input);
    default:
      throw new Error(`Unknown intent: ${intent}`);
  }
}

export async function processUserRequest(message: string) {
  try {
    const response = await routeRequest(message);
    return {
      success: true,
      response,
    };
  } catch (error) {
    console.error("Agent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
