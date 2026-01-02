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
    apiKey: "none", // Placeholder, we will override headers in fetch
    baseURL: "https://api.deepinfra.com/v1",
    fetch: async (url, options) => {
      const headers = new Headers(options?.headers);

      // Inject browser-mocking headers from user docs
      headers.set("Accept", "text/event-stream");
      headers.set("Origin", "https://deepinfra.com");
      headers.set("Referer", "https://deepinfra.com/");
      headers.set(
        "User-Agent",
        userAgents[Math.floor(Math.random() * userAgents.length)],
      );
      headers.set("X-Deepinfra-Source", "web-page");
      headers.set("X-Forwarded-For", getRandomIP());
      headers.set("Accept-Language", "en-US,en;q=0.9");
      headers.set("Accept-Encoding", "gzip, deflate, br");
      headers.set("Connection", "keep-alive");
      headers.set("Sec-Fetch-Dest", "empty");
      headers.set("Sec-Fetch-Mode", "cors");
      headers.set("Sec-Fetch-Site", "same-site");

      // Remove Authorization header as it's not needed for web-page source
      headers.delete("Authorization");

      return fetch(url, { ...options, headers });
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
