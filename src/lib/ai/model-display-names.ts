// Provider display order
export const PROVIDER_ORDER = [
  "waspai", // WaspAI
  "google", // Google
  "anthropic", // Anthropic
  "mistral", // Mistral
  "openai", // OpenAI Pro (Groq)
  "meta", // Meta (Groq)
  "grok", // Grok
  "qwen", // Qwen (Groq)
  "moonshot", // Moonshot (Groq)
  "zai", // Zhipu AI (GLM)
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
  waspai: "WaspAI",
  google: "Google",
  anthropic: "Anthropic",
  mistral: "Mistral",
  openai: "OpenAI",
  meta: "Meta",
  grok: "Grok",
  qwen: "Qwen",
  moonshot: "Moonshot",
  zai: "Zhipu AI",
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
  "waspai-model": "WaspAI model",
  // Groq / A4F Aggregated Models
  "canopylabs-orpheus-v1-english": "Orpheus v1 English",
  "llama-3.1-8b-instant": "Llama 3.1 8B Instant",
  "llama-3.3-70b-versatile": "Llama 3.3 70B Versatile",
  "meta-llama-llama-4-scout-17b-16e-instruct": "Llama 4 Scout 17B",
  "meta-llama-llama-guard-4-12b": "Llama Guard 4 12B",
  "meta-llama-llama-prompt-guard-2-86m": "Llama Prompt Guard 86M",
  "moonshotai-kimi-k2-instruct": "Kimi K2 Instruct",
  "openai/gpt-oss-120b": "GPT-OSS 120B",
  "openai-gpt-oss-120b": "GPT-OSS 120B",
  "gpt-oss-120b": "GPT-OSS 120B Lite",
  "gpt-oss-120b-p2": "GPT-OSS 120B P2",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
  "openai-gpt-oss-20b": "GPT-OSS 20B",
  "openai-gpt-oss-safeguard-20b": "GPT-OSS Safeguard 20B",
  // Gemini "thinking" variants — LordRouter strips reasoning tokens, so drop the "Thinking" label
  "gemini-3.5-flash-thinking": "Gemini 3.5 Flash",
  "gemini-3.5-flash-thinking-lite": "Gemini 3.5 Flash Lite",

  // GPT-5 Nano is served standalone by gptossworker AND LordRouter
  "gpt-5-nano": "GPT-5 Nano",
  // NOTE: o3, o3-mini intentionally NOT in static map — only available via lordrouter-o3,
  // lordrouter-o3-mini. Keeping them out avoids false "P2" suffix on lordrouter variants.
  // NOTE: openai/gpt-oss-*:free NOT in static map for the same reason.
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
  // Anthropic Claude (Frenix free tier)
  "claude-sonnet-4.5-proxy": "Claude Sonnet 4.5",
  "claude-sonnet": "Claude Sonnet 3.7",
  "claude-3-sonnet": "Claude 3.5 Sonnet",
  "claude-haiku-4-5": "Claude Haiku 4.5",
  "claude-opus-4-7": "Claude Opus 4.7",
  "claude-opus-4-7-no-tools": "Claude Opus 4.7 (No Tools)",
  // Also map the prefixed variants directly
  "chatai-claude-sonnet": "Claude Sonnet 3.7",
  "randomai-claude-sonnet": "Claude Sonnet 3.7",
  "chatbotai-claude-3-sonnet": "Claude 3.5 Sonnet",

  // Frenix Meta Llama models
  "frenix-llama-3.1-70b": "Llama 3.1 70B",
  "frenix-llama-3.2-11b-vision": "Llama 3.2 Vision 11B",
  "frenix-llama-3.3-70b": "Llama 3.3 70B",
  "frenix-llama-4-maverick": "Llama 4 Maverick 17B",

  // Frenix Google Gemma/Gemini models
  "frenix-gemma-4-31b": "Gemma 4 31B",
  "frenix-gemma-3n-e2b": "Gemma 3N E2B",
  "frenix-gemma-3-12b": "Gemma 3 12B",
  "frenix-gemma-3-27b": "Gemma 3 27B",
  "frenix-gemini-3-flash-preview": "Gemini 3 Flash Preview",

  // Frenix Mistral models
  "frenix-ministral-14b": "Ministral 14B",
  "frenix-mistral-large": "Mistral Large 3 675B",
  "frenix-mistral-nemotron": "Mistral Nemotron",
  "frenix-mixtral-8x7b": "Mixtral 8x7B",

  // Frenix Microsoft
  "frenix-phi-4-multimodal": "Phi-4 Multimodal",

  // Frenix NVIDIA Nemotron (non-excluded)
  "frenix-nemotron-mini-4b": "Nemotron Mini 4B",
  "frenix-nemotron-nano-12b-vl": "Nemotron Nano 12B VL",
  "frenix-nemotron-nano-9b": "Nemotron Nano 9B",
  "frenix-riva-translate": "Riva Translate 4B",

  // Frenix Other models
  "frenix-axion-1.5-pro": "Axion 1.5 Pro",
  "frenix-axion-1.5-pro-free": "Axion 1.5 Pro (Free)",
  "frenix-glm-5": "GLM-5 (Reasoning)",
  "frenix-glm-4.7": "GLM-4.7 (Reasoning)",
  "frenix-minimax-m2.5": "MiniMax M2.5",
  "frenix-turbo": "Perplexity Turbo",
  "frenix-qwen3-coder-480b": "Qwen 3 Coder 480B",
  "frenix-grok-4.1-fast": "Grok 4.1 Fast",
  "frenix-grok-4.3": "Grok 4.3",
  "frenix-grok-4.20-fast": "Grok 4.20 Fast",

  wormgpt: "WormGPT (Uncensored)",
  "zai-org-GLM-4.7": "GLM-4.7 (Reasoning)",
  "zai-org-GLM-4.5-air": "GLM-4.5 Air",
  "zai-org-GLM-5": "GLM-5 (Reasoning)",
  "qwen3-coder-flash": "Qwen 2.5 Coder (Flash)",
  "qwen3-coder-plus": "Qwen 2.5 Coder (Plus)",
};

const COMMON_PREFIXES = [
  "chatai-",
  "chatbotai-",
  "randomai-",
  "svelteai-",
  "openrouterhub-",
  "groqw-",
  "nvidiaw-",
  "cf-",
  "freecf-",
  "google/",
  "meta/",
  "microsoft/",
  "mistralai/",
  "nvidia/",
  "openai/",
  "qwen/",
  "sarvamai/",
  "stepfun-ai/",
  "upstage/",
  "stockmark/",
];

function isPrefixedModel(name: string): boolean {
  const lowercaseName = name.toLowerCase();
  return COMMON_PREFIXES.some((prefix) => lowercaseName.startsWith(prefix));
}

// Create reverse mapping from display names to backend names
export const createReverseModelMapping = (
  dynamicModelIds?: string[],
): {
  models: Record<string, string>;
  providers: Record<string, string>;
} => {
  const modelReverseMapping: Record<string, string> = {};

  // 1. Map static display names
  Object.entries(MODEL_DISPLAY_NAMES).forEach(([backendName, displayName]) => {
    const existing = modelReverseMapping[displayName];
    if (existing) {
      const existingPrefixed = isPrefixedModel(existing);
      const newPrefixed = isPrefixedModel(backendName);
      if (existingPrefixed && !newPrefixed) {
        modelReverseMapping[displayName] = backendName;
        return;
      }
      if (!existingPrefixed && newPrefixed) {
        return;
      }
      if (backendName.length < existing.length) {
        modelReverseMapping[displayName] = backendName;
      }
    } else {
      modelReverseMapping[displayName] = backendName;
    }
  });

  // 2. Map dynamic display names if provided
  if (dynamicModelIds) {
    dynamicModelIds.forEach((backendName) => {
      const displayName = cleanModelDisplayName(backendName);
      const existing = modelReverseMapping[displayName];
      if (existing) {
        const existingPrefixed = isPrefixedModel(existing);
        const newPrefixed = isPrefixedModel(backendName);
        if (existingPrefixed && !newPrefixed) {
          modelReverseMapping[displayName] = backendName;
          return;
        }
        if (!existingPrefixed && newPrefixed) {
          return;
        }
        if (backendName.length < existing.length) {
          modelReverseMapping[displayName] = backendName;
        }
      } else {
        modelReverseMapping[displayName] = backendName;
      }
    });
  }

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

export function cleanModelDisplayName(name: string): string {
  if (!name) return "";

  // Handle LordRouter prefix first
  if (name.startsWith("lordrouter-")) {
    const baseName = name.slice("lordrouter-".length);
    const cleanedBase = cleanModelDisplayName(baseName);

    // Check if this display name is already in use by another provider statically
    // (intentionally excludes lordrouter-only base names from this check)
    const hasOriginal = Object.values(MODEL_DISPLAY_NAMES).some(
      (val) => val.toLowerCase() === cleanedBase.toLowerCase(),
    );

    if (hasOriginal) {
      return `${cleanedBase} P2`;
    }
    return cleanedBase;
  }

  // 1. If it has a static display name mapped, use it
  if (MODEL_DISPLAY_NAMES[name]) {
    return MODEL_DISPLAY_NAMES[name];
  }

  // 2. Otherwise, clean the raw backend name dynamically!
  let cleaned = name;

  // Extract name after last slash if present (e.g., google/gemma-3 -> gemma-3)
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/");
    cleaned = parts[parts.length - 1];
  }

  // Strip :free suffix
  cleaned = cleaned.replace(/:free$/gi, "");

  // Remove common worker/provider prefixes
  const prefixes = [
    "lordrouter-",
    "chatai-",
    "chatbotai-",
    "randomai-",
    "svelteai-",
    "openrouterhub-",
    "groqw-",
    "nvidiaw-",
    "cf-",
    "freecf-",
    "google/",
    "meta/",
    "microsoft/",
    "mistralai/",
    "nvidia/",
    "openai/",
    "qwen/",
    "sarvamai/",
    "stepfun-ai/",
    "upstage/",
    "stockmark/",
  ];

  for (const prefix of prefixes) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.slice(prefix.length);
    }
  }

  // Remove "proxy" word if it is in prefix, suffix, or standalone (case-insensitive)
  cleaned = cleaned.replace(/^proxy-?/gi, "");
  cleaned = cleaned.replace(/-?proxy$/gi, "");
  cleaned = cleaned.replace(/\bproxy\b/gi, "");

  // Convert version hyphens to dots (e.g., -4-1 -> -4.1)
  cleaned = cleaned.replace(/-(\d+)-(\d+)\b/g, "-$1.$2");

  // Fix GPT-5 / o-series naming: use hyphen instead of space after "gpt" prefix
  // e.g. "gpt-5-mini" -> after replacing hyphens -> "GPT 5 Mini" but we want "GPT-5 Mini"
  // We handle this post-cleanup by detecting the pattern.

  // Clean up formatting (replace hyphens with spaces, capitalize words)
  cleaned = cleaned
    .replace(/-+/g, " ") // replace hyphens with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize first letter of each word

  // Clean specific common abbreviations/naming artifacts
  cleaned = cleaned.replace(/Gp/gi, "GP");
  cleaned = cleaned.replace(/Gpt/gi, "GPT");
  cleaned = cleaned.replace(/Llm/gi, "LLM");
  cleaned = cleaned.replace(/It\b/gi, "IT");
  cleaned = cleaned.replace(/Of/g, "of");
  cleaned = cleaned.replace(/To/g, "to");
  cleaned = cleaned.replace(/And/g, "and");
  cleaned = cleaned.replace(/Awq/gi, "AWQ");
  cleaned = cleaned.replace(/Fp8/gi, "FP8");
  cleaned = cleaned.replace(/Lora/gi, "LoRA");
  cleaned = cleaned.replace(/Sql/gi, "SQL");
  cleaned = cleaned.replace(/Ds/gi, "DS");
  cleaned = cleaned.replace(/Deepseek/gi, "DeepSeek");
  cleaned = cleaned.replace(/\bGlm\b/gi, "GLM");
  cleaned = cleaned.replace(/\bLfm\b/gi, "LFM");
  cleaned = cleaned.replace(/\bQwq\b/gi, "QwQ");
  cleaned = cleaned.replace(/\bVl\b/gi, "VL");
  cleaned = cleaned.replace(/\bOss\b/gi, "OSS");
  cleaned = cleaned.replace(/GPT OSS/gi, "GPT-OSS");
  // GPT-5 and o-series: apply hyphen after GPT prefix and fix o-series lowercase
  // "GPT 5" -> "GPT-5", "GPT 5 Mini" -> "GPT-5 Mini", etc.
  cleaned = cleaned.replace(/^GPT (\d)/i, "GPT-$1");
  // o-series models: "O3" -> "o3", "O3 Mini" -> "o3 mini"
  cleaned = cleaned.replace(/^O(\d)/i, (_, d) => `o${d}`);
  if (/^o\d/.test(cleaned)) {
    cleaned = cleaned.toLowerCase();
  }
  cleaned = cleaned.replace(
    /\b(\d+(?:\.\d+)?)([bm])\b/gi,
    (_, num, unit) => num + unit.toUpperCase(),
  );
  cleaned = cleaned.replace(/\bV(\d+)\b/g, (_, num) => "v" + num);

  return cleaned.trim();
}
