// Define context limits in characters (approx 4 chars per token)
// These limits are based on provider constraints
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // DeepInfra / Groq / A4F
  "llama-3.3-70b-versatile": 100000,
  "google-gemma-2-9b-it": 30000,
  "google-gemma-2-12b-it": 30000,
  // LaoZhang Pro Models
  "claude-3-5-sonnet-latest": 500000,
  "claude-3-7-sonnet-latest": 500000,
  "claude-opus-4-1-20250805": 500000,
  "gemini-1.5-pro-latest": 800000,
  "gemini-2.5-pro": 800000,
  "gpt-5": 400000,
  "gpt-5-pro": 400000,
  "o1-pro": 400000,
  "o3-pro": 400000,
  "grok-3-latest": 400000,
  "grok-4-latest": 400000,
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
