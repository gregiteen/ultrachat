import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import * as puppeteer from 'puppeteer';

export function createBrowsingChain(model: ChatGoogleGenerativeAI) {
  const browserPrompt = PromptTemplate.fromTemplate(`
    Act as a web browsing agent. Your task is to:
    1. Extract URLs from the user's request
    2. Visit the URLs and extract relevant information
    3. Summarize the findings
    4. Answer any specific questions

    User request: {input}
  `);

  return RunnableSequence.from([
    browserPrompt,
    model,
    new StringOutputParser(),
    async (urls: string) => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      
      try {
        // Visit each URL and extract content
        const extractedUrls = urls.match(/https?:\/\/[^\s]+/g) || [];
        const results = await Promise.all(
          extractedUrls.map(async (url) => {
            await page.goto(url);
            const content = await page.content();
            const loader = new CheerioWebBaseLoader(content);
            const docs = await loader.load();
            return docs;
          })
        );

        await browser.close();
        return results;
      } catch (error) {
        await browser.close();
        throw error;
      }
    },
    // Summarize results
    async (docs) => {
      const summaryPrompt = PromptTemplate.fromTemplate(`
        Summarize the following web content and highlight key information:
        {content}
      `);

      const summaryChain = summaryPrompt.pipe(model).pipe(new StringOutputParser());
      return summaryChain.invoke({ content: JSON.stringify(docs) });
    }
  ]);
}