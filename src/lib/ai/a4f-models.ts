import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * A4F (All For Free) Models Integration
 * Aggregates various high-performance models including LLMs, TTS, and ASR.
 */
export function createA4FModels() {
  const keys = [process.env.A4F_API_KEY || ""];

  const getRotatedKey = () => {
    const intervalMs = 2 * 60 * 1000; // 2 minutes
    const index = Math.floor(Date.now() / intervalMs) % keys.length;
    return keys[index];
  };

  const provider = createOpenAICompatible({
    name: "a4f",
    baseURL: process.env.A4F_BASE_URL || "https://api.groq.com/openai/v1",
    apiKey: keys[0], // Placeholder, rotated by fetch
    fetch: async (url, options) => {
      const key = getRotatedKey();
      const headers = new Headers(options?.headers);
      headers.set("Authorization", `Bearer ${key}`);
      return fetch(url, { ...options, headers });
    },
  });

  const modelIds = [
    "canopylabs/orpheus-v1-english",
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-guard-4-12b",
    "meta-llama/llama-prompt-guard-2-86m",
    "moonshotai/kimi-k2-instruct",
    "moonshotai/kimi-k2-instruct-0905",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-safeguard-20b",
    "qwen/qwen3-32b",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Standardize key name (replace / with -)
    const key = id.replace(/\//g, "-");
    models[key] = provider(id);
  });

  return models;
}
