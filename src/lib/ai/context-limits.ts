// Define context limits in characters (approx 4 chars per token)
// These limits are based on provider constraints
// NOTE: These are CONSERVATIVE estimates to prevent context overflow while preserving history
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Small / limited models
  "google-gemma-2-9b-it": 100_000,
  "google-gemma-2-12b-it": 100_000,
  "meta-llama-3.2-1b-instruct": 60_000,
  "meta-llama-3.2-3b-instruct": 60_000,
  "microsoft-phi-3-mini-4k-instruct": 16_000,
  "microsoft-phi-3-mini-128k-instruct": 500_000,
  // Groq models
  "llama-3.3-70b-versatile": 100_000,
  "llama-3.1-8b-instant": 100_000,
};

// Default: 200K chars (~50K tokens). Most modern LLMs support 128K+ token windows.
// Keeping it at 200K (not unlimited) prevents accidentally sending MB of data to smaller models.
export const DEFAULT_CONTEXT_LIMIT = 200_000;

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
