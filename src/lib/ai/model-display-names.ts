// Provider display order
export const PROVIDER_ORDER = [
  "google", // Google
  "anthropic", // Anthropic
  "mistral", // Mistral
  "openai", // OpenAI Pro (Groq)
  "meta", // Meta (Groq)
  "grok", // Grok
  "qwen", // Qwen (Groq)
  "moonshot", // Moonshot (Groq)
  "canopy", // Canopy (Groq)
  "deepseek", // DeepSeek (Groq)
  "microsoft", // Microsoft
  "tiiuae", // Tiiuae
  "defog", // Defog
  "allenai", // AllenAI
  "others", // Others
  "llm", // LLM Section
];

// Map backend provider names to display names
export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: "Google",
  anthropic: "Anthropic",
  mistral: "Mistral",
  openai: "OpenAI",
  meta: "Meta",
  grok: "Grok",
  qwen: "Qwen",
  moonshot: "Moonshot",
  canopy: "Canopy",
  deepseek: "DeepSeek",
  microsoft: "Microsoft",
  tiiuae: "Tiiuae",
  defog: "Defog",
  allenai: "AllenAI",
  others: "Others",
  llm: "LLM (Llama)",
};

// Map backend model names to display names (real names)
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Groq / A4F Aggregated Models
  "canopylabs-orpheus-v1-english": "Orpheus v1 English",
  "llama-3.1-8b-instant": "Llama 3.1 8B Instant",
  "llama-3.3-70b-versatile": "Llama 3.3 70B Versatile",
  "meta-llama-llama-4-scout-17b-16e-instruct": "Llama 4 Scout 17B",
  "meta-llama-llama-guard-4-12b": "Llama Guard 4 12B",
  "meta-llama-llama-prompt-guard-2-86m": "Llama Prompt Guard 86M",
  "moonshotai-kimi-k2-instruct": "Kimi K2 Instruct",
  "openai-gpt-oss-120b": "GPT-OSS 120B",
  "openai-gpt-oss-20b": "GPT-OSS 20B",
  "openai-gpt-oss-safeguard-20b": "GPT-OSS Safeguard 20B",
  "qwen-qwen3-32b": "Qwen 3 32B",
  "cf-google-gemma-7b-it": "Gemma 7B IT (Legacy)",
  "cf-google-gemma-2b-it-lora": "Gemma 2B LoRA (Legacy)",
  "mistralai-Mistral-7B-Instruct-v0.1": "Mistral 7B v0.1",
  "mistralai-Mistral-7B-Instruct-v0.2": "Mistral 7B v0.2",
  "mistralai-Mistral-Small-Instruct-2409": "Mistral Small 2409",
  "cf-mistralai-mistral-small-3.1-24b-instruct": "Mistral Small 3.1 (Legacy)",
  "cf-mistralai-mistral-7b-instruct-v0.1": "Mistral 7B (Legacy)",
  "cf-mistralai-mistral-7b-instruct-v0.2": "Mistral 7B v0.2 (Legacy)",
  "cf-mistralai-openhermes-2.5-mistral-7b": "OpenHermes 2.5 (Legacy)",
  "cf-qwen-qwen1.5-7b-chat-awq": "Qwen 1.5 7B",
  "cf-qwen-qwen1.5-14b-chat-awq": "Qwen 1.5 14B",
  "cf-qwen-qwen1.5-0.5b-chat": "Qwen 1.5 0.5B",
  "cf-qwen-qwen1.5-1.8b-chat": "Qwen 1.5 1.8B",
  "cf-deepseek-ai-deepseek-coder-6.7b-base": "DeepSeek Coder 6.7B (Legacy)",
  "cf-deepseek-ai-deepseek-coder-6.7b-instruct": "DS Coder Instruct (Legacy)",
  "cf-deepseek-ai-deepseek-math-7b-instruct": "DS Math 7B (Legacy)",
  "cf-microsoft-phi-2": "Phi-2 (Legacy)",
  "cf-tiiuae-falcon-7b-instruct": "Falcon 7B (Legacy)",
  "cf-defog-sqlcoder-7b-2": "SQLCoder 7B (Legacy)",
  "cf-huggingfacegi-zephyr-7b-beta": "Zephyr 7B Beta (Legacy)",
  "cf-intel-neural-chat-7b-v3-1": "Neural Chat 7B (Legacy)",
  "cf-nexusflow-starling-lm-7b-beta": "Starling 7B (Legacy)",
  "cf-openchat-openchat-3.5": "OpenChat 3.5 (Legacy)",
  "cf-una-cybertron-una-cybertron-7b-v2-bf16": "Cybertron 7B (Legacy)",
  "cf-tinyllama-tinyllama-1.1b-chat-v1.0": "TinyLlama 1.1B (Legacy)",
  "cf-llama-3-8b": "Llama 3 8B",
  "cf-llama-3.1-8b": "Llama 3.1 8B",
  "cf-llama-2-7b": "Llama 2 7B",
  "cf-llama-2-13b": "Llama 2 13B",
  "cf-llama-guard": "Llama Guard",
  "cf-llama-3-8b-awq": "Llama 3 8B AWQ",
  // Anthropic (Free Proxy)
  "claude-sonnet-4.5-proxy": "Claude 4.5 Sonnet (Free)",
  wormgpt: "WormGPT (Uncensored)",
  "zai-org-GLM-4.7": "GLM-4.7 (Reasoning)",
  "zai-org-GLM-4.5-air": "GLM-4.5 Air",
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
