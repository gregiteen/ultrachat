import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { useIntegrationsStore } from "../../store/integrations";

// Initialize the model
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  maxOutputTokens: 2048,
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// Create the agent router
export async function routeAgentRequest(request: string) {
  // First, analyze the request to determine which integration(s) we need
  const routingPrompt = PromptTemplate.fromTemplate(`
    Analyze the following request and determine which integrations are needed:
    {request}

    Return a JSON array of required integrations from: gmail, google_calendar, slack, zoom
  `);

  const routingChain = routingPrompt
    .pipe(model)
    .pipe(new StringOutputParser());

  const requiredIntegrations = JSON.parse(
    await routingChain.invoke({ request })
  );

  // Check if we have the required integrations
  const { integrations } = useIntegrationsStore.getState();
  const missingIntegrations = requiredIntegrations.filter(
    type => !integrations.find(i => i.type === type && i.status === 'connected')
  );

  if (missingIntegrations.length > 0) {
    return {
      success: false,
      error: `Missing required integrations: ${missingIntegrations.join(', ')}`,
      missingIntegrations
    };
  }

  // Route to appropriate agent chain
  const agentPrompt = PromptTemplate.fromTemplate(`
    You are an AI assistant with access to the following integrations:
    ${requiredIntegrations.join(', ')}

    User request: {request}

    Respond with a step-by-step plan to fulfill this request using the available integrations.
  `);

  const agentChain = agentPrompt
    .pipe(model)
    .pipe(new StringOutputParser());

  const plan = await agentChain.invoke({ request });

  // Execute the plan
  // TODO: Implement actual API calls to integrations
  return {
    success: true,
    plan,
    integrations: requiredIntegrations
  };
}