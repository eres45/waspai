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
      // Helper to generate headers
      const getSpoofHeaders = () => {
        const headers = new Headers(options?.headers);
        headers.set("Accept", "*/*");
        headers.set("Accept-Language", "en-US,en;q=0.9");
        headers.set("Origin", "https://deepinfra.com");
        headers.set("Referer", "https://deepinfra.com/");
        headers.set(
          "User-Agent",
          userAgents[Math.floor(Math.random() * userAgents.length)],
        );
        headers.set("X-Deepinfra-Source", "web-page");
        headers.set("X-Forwarded-For", getRandomIP());
        headers.set("Sec-Fetch-Dest", "empty");
        headers.set("Sec-Fetch-Mode", "cors");
        headers.set("Sec-Fetch-Site", "same-site");
        headers.delete("Authorization"); // Crucial for spoofing
        return headers;
      };

      // 1. Try with spoofed headers (Retry up to 3 times with different identity)
      for (let i = 0; i < 3; i++) {
        try {
          const spoofHeaders = getSpoofHeaders();
          const response = await fetch(url, {
            ...options,
            headers: spoofHeaders,
          });

          if (response.ok) return response;

          // If not 401/403, it might be a real error (like 404 model not found), so return it
          // We don't retry 404s
          if (
            response.status !== 401 &&
            response.status !== 403 &&
            response.status !== 429
          ) {
            return response;
          }

          // If 403 or 429, continue to next iteration (try new IP/UA)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 500 + 200),
          );
        } catch (_e) {
          // Network errors, continue to retry
        }
      }

      // 2. If all spoof attempts fail, fallback to API key
      if (process.env.DEEPINFRA_API_KEY) {
        console.log(
          "[DeepInfra] All spoofing attempts failed, falling back to API key",
        );
        return fetch(url, options); // Uses default headers with Authorization
      }

      // If no key and all failed, try one last time with spoof headers to return the error
      return fetch(url, { ...options, headers: getSpoofHeaders() });
    },
  });

  const modelIds = [
    "deepseek-ai/DeepSeek-R1-0528-Turbo",
    "deepseek-ai/DeepSeek-V3.1",
    "deepseek-ai/DeepSeek-V3.1-Terminus",
    "deepseek-ai/DeepSeek-V3",
    "deepseek-ai/DeepSeek-V3-0324",
    "deepseek-ai/DeepSeek-V3.2",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    "deepseek-ai/DeepSeek-R1-0528",
    "deepseek-ai/DeepSeek-OCR",
    "moonshotai/Kimi-K2-Instruct-0905",
    "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
    "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    "meta-llama/Llama-Guard-4-12B",
    "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
    "Qwen/Qwen3-235B-A22B-Instruct-2507",
    "Qwen/Qwen3-Next-80B-A3B-Instruct",
    "google/gemma-2-9b-it",
    "MiniMaxAI/MiniMax-M2",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Standardize key name (replace / with -)
    const key = id.replace(/\//g, "-");
    models[key] = provider(id);
  });

  return models;
}
