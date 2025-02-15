import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. Gemini features will be disabled.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function getChatModel() {
  if (!genAI) {
    throw new Error("Gemini API key not configured.");
  }
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });
}

export function getEmbeddingModel(){
    if (!genAI) {
        throw new Error("Gemini API key not configured.");
    }
    return genAI.getGenerativeModel({ model: "embedding-001"});
}