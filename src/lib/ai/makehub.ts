
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * MakeHub Models Integration
 * API: https://api.makehub.ai/v1
 */
export function createMakeHubModels() {
  const provider = createOpenAICompatible({
    name: "makehub",
    apiKey: process.env.MAKEHUB_API_KEY || "mh_c773225704ce46caad4e9129ae0853809826033b44e8410a94a7f892d78bf", // Fallback to provided key if env missing
    baseURL: "https://api.makehub.ai/v1",
  });

  const modelIds = [
    // Routers
    "openai/family",
    "deepseek/family",
    "google/family",
    "meta/family",
    "anthropic/family",
    "makehub-sota/family",
    "makehub-cost/family",

    // OpenAI
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "openai/gpt-4.1",
    "openai/o3",
    "openai/o4-mini",
    "openai/gpt-4.5",
    "openai/gpt-4.1-mini",
    "openai/gpt-4.1-nano",

    // DeepSeek
    "deepseek/deepseek-R1-fp8",
    "deepseek/deepseek-V3-0324-fp8",
    "deepseek/deepseek-R1-05-28-fp8",
    "deepseek/deepseek-V3-fp8",
    "deepseek/deepseek-R1-distill-llama-70b-fp16",

    // Meta (Llama)
    "meta/Llama-4-Scout-17B-16E-fp8",
    "meta/Llama-4-Maverick-17B-128E-fp8",
    "meta/Llama-3.3-70B-fp16",
    "meta/Llama-3.1-70B-fp16",
    "meta/Llama-3.1-8B-fp16",
    "meta/Llama-3.1-70B-fp8",
    "meta/Llama-3.1-8B-fp8",

    // Moonshot
    "moonshotai/kimi-k2-fp8",

    // Anthropic
    "anthropic/claude-4-sonnet",
    "anthropic/claude-4-opus",
    "anthropic/claude-3-5-haiku",
    "anthropic/claude-3-5-sonnet",
    "anthropic/claude-3-7-sonnet",

    // Qwen
    "qwen/Qwen3-235B-A22B-fp8",
    "qwen/QWQ-32b-fp16",
    "qwen/Qwen3-30B-A3B-fp8",
    "qwen/Qwen3-14B-fp8",
    "qwen/Qwen3-32B-fp8",
    "qwen/Qwen2.5-Coder-32B",
    "qwen/Qwen3-32B",
    "qwen/QWQ-32b-fp8",
    "qwen/Qwen3-4B-fp8",

    // Mistral
    "mistral/open-mistral-nemo",
    "mistral/devstral-small-fp16",
    "mistral/devstral-small-fp8",
    "mistral/mistral-small-24B-fp16",
    "mistral/mistral-small-24B-fp8",
    "mistral/codestral",

    // XAI (Grok)
    "xai/grok-4",
    "xai/grok-3",
    "xai/grok-3-mini",

    // Google (Gemini)
    "google/gemini-2.5-flash",
    "google/gemini-2.5-flash-light-preview",
    "google/gemma-3-27B",
    "google/gemini-2.5-pro",
    "google/gemma-2-9b-fp16",
    "google/gemini-2.5-flash-lite-preview",
    "google/gemini-2.0-flash",
    "google/gemini-2.0-flash-lite-preview",
    "google/gemini-2.0-flash-thinking",

    // Minimax
    "minimax/minimax-m1",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Keep the ID mostly as is, but maybe replace / with - for consistency in UI keys if needed?
    // Using slash in keys is fine usually, but let's stick to standard practice if any
    // Actually, DeepInfra keys were modified. Let's modify these too to match typical keys.
    const key = id.replace(/\//g, "-"); 
    models[key] = provider(id);
  });

  return models;
}
