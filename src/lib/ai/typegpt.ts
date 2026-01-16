import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * TypeGPT Models Integration
 * API: https://typegpt.ai/v1
 */
export function createTypeGPTModels() {
  const provider = createOpenAICompatible({
    name: "typegpt",
    baseURL: "https://typegpt.ai/v1",
    apiKey: process.env.TYPEGPT_API_KEY,
  });

  const modelIds = [
    "command-r-plus-08-2024",
    "command-r7b-12-2024",
    "deepseek-ai/deepseek-r1",
    "deepseek-ai/deepseek-v3.1",
    "glm-4.5-air",
    "meta/llama-3.2-90b-vision-instruct",
    "meta/llama-4-scout-17b-16e-instruct",
    "nemotron-3-nano-30b-a3b",
    "nemotron-nano-9b-v2",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "umbra",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Standardize key name (replace / with -)
    const key = id.replace(/\//g, "-");
    models[key] = provider(id);
  });

  return models;
}
