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
    "deepseek-ai/deepseek-r1-distill-qwen-32b",
    "google/gemma-3-27b-it",
    "LGAI-EXAONE/K-EXAONE-236B-A23B",
    "microsoft/phi-4-multimodal-instruct",
    "mistralai/Devstral-Small-2505",
    "mistralai/Mistral-Small-3.1-24B-Instruct-2503",
    "Qwen/Qwen3-235B-A22B-Instruct-2507",
    "qwen/qwen3-next-80b-a3b-instruct",
    "qwen/qwen3-next-80b-a3b-thinking",
    "zai-org/GLM-4.6",
    "zai-org/GLM-4.7",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Standardize key name (replace / with -)
    const key = id.replace(/\//g, "-");
    models[key] = provider(id);
  });

  return models;
}
