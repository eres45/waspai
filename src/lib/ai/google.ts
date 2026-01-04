import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";

/**
 * Google **Gemini Models Integration with Robust Key Rotation**
 *
 * Optimized for AI SDK 5 (v2 Specification)
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
    console.log(
      `✅ Google Provider: Loaded ${apiKeys.length} keys for rotation.`,
    );
  }

  /**
   * wraps a call with exhaustive retry logic across ALL keys.
   */
  const executeWithRetry = async <T>(
    modelId: string,
    operation: (model: LanguageModel) => Promise<T>,
  ): Promise<T> => {
    let lastError: any = null;

    // Shuffle or random start to distribute load among keys
    const startIndex = Math.floor(Math.random() * apiKeys.length);

    for (let i = 0; i < apiKeys.length; i++) {
      const keyIndex = (startIndex + i) % apiKeys.length;
      const key = apiKeys[keyIndex];

      try {
        const provider = createGoogleGenerativeAI({ apiKey: key });
        const model = provider(modelId);
        return await operation(model);
      } catch (error: any) {
        lastError = error;

        const errorMessage = error?.message?.toLowerCase() || "";
        const statusCode = error?.statusCode;

        // Retriable Errors: Quota (429) or Key Issues (Leaked/Invalid)
        const isQuotaError =
          statusCode === 429 ||
          errorMessage.includes("quota") ||
          errorMessage.includes("429");
        const isKeyError =
          errorMessage.includes("leaked") ||
          errorMessage.includes("valid api key") ||
          errorMessage.includes("expired");

        if (isQuotaError || isKeyError) {
          console.warn(
            `[Google Rotation] Key ${keyIndex + 1}/${apiKeys.length} failed (${isQuotaError ? "Quota" : "Leak"}). trying next...`,
          );
          continue;
        }

        // Normal errors (like safety filters or invalid prompts) should not retry keys
        throw error;
      }
    }

    throw lastError || new Error("All Google API keys exhausted.");
  };

  const createModel = (modelId: string): LanguageModel => {
    // Create a base model to inherit all internal configurations and properties
    const dummyProvider = createGoogleGenerativeAI({
      apiKey: apiKeys[0] || "dummy",
    });
    const baseModel = dummyProvider(modelId);

    // In AI SDK 5, we must return an object that adheres to the LanguageModelV3 interface (specificationVersion: 'v2')
    // The easiest way is to spread the base model and override doGenerate/doStream.
    return {
      ...baseModel,
      specificationVersion: "v2",
      doGenerate: async (options: any) => {
        return executeWithRetry(modelId, (actualModel) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (actualModel as any).doGenerate(options);
        });
      },
      doStream: async (options: any) => {
        return executeWithRetry(modelId, (actualModel) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (actualModel as any).doStream(options);
        });
      },
    } as unknown as LanguageModel;
  };

  // Top 20 Gemini Models
  const modelIds = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.5-pro",
    "gemini-pro-latest",
    "gemini-exp-1206",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash-image",
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
