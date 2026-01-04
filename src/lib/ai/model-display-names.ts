// Provider display order
export const PROVIDER_ORDER = [
  "google", // Google
  "mistral", // Mistral
  "openai", // OpenAI Pro (Groq)
  "meta", // Meta (Groq)
  "qwen", // Qwen (Groq)
  "moonshot", // Moonshot (Groq)
  "canopy", // Canopy (Groq)
  "deepseek", // DeepSeek (Groq)
  "minimax", // MiniMax (Groq)
  "microsoft", // Microsoft
  "tiiuae", // Tiiuae
  "defog", // Defog
  "others", // Others
  "llm", // LLM Section
];

// Map backend provider names to display names
export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: "Google",
  mistral: "Mistral",
  openai: "OpenAI",
  meta: "Meta",
  qwen: "Qwen",
  moonshot: "Moonshot",
  canopy: "Canopy",
  deepseek: "DeepSeek",
  minimax: "MiniMax",
  microsoft: "Microsoft",
  tiiuae: "Tiiuae",
  defog: "Defog",
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
  "moonshotai-kimi-k2-instruct-0905": "Kimi K2 Instruct (09/05)",
  "openai-gpt-oss-120b": "GPT-OSS 120B",
  "openai-gpt-oss-20b": "GPT-OSS 20B",
  "openai-gpt-oss-safeguard-20b": "GPT-OSS Safeguard 20B",
  "qwen-qwen3-32b": "Qwen 3 32B",
  // Google Gemini Models
  "gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini-2.0-flash-001": "Gemini 2.0 Flash (Stable)",
  "gemini-2.0-flash-exp": "Gemini 2.0 Flash (Experimental)",
  "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
  "gemini-2.0-flash-lite-001": "Gemini 2.0 Flash Lite (Stable)",
  "gemini-2.0-flash-lite-preview-02-05": "Gemini 2.0 Flash Lite (Preview)",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "gemini-pro-latest": "Gemini Pro (Latest)",
  "gemini-exp-1206": "Gemini Experimental (1206)",
  "gemini-1.5-pro": "Gemini 1.5 Pro",
  "gemini-1.5-flash": "Gemini 1.5 Flash",
  "gemini-flash-latest": "Gemini Flash (Latest)",
  "gemini-3-pro-preview": "Gemini 3.0 Pro (Preview)",
  "gemini-3-flash-preview": "Gemini 3.0 Flash (Preview)",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
  "gemini-2.5-flash-image": "Gemini 2.5 Flash (Image Optimized)",
  "gemini-2.5-pro-preview-tts": "Gemini 2.5 Pro (TTS)",
  "gemini-2.5-flash-preview-tts": "Gemini 2.5 Flash (TTS)",
  "gemini-2.0-flash-exp-image-generation": "Gemini 2.0 Flash (Image Gen)",

  // A4F / DeepInfra Mappings
  "google-gemma-2-9b-it": "Gemma 2 9B",
  "google-gemma-2-12b-it": "Gemma 2 12B",
  "cf-google-gemma-7b-it": "Gemma 7B IT (Legacy)",
  "cf-google-gemma-2b-it-lora": "Gemma 2B LoRA (Legacy)",
  "mistralai-Mistral-7B-Instruct-v0.1": "Mistral 7B v0.1",
  "mistralai-Mistral-7B-Instruct-v0.2": "Mistral 7B v0.2",
  "mistralai-Mistral-Small-Instruct-2409": "Mistral Small 2409",
  "cf-mistralai-mistral-small-3.1-24b-instruct": "Mistral Small 3.1 (Legacy)",
  "cf-mistralai-mistral-7b-instruct-v0.1": "Mistral 7B (Legacy)",
  "cf-mistralai-mistral-7b-instruct-v0.2": "Mistral 7B v0.2 (Legacy)",
  "cf-mistralai-openhermes-2.5-mistral-7b": "OpenHermes 2.5 (Legacy)",
  "Qwen-Qwen2-7B-Instruct": "Qwen 2 7B",
  "Qwen-Qwen3-Coder-480B-A35B-Instruct-Turbo": "Qwen 3 Coder",
  "cf-qwen-qwen1.5-7b-chat-awq": "Qwen 1.5 7B",
  "cf-qwen-qwen1.5-14b-chat-awq": "Qwen 1.5 14B",
  "cf-qwen-qwen1.5-0.5b-chat": "Qwen 1.5 0.5B",
  "cf-qwen-qwen1.5-1.8b-chat": "Qwen 1.5 1.8B",
  "moonshotai-Kimi-K2-Thinking": "Kimi K2 Thinking",
  "deepseek-ai-DeepSeek-V3.1-Terminus": "DeepSeek V3.1",
  "deepseek-ai-DeepSeek-R1-Turbo": "DeepSeek R1 Turbo",
  "deepseek-ai-DeepSeek-R1": "DeepSeek R1",
  "cf-deepseek-ai-deepseek-coder-6.7b-base": "DeepSeek Coder 6.7B (Legacy)",
  "cf-deepseek-ai-deepseek-coder-6.7b-instruct": "DS Coder Instruct (Legacy)",
  "cf-deepseek-ai-deepseek-math-7b-instruct": "DS Math 7B (Legacy)",
  "MiniMaxAI-MiniMax-M2": "MiniMax M2",
  "cf-microsoft-phi-2": "Phi-2 (Legacy)",
  "cf-tiiuae-falcon-7b-instruct": "Falcon 7B (Legacy)",
  "cf-defog-sqlcoder-7b-2": "SQLCoder 7B (Legacy)",
  "cf-huggingfacegi-zephyr-7b-beta": "Zephyr 7B Beta (Legacy)",
  "cf-intel-neural-chat-7b-v3-1": "Neural Chat 7B (Legacy)",
  "cf-nexusflow-starling-lm-7b-beta": "Starling 7B (Legacy)",
  "cf-openchat-openchat-3.5": "OpenChat 3.5 (Legacy)",
  "cf-una-cybertron-una-cybertron-7b-v2-bf16": "Cybertron 7B (Legacy)",
  "cf-tinyllama-tinyllama-1.1b-chat-v1.0": "TinyLlama 1.1B (Legacy)",
  // TypeGPT Models
  "deepseek-ai-deepseek-r1-distill-qwen-32b": "DeepSeek R1 Distill Qwen 32B",
  "google-gemma-3-27b-it": "Gemma 3 27B",
  "LGAI-EXAONE-K-EXAONE-236B-A23B": "EXAONE 236B",
  "microsoft-phi-4-multimodal-instruct": "Phi-4 Multimodal",
  "mistralai-Devstral-Small-2505": "Devstral Small 24B",
  "mistralai-Mistral-Small-3.1-24B-Instruct-2503":
    "Mistral Small 3.1 24B (2503)",
  "Qwen-Qwen3-235B-A22B-Instruct-2507": "Qwen 3 235B",
  "qwen-qwen3-next-80b-a3b-instruct": "Qwen 3 Next 80B Instruct",
  "qwen-qwen3-next-80b-a3b-thinking": "Qwen 3 Next 80B Thinking",
  "zai-org-GLM-4.6": "GLM-4.6",
  "zai-org-GLM-4.7": "GLM-4.7",
  "Llama-3.3-70B-DeepInfra": "Llama 3.3 70B",
  "Llama-3.1-8B-DeepInfra": "Llama 3.1 8B",
  "Llama-3.2-3B-DeepInfra": "Llama 3.2 3B",
  "Llama-3.2-1B-DeepInfra": "Llama 3.2 1B",
  "Llama-3-8B-DeepInfra": "Llama 3 8B",
  "cf-llama-3-8b": "Llama 3 8B (Legacy)",
  "cf-llama-3.1-8b": "Llama 3.1 8B (Legacy)",
  "cf-llama-2-7b": "Llama 2 7B (Legacy)",
  "cf-llama-2-13b": "Llama 2 13B (Legacy)",
  "cf-llama-guard": "Llama Guard (Legacy)",
  "cf-llama-3-8b-awq": "Llama 3 8B AWQ (Legacy)",
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
