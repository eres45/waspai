import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";

/**
 * Google Gemini Provider with Exhaustive Key Rotation
 *
 * This implementation creates a fresh provider for EACH request,
 * ensuring no key is cached and retry logic works correctly.
 */
export function createGoogleModels() {
  const keysString = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  // Split by comma, newline, or semicolon
  const apiKeys = keysString
    .split(/,|\n|;/)
    .map((k) => k.replace(/['"\[\]]/g, "").trim())
    .filter((k) => k.length >= 10); // Valid keys are at least 10 chars

  if (apiKeys.length === 0) {
    console.error("❌ [Google] No API keys found!");
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  console.log(`✅ [Google] Loaded ${apiKeys.length} keys for rotation.`);

  /**
   * Try a model operation with exhaustive key rotation
   */
  const executeWithKeyRotation = async <T>(
    modelId: string,
    operation: (model: LanguageModel) => Promise<T>,
  ): Promise<T> => {
    const startIndex = Math.floor(Math.random() * apiKeys.length);
    let lastError: any = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const keyIndex = (startIndex + i) % apiKeys.length;
      const key = apiKeys[keyIndex];

      try {
        const provider = createGoogleGenerativeAI({ apiKey: key });
        const model = provider(modelId);

        console.log(
          `🔑 [Google] Try ${i + 1}/${apiKeys.length}: Key ${key.substring(0, 8)}...`,
        );
        const result = await operation(model);
        console.log(`✅ [Google] Success with key ${key.substring(0, 8)}...`);
        return result;
      } catch (error: any) {
        lastError = error;
        const msg = (error?.message || "").toLowerCase();
        const status = error?.statusCode;

        console.error(
          `❌ [Google] Key ${key.substring(0, 8)}... failed: ${status} - ${error?.message}`,
        );

        // Retriable errors: Quota (429) or Invalid/Leaked keys (400/401/403)
        const isRetriable =
          status === 429 ||
          status === 400 ||
          status === 401 ||
          status === 403 ||
          msg.includes("quota") ||
          msg.includes("leaked") ||
          msg.includes("expired") ||
          msg.includes("invalid") ||
          msg.includes("not valid");

        if (isRetriable) {
          console.warn(
            `⚠️  [Google] Rotating to next key (${isRetriable ? "retriable error" : ""})`,
          );
          continue; // Try next key
        }

        // Non-retriable error (e.g., safety filter, bad prompt)
        console.error(`🚫 [Google] Non-retriable error, stopping rotation.`);
        throw error;
      }
    }

    console.error(`💥 [Google] All ${apiKeys.length} keys exhausted!`);
    throw lastError || new Error("All Google API keys failed");
  };

  /**
   * Create a proxy model that delegates to fresh providers with rotation
   */
  const createRotatingModel = (modelId: string): LanguageModel => {
    // Get a template model to extract static properties
    const template = createGoogleGenerativeAI({ apiKey: "TEMP" })(modelId);

    // Create a fully custom model that uses rotation for every request
    return {
      specificationVersion: "v2",
      modelId: modelId,
      // @ts-expect-error - Internal AI SDK properties
      provider: template.provider || "google",
      // @ts-expect-error - Internal AI SDK config
      config: template.config,
      // @ts-expect-error - generateId might exist
      generateId: template.generateId,
      defaultObjectGenerationMode: "json",

      doGenerate: (options: any) => {
        return executeWithKeyRotation(modelId, (model) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (model as any).doGenerate(options);
        });
      },

      doStream: (options: any) => {
        return executeWithKeyRotation(modelId, (model) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (model as any).doStream(options);
        });
      },
    } as unknown as LanguageModel;
  };

  // Model IDs
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
    models[id] = createRotatingModel(id);
  });

  return models;
}
