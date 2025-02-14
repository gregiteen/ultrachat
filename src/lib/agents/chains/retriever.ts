import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export function createRetrieverChain(
  model: ChatGoogleGenerativeAI,
  vectorStore: MemoryVectorStore
) {
  const retrieverPrompt = PromptTemplate.fromTemplate(`
    Use the following pieces of context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    
    Context: {context}
    
    Question: {question}
    
    Answer:
  `);

  return RunnableSequence.from([
    async (input: { message: string }) => {
      const retriever = vectorStore.asRetriever();
      const docs = await retriever.getRelevantDocuments(input.message);
      return {
        context: docs.map(doc => doc.pageContent).join("\n\n"),
        question: input.message
      };
    },
    retrieverPrompt,
    model,
    new StringOutputParser()
  ]);
}