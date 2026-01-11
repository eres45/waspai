import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * DeepInfra Models Integration
 * API: https://api.deepinfra.com/v1
 */
export function createDeepInfraModels() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  ];

  const getRandomIP = () => {
    return Array.from(
      { length: 4 },
      () => Math.floor(Math.random() * 255) + 1,
    ).join(".");
  };

  const provider = createOpenAICompatible({
    name: "deepinfra",
    apiKey: process.env.DEEPINFRA_API_KEY || "none",
    baseURL: "https://api.deepinfra.com/v1",
    fetch: async (url, options) => {
      // 1. Try with spoofed headers (Free Tier)
      const spoofHeaders = new Headers(options?.headers);
      spoofHeaders.set("Accept", "text/event-stream");
      spoofHeaders.set("Origin", "https://deepinfra.com");
      spoofHeaders.set("Referer", "https://deepinfra.com/");
      spoofHeaders.set(
        "User-Agent",
        userAgents[Math.floor(Math.random() * userAgents.length)],
      );
      spoofHeaders.set("X-Deepinfra-Source", "web-page");
      spoofHeaders.set("X-Forwarded-For", getRandomIP());
      spoofHeaders.delete("Authorization"); // Crucial for spoofing

      try {
        const response = await fetch(url, {
          ...options,
          headers: spoofHeaders,
        });
        if (response.ok) return response;

        // If 401/403 and we have an API key, fallback to official auth
        if (
          (response.status === 401 || response.status === 403) &&
          process.env.DEEPINFRA_API_KEY
        ) {
          console.log("[DeepInfra] Spoofing failed, falling back to API key");
          return fetch(url, options); // Uses default headers with Authorization
        }

        return response;
      } catch (e) {
        // Fallback on network error if key exists
        if (process.env.DEEPINFRA_API_KEY) {
          return fetch(url, options);
        }
        throw e;
      }
    },
  });

  const modelIds = [
    "deepseek-ai/DeepSeek-V3.1-Terminus",
    "deepseek-ai/DeepSeek-R1-Turbo",
    "deepseek-ai/DeepSeek-R1",
    "moonshotai/Kimi-K2-Thinking",
    "google/gemma-2-9b-it",
    "google/gemma-2-12b-it",
    "Qwen/Qwen2-7B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.1",
    "mistralai/Mistral-7B-Instruct-v0.2",
    "mistralai/Mistral-Small-Instruct-2409",
    "MiniMaxAI/MiniMax-M2",
    "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
    "meta-llama/Llama-3.3-70B-Instruct",
    "meta-llama/Llama-3.1-8B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "meta-llama/Llama-3.2-1B-Instruct",
    "meta-llama/Llama-3-8B-Instruct",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Standardize key name (replace / with -)
    const key = id.replace(/\//g, "-");
    models[key] = provider(id);
  });

  return models;
}
