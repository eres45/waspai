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
  "minimax", // MiniMax (Groq)
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
  minimax: "MiniMax",
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
  "meta-llama-llama-4-scout-17b-16e-instruct": "Llama 4 Scout 17B (Free)",
  "meta-llama-llama-guard-4-12b": "Llama Guard 4 12B (Free)",
  "meta-llama-llama-prompt-guard-2-86m": "Llama Prompt Guard 86M (Free)",
  "moonshotai-kimi-k2-instruct": "Kimi K2 Instruct (Free)",
  "moonshotai-kimi-k2-instruct-0905": "Kimi K2 Instruct (09/05) (Free)",
  "openai-gpt-oss-120b": "GPT-OSS 120B (Free)",
  "openai-gpt-oss-20b": "GPT-OSS 20B (Free)",
  "openai-gpt-oss-safeguard-20b": "GPT-OSS Safeguard 20B (Free)",
  "qwen-qwen3-32b": "Qwen 3 32B (Free)",
  "google-gemma-2-9b-it": "Gemma 2 9B (Free)",
  "google-gemma-2-12b-it": "Gemma 2 12B (Free)",
  "google-gemma-3-27b-it": "Gemma 3 27B (Free)",
  "gemini-1.5-pro-latest": "Gemini 1.5 Pro",
  "gemini-2.0-flash-001": "Gemini 2.0 Flash",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "gemini-2.5-pro-thinking": "Gemini 2.5 Pro (Thinking)",
  "gemini-3-flash-preview": "Gemini 3 Flash",
  "gemini-3-pro-preview": "Gemini 3 Pro",
  "gemini-3-pro-preview-thinking": "Gemini 3 Pro (Thinking)",
  "cf-google-gemma-7b-it": "Gemma 7B IT (Legacy)",
  "cf-google-gemma-2b-it-lora": "Gemma 2B LoRA (Legacy)",
  "mistralai-Mistral-7B-Instruct-v0.1": "Mistral 7B v0.1",
  "mistralai-Mistral-7B-Instruct-v0.2": "Mistral 7B v0.2",
  "mistralai-Mistral-Small-Instruct-2409": "Mistral Small 2409",
  "cf-mistralai-mistral-small-3.1-24b-instruct": "Mistral Small 3.1 (Legacy)",
  "cf-mistralai-mistral-7b-instruct-v0.1": "Mistral 7B (Legacy)",
  "cf-mistralai-mistral-7b-instruct-v0.2": "Mistral 7B v0.2 (Legacy)",
  "cf-mistralai-openhermes-2.5-mistral-7b": "OpenHermes 2.5 (Legacy)",
  "Qwen-Qwen2-7B-Instruct": "Qwen 2 7B (Free)",
  "Qwen-Qwen3-Coder-480B-A35B-Instruct-Turbo": "Qwen 3 Coder (Free)",
  "cf-qwen-qwen1.5-7b-chat-awq": "Qwen 1.5 7B (Free)",
  "cf-qwen-qwen1.5-14b-chat-awq": "Qwen 1.5 14B (Free)",
  "cf-qwen-qwen1.5-0.5b-chat": "Qwen 1.5 0.5B (Free)",
  "cf-qwen-qwen1.5-1.8b-chat": "Qwen 1.5 1.8B (Free)",
  "moonshotai-Kimi-K2-Thinking": "Kimi K2 Thinking (Free)",
  "deepseek-ai-DeepSeek-V3.1-Terminus": "DeepSeek V3.1 (Free)",
  "deepseek-ai-DeepSeek-R1-Turbo": "DeepSeek R1 Turbo (Free)",
  "deepseek-ai-DeepSeek-R1": "DeepSeek R1 (Free)",
  "cf-deepseek-ai-deepseek-coder-6.7b-base": "DeepSeek Coder 6.7B (Legacy)",
  "cf-deepseek-ai-deepseek-coder-6.7b-instruct": "DS Coder Instruct (Legacy)",
  "cf-deepseek-ai-deepseek-math-7b-instruct": "DS Math 7B (Legacy) (Free)",
  "MiniMaxAI-MiniMax-M2": "MiniMax M2 (Free)",
  "cf-microsoft-phi-2": "Phi-2 (Legacy) (Free)",
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
  "LGAI-EXAONE-K-EXAONE-236B-A23B": "EXAONE 236B",
  "microsoft-phi-4-multimodal-instruct": "Phi-4 Multimodal",
  "mistralai-Devstral-Small-2505": "Devstral Small 24B",
  "mistralai-Mistral-Small-3.1-24B-Instruct-2503":
    "Mistral Small 3.1 24B (2503) (Free)",
  "Qwen-Qwen3-235B-A22B-Instruct-2507": "Qwen 3 235B (Free)",
  "qwen-qwen3-next-80b-a3b-instruct": "Qwen 3 Next 80B Instruct (Free)",
  "qwen-qwen3-next-80b-a3b-thinking": "Qwen 3 Next 80B Thinking (Free)",
  "zai-org-GLM-4.6": "GLM-4.6",
  "allenai-OLMo-2-0325-32B-Instruct": "OLMo 2 32B Instruct (Free)",
  "Llama-3.3-70B-DeepInfra": "Llama 3.3 70B (Free)",
  "Llama-3.1-8B-DeepInfra": "Llama 3.1 8B (Free)",
  "Llama-3.2-3B-DeepInfra": "Llama 3.2 3B (Free)",
  "Llama-3.2-1B-DeepInfra": "Llama 3.2 1B (Free)",
  "Llama-3-8B-DeepInfra": "Llama 3 8B (Free)",
  "cf-llama-3-8b": "Llama 3 8B (Free)",
  "cf-llama-3.1-8b": "Llama 3.1 8B (Free)",
  "cf-llama-2-7b": "Llama 2 7B (Free)",
  "cf-llama-2-13b": "Llama 2 13B (Free)",
  "cf-llama-guard": "Llama Guard (Free)",
  "cf-llama-3-8b-awq": "Llama 3 8B AWQ (Free)",
  // Anthropic
  "claude-3-5-haiku-latest": "Claude 3.5 Haiku",
  "claude-3-5-sonnet-latest": "Claude 3.5 Sonnet",
  "claude-3-7-sonnet-latest": "Claude 3.7 Sonnet",
  "claude-3-7-sonnet-20250219-thinking": "Claude 3.7 Sonnet (Thinking)",
  "claude-3-opus-20240229": "Claude 3 Opus",
  "claude-haiku-4-5-20251001": "Claude 4.5 Haiku",
  "claude-opus-4-20250514": "Claude 4 Opus (Early)",
  "claude-opus-4-1-20250805": "Claude 4.1 Opus",
  "claude-opus-4-5-20251101": "Claude 4.5 Opus",
  "claude-sonnet-4-20250514": "Claude 4 Sonnet",
  "claude-sonnet-4-5-20250929": "Claude 4.5 Sonnet",
  "cld-3-7-sonnet-20250219": "Claude 3.7 Sonnet (Alt)",
  "cld-opus-4-20250514": "Claude 4 Opus (Early-Alt)",
  "cld-sonnet-4-20250514": "Claude 4 Sonnet (Alt)",
  // OpenAI Latest
  "chatgpt-4o-latest": "ChatGPT 4o Latest",
  "gpt-4.1": "GPT 4.1 Pro",
  "gpt-4.1-mini": "GPT 4.1 Mini",
  "gpt-4o": "GPT 4o (Flagship)",
  "gpt-5": "GPT 5.0",
  "gpt-5-pro": "GPT 5.0 Pro",
  "gpt-5-mini": "GPT 5.0 Mini",
  "gpt-5.1": "GPT 5.1",
  "gpt-5.2": "GPT 5.2",
  o1: "OpenAI o1",
  "o1-pro": "OpenAI o1 Pro",
  o3: "OpenAI o3",
  "o3-pro": "OpenAI o3 Pro",
  "o3-mini": "OpenAI o3 Mini",
  "o4-mini": "OpenAI o4 Mini",
  "o4-mini-high": "OpenAI o4 Mini High",
  // Grok
  "grok-3-latest": "Grok 3 Latest",
  "grok-3-reasoning": "Grok 3 (Thinking)",
  "grok-4-latest": "Grok 4 Latest",
  "grok-4-deepsearch": "Grok 4 (DeepSearch)",
  // DeepSeek Latest
  "deepseek-v3": "DeepSeek V3 (L) (Free)",
  "deepseek-r1": "DeepSeek R1 (L) (Free)",
  "claude-sonnet-4.5-proxy": "Claude 4.5 Sonnet (Free)",
  wormgpt: "WormGPT (Uncensored) (Free)",
  "zai-org-GLM-4.7": "GLM-4.7 (Reasoning) (Free)",
  "zai-org-GLM-4.5-air": "GLM-4.5 Air (Free)",
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
