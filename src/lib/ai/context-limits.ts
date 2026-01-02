// Define context limits in characters (approx 4 chars per token)
// These limits are based on provider constraints (e.g. Pollinations free tier)
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Pollinations Models (Provider: "openai-free" / "google" / "mistral")

  // OpenAI Nano Models (Very strict limit ~7k chars)
  "openai-pollinations": 6000,
  "openai-fast-pollinations": 6000,

  // Larger OpenAI Models (Standard free tier limits)
  "openai-large-pollinations": 50000,
  "openai-reasoning-pollinations": 50000,

  // Gemini Models (Flash has large context, but Pollinations might limit)
  gemini: 100000, // Gemini 2.5 Flash
  "gemini-search": 30000,

  // Mistral
  mistral: 30000,
};

export const DEFAULT_CONTEXT_LIMIT = 20000;

export function getModelContextLimit(modelId: string): number {
  return MODEL_CONTEXT_LIMITS[modelId] || DEFAULT_CONTEXT_LIMIT;
}

export function truncateTextToLimit(text: string, modelId: string): string {
  const limit = getModelContextLimit(modelId);
  if (text.length <= limit) return text;

  const truncated = text.slice(0, limit);
  return (
    truncated +
    `\n\n[System Note: Content truncated from ${text.length} to ${limit} characters due to model limits.]`
  );
}
