import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";

/**
 * Google **Gemini Models Integration with Robust Key Rotation**
 *
 * This module handles:
 * 1. Loading multiple API keys.
 * 2. **Round-Robin Rotation**: Cycles through keys evenly.
 * 3. **Smart Retries**: If a key hits a Quote limit (429), it automatically retries with the next key.
 */
export function createGoogleModels() {
  const keysString = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  const apiKeys = keysString
    .split(",")
    .map((k) => k.replace(/['"\[\]]/g, "").trim()) // Remove quotes and brackets
    .filter((k) => k.length > 0);

  if (apiKeys.length === 0) {
    console.error(
      "❌ No Google API keys found. Please check GOOGLE_GENERATIVE_AI_API_KEY env var.",
    );
  } else {
    console.log(`✅ Loaded ${apiKeys.length} Google API keys for rotation.`);
  }

  // Helper to get a provider for a specific key
  const getProvider = (key: string) => {
    return createGoogleGenerativeAI({
      apiKey: key,
    });
  };

  /**
   * wraps the `doGenerate` or `doStream` call with retry logic.
   */
  const executeWithRetry = async <T>(
    modelId: string,
    operation: (model: LanguageModel) => Promise<T>,
  ): Promise<T> => {
    let lastError: any = null;

    // Try up to `apiKeys.length` times (once per key) starting from a random index
    // This ensures we cycle through ALL keys if needed before giving up.
    const startIndex = Math.floor(Math.random() * apiKeys.length);

    for (let i = 0; i < apiKeys.length; i++) {
      const keyIndex = (startIndex + i) % apiKeys.length;
      const key = apiKeys[keyIndex];

      try {
        const provider = getProvider(key);
        const model = provider(modelId);
        return await operation(model);
      } catch (error: any) {
        lastError = error;

        // Analyze Error
        const isQuotaError =
          error?.statusCode === 429 ||
          error?.message?.includes("quota") ||
          error?.message?.includes("429");

        if (isQuotaError) {
          console.warn(
            `⚠️ Google Key ${key.substring(0, 10)}... exhausted. Retrying with next key...`,
          );
          continue; // Try next key
        }

        // If it's not a quota error (e.g. invalid request), throw immediately
        throw error;
      }
    }

    // If we're here, all keys failed
    console.error("❌ All Google API keys exhausted or failed.");
    throw lastError || new Error("All Google API keys exhausted.");
  };

  // Custom Model Implementation ensuring V1 interface compliance
  const createModel = (modelId: string): LanguageModel => {
    // We create a mock LanguageModel that delegates 'doGenerate' and 'doStream'
    // This satisfies the AI SDK interface while allowing us to swap the underlying provider on retry.

    return {
      specificationVersion: "v2",
      provider: "google",
      modelId: modelId,
      defaultObjectGenerationMode: "json",

      doGenerate: async (options: any) => {
        return executeWithRetry(modelId, async (actualModel) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((actualModel as any).doGenerate) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (actualModel as any).doGenerate(options);
          }
          throw new Error("Model does not support doGenerate");
        });
      },

      doStream: async (options: any) => {
        return executeWithRetry(modelId, async (actualModel) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((actualModel as any).doStream) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (actualModel as any).doStream(options);
          }
          throw new Error("Model does not support doStream");
        });
      },
    } as unknown as LanguageModel; // Cast to LanguageModel to satisfy the strict type check in models.ts
  };

  // Top 20 Gemini Models
  const modelIds = [
    // Latest Flash 2.0 (Fast & Efficient)
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash-lite-preview-02-05",

    // Pro & High Intelligence
    "gemini-2.5-pro",
    "gemini-pro-latest",
    "gemini-exp-1206",

    // Legacy / Stable Fallbacks
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-flash-latest",

    // Next-Gen Previews (Gemini 3.0)
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",

    // Specialized 2.5 Series
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash-image", // Specialized image handling

    // Multimodal / Experimental
    "gemini-2.5-pro-preview-tts",
    "gemini-2.5-flash-preview-tts",
    "gemini-2.0-flash-exp-image-generation",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    models[id] = createModel(id);
  });

  return models;
}
