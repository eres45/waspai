
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * CodexAPI Models Integration
 * API: https://allinoneapi.codexapi.workers.dev
 * Usage: Free, no auth required (or dummy key)
 */
export function createCodexModels() {
  const provider = createOpenAICompatible({
    name: "codex",
    apiKey: "none", // No API key required
    baseURL: "https://allinoneapi.codexapi.workers.dev/v1",
  });

  // Models fetched from /v1/models
  const modelIds = [
    "gpt-5.2",
    "gpt-5.1",
    "gpt-5",
    "moonshotai/kimi-k2.5",
    "anthropic/claude-sonnet-4",
    "mercury-coder",
    "Olmo-3.1-32B-Instruct",
    "gpt-4.1-mini",
    "chatgpt-4o-latest",
    "google/gemini-2.5-pro-preview-05-06",
    "x-ai/grok-4",
    "deepseek-ai/deepseek-v3.2",
    "deepseek-ai/deepseek-v3.1-terminus",
    "deepseek-ai/deepseek-R1-0528",
    "o1-preview",
    "o3-mini",
    "qwen/qwen3-coder-480b-a35b-instruct",
    "moonshotai/kimi-k2-thinking",
    "moonshotai/kimi-k2-instruct-0905",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "meta/llama-3.1-405b-instruct",
    "meta/llama-4-maverick-17b-128e-instruct",
    "meta/llama-4-scout-17b-16e-instruct",
    "meta-llama-3.3-70b-instruct",
    "meta-llama-3.1-8b-instruct",
    "google/gemma-3-27b-it",
    "nvidia/nemotron-3-nano-30b-a3b"
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Clean up ID for internal key if needed, or keep raw
    // We'll replace slashes with dashes for consistency in models.ts keys
    const key = id.replace(/\//g, "-");
    models[key] = provider(id);
  });

  return models;
}
