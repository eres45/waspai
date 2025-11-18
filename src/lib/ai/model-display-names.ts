// Provider display order
export const PROVIDER_ORDER = [
  "openai-free", // OpenAI
  "xai", // Xai
  "anthropic", // Anthropic
  "deepseek", // DeepSeek
  "meta", // Meta
  "google", // Google
  "mistral", // Mistral
  "gpt-oss", // GPT-OSS
  "grok", // Grok
  "qwen", // QWEN
  "gemma", // Gemma
  "gemini-dark", // Gemini Dark
  "kiwi-ai", // Kiwi AI
];

// Map backend provider names to display names
export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  "openai-free": "OpenAI",
  xai: "Xai",
  anthropic: "Anthropic",
  deepseek: "DeepSeek",
  meta: "Meta",
  google: "Google",
  mistral: "Mistral",
  "gpt-oss": "GPT-OSS",
  grok: "Grok",
  qwen: "QWEN",
  gemma: "Gemma",
  "gemini-dark": "Gemini Dark",
  "kiwi-ai": "Kiwi AI",
};

// Map backend model names to display names (real names)
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Pollinations Gemini models
  gemini: "Gemini 2.5 Flash Lite",
  "gemini-search": "Gemini 2.5 Flash Lite with Search",
  // Pollinations Mistral
  mistral: "Mistral Small 3.2 24B",
  // Pollinations OpenAI models
  "openai-pollinations": "ChatGPT GPT-5 Nano",
  "openai-fast-pollinations": "ChatGPT GPT-4.1 Nano",
  "openai-large-pollinations": "ChatGPT GPT-4.1",
  "openai-reasoning-pollinations": "ChatGPT o4 Mini",
  // OpenAI Free models
  "gpt-4": "GPT-4",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4.1": "GPT-4.1",
  "gpt-4.1-mini": "GPT-4.1 Mini",
  "gpt-4.1-nano": "GPT-4.1 Nano",
  o1: "o1",
  o3: "o3",
  "o3-mini": "o3 Mini",
  "o4-mini": "o4 Mini",
  "gpt-5": "GPT-5",
  "gpt-5-mini": "GPT-5 Mini",
  "gpt-5-nano": "GPT-5 Nano",
  // Gemini Dark models
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "gemini-2.5-deep-search": "Gemini 2.5 Deep Search",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  // QWEN models
  "qwen3-coder-plus": "QWEN3 Coder Plus",
  "qwen3-72b-chat": "QWEN3 72B Chat",
  "qwen3-72b-coder": "QWEN3 72B Coder",
  "qwen3-72b-math": "QWEN3 72B Math",
  "qwen2.5-72b-chat": "QWEN2.5 72B Chat",
  "qwen2.5-72b-coder": "QWEN2.5 72B Coder",
  "qwen2.5-72b-math": "QWEN2.5 72B Math",
  "qwen2.5-72b-instruct": "QWEN2.5 72B Instruct",
  "qwen2.5-72b-coder-chat": "QWEN2.5 72B Coder Chat",
  "qwen2.5-72b-math-chat": "QWEN2.5 72B Math Chat",
  // DeepSeek models
  "deepseek-v3.3": "DeepSeek v3.3",
  "deepseek-r1": "DeepSeek r1",
  // Gemma models
  "gemma-27b": "Gemma 27B",
  "gemma-12b": "Gemma 12B",
  "gemma-4b": "Gemma 4B",
  // GPT-OSS models
  "gpt-oss-120b": "GPT-OSS 120B",
  "gpt-4-117b": "GPT-4 117B",
  // Grok models
  "grok-4": "Grok-4",
  // Kiwi AI models
  "dark-code-76": "Kiwi AI Dark Code 76",
  // Sonnet Free models (Anthropic Claude)
  "sonnet-reasoning": "Claude 3.5 Sonnet Reasoning",
  "sonnet-chat": "Claude 3.5 Sonnet",
  "sonnet-coder": "Claude 3.5 Sonnet Coder",
  "sonnet-math": "Claude 3.5 Sonnet Math",
  // DeepSeek v1 model
  "deepseek-chat": "DeepSeek Chat",
  // WormGPT model
  "wormgpt-ai": "WormGPT AI",
};

// Create reverse mapping from display names to backend names
export const createReverseModelMapping = (): {
  models: Record<string, string>;
  providers: Record<string, string>;
} => {
  const modelReverseMapping: Record<string, string> = {};
  Object.entries(MODEL_DISPLAY_NAMES).forEach(([backendName, displayName]) => {
    modelReverseMapping[displayName] = backendName;
  });

  const providerReverseMapping: Record<string, string> = {};
  Object.entries(PROVIDER_DISPLAY_NAMES).forEach(
    ([backendName, displayName]) => {
      providerReverseMapping[displayName] = backendName;
    },
  );

  return {
    models: modelReverseMapping,
    providers: providerReverseMapping,
  };
};
