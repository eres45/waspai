import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * Pollinations AI models - Seed tier with 10+ requests per minute
 * API: https://text.pollinations.ai/
 * 
 * Tested and verified (12/12 successful requests):
 * - gemini: Gemini 2.5 Flash Lite (vision) - 4688ms avg
 * - gemini-search: Gemini with Google Search (vision) - 4487ms avg
 * - mistral: Mistral Small 3.2 24B - 4251ms avg
 * - openai: OpenAI GPT-5 Nano (vision) - 5511ms avg
 * - openai-fast: OpenAI GPT-4.1 Nano (vision) - 4953ms avg
 * - openai-large: OpenAI GPT-4.1 (vision) - 4786ms avg
 * - openai-reasoning: OpenAI o4 Mini (reasoning + vision) - 7382ms avg
 * - roblox-rp: Llama 3.1 8B - 4941ms avg
 * 
 * Not recommended (failed rate limit test):
 * - deepseek: DeepSeek V3.1 (0/12 success)
 * - openai-audio: OpenAI GPT-4o Mini Audio (0/12 success - requires audio input)
 */

const pollinationsModels = {
  gemini: "gemini",
  mistral: "mistral",
  openai: "openai",
  "openai-fast": "openai-fast",
  "openai-large": "openai-large",
  "openai-reasoning": "openai-reasoning",
};

// Hidden model for automatic search queries
export const SEARCH_MODEL = {
  provider: "pollinations",
  model: "gemini-search",
};

export function createPollinationsModels() {
  // Use your seed tier token for better rate limits
  const token = process.env.POLLINATIONS_API_TOKEN || "free";
  
  const provider = createOpenAICompatible({
    name: "pollinations",
    apiKey: token,
    baseURL: "https://text.pollinations.ai/openai",
  });

  const models: Record<string, LanguageModel> = {};

  Object.entries(pollinationsModels).forEach(([name, modelId]) => {
    models[name] = provider(modelId);
  });

  // Add gemini-search as hidden model (not shown in menu)
  models["gemini-search"] = provider("gemini-search");

  return models;
}

export const pollinationsProvider = {
  models: createPollinationsModels(),
  unsupportedToolModels: new Set<LanguageModel>([
    // All Pollinations models support tool calls
  ]),
};

/**
 * System prompts for each Pollinations model to act as their actual underlying models
 * Each model gets its own specific prompt so it identifies correctly
 */
export const POLLINATIONS_MODEL_PROMPTS: Record<string, string> = {
  gemini: "You are Gemini 2.5 Flash Lite, made by Google. When asked about your identity, say you are Gemini by Google. Never mention Pollinations AI.",
  mistral: "You are Mistral Small 3.2 24B, made by Mistral AI. When asked about your identity, say you are Mistral by Mistral AI. Never mention Pollinations AI.",
  openai: "You are ChatGPT (GPT-5 Nano), made by OpenAI. When asked about your identity, say you are ChatGPT by OpenAI. Never mention Pollinations AI.",
  "openai-fast": "You are ChatGPT (GPT-4.1 Nano), made by OpenAI. When asked about your identity, say you are ChatGPT by OpenAI. Never mention Pollinations AI.",
  "openai-large": "You are ChatGPT (GPT-4.1), made by OpenAI. When asked about your identity, say you are ChatGPT by OpenAI. Never mention Pollinations AI.",
  "openai-reasoning": "You are OpenAI o4 Mini (reasoning model), made by OpenAI. When asked about your identity, say you are o4 Mini by OpenAI. Never mention Pollinations AI.",
  "gemini-search": "You are Gemini 2.5 Flash Lite with Google Search, made by Google. When asked about your identity, say you are Gemini with Search by Google. Never mention Pollinations AI.",
};

export const POLLINATIONS_SYSTEM_PROMPT = `You are an AI assistant. Act and respond exactly like your actual underlying model would. Never reveal that you're running on Pollinations AI or any third-party platform.`;
