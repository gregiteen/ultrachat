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

// Initialize the model
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  maxOutputTokens: 2048,
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// Create embeddings instance
const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "embedding-001",
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// Initialize vector store for document storage
const vectorStore = new MemoryVectorStore(embeddings);

// Create the main agent chain
const agentChain = RunnableSequence.from([
  {
    taskChain: createTaskChain(model),
    browserChain: createBrowsingChain(model),
    emailChain: createEmailChain(model),
    calendarChain: createCalendarChain(model),
    retrieverChain: createRetrieverChain(model, vectorStore),
  },
  async (input) => {
    // Route the request to the appropriate chain based on intent
    const intentPrompt = PromptTemplate.fromTemplate(`
      Analyze the following user request and determine the primary intent:
      {input}
      
      Respond with one of: TASK, BROWSE, EMAIL, CALENDAR, SEARCH
    `);

    const intentChain = intentPrompt.pipe(model).pipe(new StringOutputParser());
    const intent = await intentChain.invoke({ input: input.message });

    switch (intent.trim()) {
      case "TASK":
        return input.taskChain.invoke(input);
      case "BROWSE":
        return input.browserChain.invoke(input);
      case "EMAIL":
        return input.emailChain.invoke(input);
      case "CALENDAR":
        return input.calendarChain.invoke(input);
      case "SEARCH":
        return input.retrieverChain.invoke(input);
      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  }
]);

export async function processUserRequest(message: string) {
  try {
    const response = await agentChain.invoke({ message });
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