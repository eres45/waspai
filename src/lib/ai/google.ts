import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";

/**
 * Google Gemini Models Integration with Key Rotation
 *
 * This module handles:
 * 1. Loading multiple API keys from environment variables
 * 2. Rotating keys randomly for each request to distribute load
 * 3. Defining the latest Gemini models
 */
export function createGoogleModels() {
  const keysString = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  const apiKeys = keysString
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (apiKeys.length === 0) {
    console.error(
      "❌ No Google API keys found. Please check GOOGLE_GENERATIVE_AI_API_KEY env var.",
    );
  } else {
    console.log(`✅ Loaded ${apiKeys.length} Google API keys for rotation.`);
  }

  // Key rotation helper
  const getProvider = () => {
    if (apiKeys.length === 0) {
      throw new Error("No Google API keys available.");
    }
    const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    return createGoogleGenerativeAI({
      apiKey: randomKey,
    });
  };

  // Helper to create a model instance with a rotated key
  const createModel = (modelId: string) => {
    // Return a Proxy that intercepts all property access
    return new Proxy({} as any, {
      get(_target, prop, _receiver) {
        // Static properties
        if (prop === "provider") return "google";
        if (prop === "modelId") return modelId;

        // Dynamic properties: create a fresh provider instance for each access
        const provider = getProvider();
        const model = provider(modelId);
        return Reflect.get(model, prop);
      },
    });
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
    // Create a clean key for internal use
    const key = id;
    models[key] = createModel(id);
  });

  return models;
}
