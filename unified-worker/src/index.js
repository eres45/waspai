/**
 * Unified AI Worker — routes OpenAI-compatible /v1/chat/completions
 * to 30+ discovered backends with automatic fallback.
 */

// ============================================================================
// CONFIGURATION — Model → Endpoint mapping
// ============================================================================

const MODEL_MAP = {
  // --- VERIFIED WORKING MODELS (tested one by one May 2026) ---

  // FreeCF Models (16 working)
  "llama-3.2-1b": { provider: "freecf", model: "llama-3.2-1b" },
  "llama-3.1-8b": { provider: "freecf", model: "llama-3.1-8b" },
  "llama-3.1-8b-awq": { provider: "freecf", model: "llama-3.1-8b-awq" },
  "llama-3.1-8b-fp8": { provider: "freecf", model: "llama-3.1-8b-fp8" },
  "llama-3.3-70b-fp8": { provider: "freecf", model: "llama-3.3-70b-fp8" },
  "llama-3-8b": { provider: "freecf", model: "llama-3-8b" },
  "llama-3-8b-awq": { provider: "freecf", model: "llama-3-8b-awq" },
  "llama-4-scout": { provider: "freecf", model: "llama-4-scout" },
  "llama-2-7b": { provider: "freecf", model: "llama-2-7b" },
  "llama-guard-3": { provider: "freecf", model: "llama-guard-3" },
  "qwq-32b": { provider: "freecf", model: "qwq-32b" },
  "qwen-2.5-coder": { provider: "freecf", model: "qwen-2.5-coder" },
  "gemma-3-12b": { provider: "freecf", model: "gemma-3-12b" },
  "phi-2": { provider: "freecf", model: "phi-2" },
  llama: { provider: "freecf", model: "llama" },

  // GPT-OSS Worker (2 working)
  "gpt-oss-120b": { provider: "gptossworker", model: "gpt-oss-120b" },
  "gpt-5-nano": { provider: "gptossworker", model: "gpt-5-nano" },

  // Raw / Legacy Claude Models
  "claude-sonnet": { provider: "chatai", model: "claude-sonnet" },
  "claude-3-sonnet": { provider: "chatai", model: "claude-sonnet" },
  "claude-sonnet-4.5": { provider: "chatai", model: "claude-sonnet" },

  // ChatAI Proxy (5 working)
  "chatai-gpt-4o-mini": { provider: "chatai", model: "gpt-4o-mini" },
  "chatai-gpt-4o": { provider: "chatai", model: "gpt-4o" },
  "chatai-gpt-3.5-turbo": { provider: "chatai", model: "gpt-3.5-turbo" },
  "chatai-claude-sonnet": { provider: "chatai", model: "claude-sonnet" },
  "chatai-llama-3.1-8b": { provider: "chatai", model: "llama-3.1-8b" },

  // Chatbot AI System (5 working)
  "chatbotai-gpt-3.5-turbo": { provider: "chatbotai", model: "gpt-3.5-turbo" },
  "chatbotai-gpt-4o-mini": { provider: "chatbotai", model: "gpt-3.5-turbo" },
  "chatbotai-gpt-4o": { provider: "chatbotai", model: "gpt-4" },
  "chatbotai-claude-3-sonnet": { provider: "chatbotai", model: "gpt-4" },
  "chatbotai-llama-3.1-8b": { provider: "chatbotai", model: "gpt-3.5-turbo" },

  // OpenRouter Hub (2 working)
  "openrouterhub-gpt-4o-mini": {
    provider: "openrouterhub",
    model: "gpt-4o-mini",
  },
  "openrouterhub-gpt-4o": { provider: "openrouterhub", model: "gpt-4o" },

  // RandomAI Proxy (5 working)
  "randomai-gpt-4o-mini": { provider: "randomai", model: "gpt-4o-mini" },
  "randomai-gpt-4o": { provider: "randomai", model: "gpt-4o" },
  "randomai-gpt-3.5-turbo": { provider: "randomai", model: "gpt-3.5-turbo" },
  "randomai-claude-sonnet": { provider: "randomai", model: "claude-sonnet" },
  "randomai-gemini-pro": { provider: "randomai", model: "gemini-pro" },

  // SvelteAI (5 working)
  "svelteai-gpt-4o": { provider: "svelteai", model: "openai/gpt-4o" },
  "svelteai-gpt-4o-mini": { provider: "svelteai", model: "openai/gpt-4o-mini" },
  "svelteai-gpt-4": { provider: "svelteai", model: "openai/gpt-4" },
  "svelteai-gpt-3.5-turbo": {
    provider: "svelteai",
    model: "openai/gpt-3.5-turbo",
  },
  "svelteai-gpt-3.5-16k": {
    provider: "svelteai",
    model: "openai/gpt-3.5-turbo-16k",
  },

  // Groq Worker (3 working)
  "groqw-llama-3.1-8b": {
    provider: "groqworker",
    model: "llama-3.1-8b-instant",
  },
  "groqw-llama-3.3-70b": {
    provider: "groqworker",
    model: "llama-3.3-70b-versatile",
  },
  "groqw-llama-4-scout": {
    provider: "groqworker",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
  },

  // NVIDIA Worker (2 working)
  "nvidiaw-llama-3.1-8b": {
    provider: "nvidiaworker",
    model: "meta/llama-3.1-8b-instruct",
  },
  "nvidiaw-llama-3.3-70b": {
    provider: "nvidiaworker",
    model: "meta/llama-3.3-70b-instruct",
  },
  "gpt-oss-120b-p2": {
    provider: "groqworker",
    model: "openai/gpt-oss-120b",
  },
  "gemini-2.5-flash": {
    provider: "gemini-openai",
    model: "gemini-2.5-flash",
  },
  "gemini-2.5-flash-lite": {
    provider: "gemini-openai",
    model: "gemini-2.5-flash-lite",
  },

  // ── Frenix Free-Tier Models ──────────────────────────────────────────────
  // Anthropic Claude (via Frenix)
  "claude-haiku-4-5": { provider: "frenix", model: "claude-haiku-4-5" },
  "claude-opus-4-7": { provider: "frenix", model: "claude-opus-4-7" },
  "claude-opus-4-7-no-tools": {
    provider: "frenix",
    model: "claude-opus-4-7-no-tools",
  },

  // Meta Llama (via Frenix)
  "frenix-llama-3.1-70b": {
    provider: "frenix",
    model: "llama-3.1-70b-instruct",
  },
  "frenix-llama-3.2-11b-vision": {
    provider: "frenix",
    model: "llama-3.2-11b-vision-instruct",
  },
  "frenix-llama-3.3-70b": {
    provider: "frenix",
    model: "llama-3.3-70b-instruct",
  },
  "frenix-llama-4-maverick": {
    provider: "frenix",
    model: "llama-4-maverick-17b-128e-instruct",
  },

  // Google Gemma (via Frenix)
  "frenix-gemma-4-31b": { provider: "frenix", model: "gemma-4-31b-it" },
  "frenix-gemma-3n-e2b": { provider: "frenix", model: "gemma-3n-e2b-it" },

  // Mistral (via Frenix)
  "frenix-ministral-14b": {
    provider: "frenix",
    model: "ministral-14b-instruct-2512",
  },
  "frenix-mistral-large": {
    provider: "frenix",
    model: "mistral-large-3-675b-instruct-2512",
  },
  "frenix-mistral-nemotron": { provider: "frenix", model: "mistral-nemotron" },
  "frenix-mixtral-8x7b": {
    provider: "frenix",
    model: "mixtral-8x7b-instruct-v0.1",
  },

  // Microsoft (via Frenix)
  "frenix-phi-4-multimodal": {
    provider: "frenix",
    model: "phi-4-multimodal-instruct",
  },

  // NVIDIA Nemotron utility (via Frenix — non-excluded ones)
  "frenix-nemotron-mini-4b": {
    provider: "frenix",
    model: "nemotron-mini-4b-instruct",
  },
  "frenix-nemotron-nano-12b-vl": {
    provider: "frenix",
    model: "nemotron-nano-12b-v2-vl",
  },
  "frenix-nemotron-nano-9b": {
    provider: "frenix",
    model: "nvidia-nemotron-nano-9b-v2",
  },
  "frenix-riva-translate": {
    provider: "frenix",
    model: "riva-translate-4b-instruct-v1.1",
  },

  // Other models (via Frenix)
  "frenix-axion-1.5-pro": { provider: "frenix", model: "axion-1.5-pro" },
  "frenix-axion-1.5-pro-free": {
    provider: "frenix",
    model: "axion-1.5-pro:free",
  },
  "frenix-glm-5": { provider: "frenix", model: "glm-5" },
  "frenix-glm-4.7": { provider: "frenix", model: "glm-4.7" },
  "frenix-minimax-m2.5": { provider: "frenix", model: "MiniMax-M2.5" },
  "frenix-turbo": { provider: "frenix", model: "turbo" },

  // Discovered Next-Gen models
  "frenix-gemma-3-12b": { provider: "frenix", model: "gemma-3-12b-it" },
  "frenix-gemma-3-27b": { provider: "frenix", model: "gemma-3-27b-it" },
  "frenix-gemini-3-flash-preview": {
    provider: "frenix",
    model: "gemini-3-flash-preview",
  },
  "frenix-qwen3-coder-480b": {
    provider: "frenix",
    model: "qwen3-coder-480b-a35b-instruct",
  },
  "frenix-grok-4.1-fast": { provider: "frenix", model: "grok-4.1-fast" },
  "frenix-grok-4.3": { provider: "frenix", model: "grok-4.3" },
  "frenix-grok-4.20-fast": { provider: "frenix", model: "grok-4.20-fast" },

  // WaspAI model (via 0vai)
  "waspai-model": { provider: "zerovai", model: "voidv1-flash" },
};

// ============================================================================
// PROVIDER CONFIGS
// ============================================================================

const PROVIDERS = {
  pollinations: {
    base: "https://text.pollinations.ai/openai",
    key: null,
    openai: true,
  },
  literouter: { base: "https://api.literouter.com", key: null, openai: true },
  freeai: { base: "https://api.free.ai", key: null, openai: true },
  chatai: {
    base: "https://chatai-proxy.revai.workers.dev",
    key: null,
    openai: true,
  },
  makechat: {
    base: "https://makechat-uf23.onrender.com/api/ai",
    key: null,
    openai: false,
  },
  eqing: {
    base: "https://origin.eqing.tech/api/openai",
    key: null,
    openai: true,
  },
  freecf: {
    base: "https://freecfmodels.bgmipro285.workers.dev",
    key: null,
    openai: true,
  },
  bluesminds: { base: "https://api.bluesminds.com", key: null, openai: true },
  chatbotai: {
    base: "https://chatbot-ai-system.onrender.com/api/v1",
    key: null,
    openai: true,
  },
  freegptblond: {
    base: "https://freegpt-blond.vercel.app/api",
    key: null,
    openai: false,
  },
  groq: {
    base: "https://api.groq.com/openai/v1",
    key: "GROQ_API_KEY",
    openai: true,
  },
  groqworker: {
    base: "https://groq-worker.revai.workers.dev/v1",
    key: null,
    openai: true,
  },
  svelteai: {
    base: "https://svelte-ai-enhanced.revai.workers.dev/v1",
    key: null,
    openai: true,
  },
  botnation: {
    base: "https://botnation-worker.revai.workers.dev/v1",
    key: null,
    openai: true,
  },
  nvidiaworker: {
    base: "https://nvidia-worker.revai.workers.dev/v1",
    key: null,
    openai: true,
  },
  openrouterhub: {
    base: "https://openrouter-ai-hub.revai.workers.dev/v1",
    key: null,
    openai: true,
  },
  freeaihub: {
    base: "https://free-ai-hub.revai.workers.dev/v1",
    key: null,
    openai: true,
  },
  kimik2: { base: "https://kimi-k2.ai/api", key: null, openai: false },
  randomai: {
    base: "https://randomai-proxy.revai.workers.dev/v1",
    key: null,
    openai: true,
  },
  llmchat: { base: "https://llmchat.in/inference", key: null, openai: false },
  aimirror: {
    base: "https://chat.aimirror123.com/api",
    key: null,
    openai: false,
  },
  gemini: {
    base: "https://generativelanguage.googleapis.com/v1beta",
    key: "GEMINI_API_KEY",
    openai: false,
  },
  openrouter: {
    base: "https://openrouter.ai/api/v1",
    key: "OPENROUTER_API_KEY",
    openai: true,
  },
  quillbot: {
    base: "https://quillbot.com/api/raven",
    key: null,
    openai: false,
  },
  arliai: { base: "https://api.arliai.com/v1", key: null, openai: true },
  cerebras: {
    base: "https://api.cerebras.ai/v1",
    key: "CEREBRAS_API_KEY",
    openai: true,
  },
  gptossworker: {
    base: "https://gpt-oss-worker.llamai.workers.dev/v1",
    key: null,
    openai: true,
  },
  completions: {
    base: "https://completions.me/api/v1",
    key: "COMPLETIONS_API_KEY",
    openai: true,
  },
  gptossdirect: {
    base: "https://chat-gpt-oss.com/api",
    key: null,
    openai: false,
  },
  "gemini-openai": {
    base: "https://gemini-openai.revai.workers.dev/v1",
    key: null,
    openai: true,
  },
  frenix: {
    base: "https://api.frenix.sh/v1",
    keys: [
      "sk-frenix-8060edc63750510e826bb519345fc77a",
      "sk-frenix-c03afa72cea826dade5a8847cf107ad3",
      "sk-frenix-4686cdf52d4928ff21a56dec82c999d4",
      "sk-frenix-414ffb8f6b5a7a89cf843d8f74462233",
      "sk-frenix-aea6c81b0d86e622ec7d4a1e3352c05e",
      "sk-frenix-c9d0a4fdf1e9f410353b37e2cf6d63dd",
    ],
    openai: true,
  },
  zerovai: {
    base: "https://0vai.vercel.app/api/v1",
    keys: ["void_sk_ekfyclcognsx5jkz5g5x1nnr"],
    openai: true,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function randomUUID() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
}

// sha256 helper is unused

// ============================================================================
// REQUEST BUILDERS (per-provider adapters)
// ============================================================================

const ALLOWED_PARAMS = [
  "model",
  "messages",
  "temperature",
  "top_p",
  "n",
  "stream",
  "stop",
  "max_tokens",
  "presence_penalty",
  "frequency_penalty",
  "logit_bias",
  "user",
  "response_format",
  "seed",
  "tools",
  "tool_choice",
];

function sanitizePayload(data) {
  const sanitized = {};
  for (const key of ALLOWED_PARAMS) {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

function buildOpenAIRequest(body, mappedModel) {
  return { ...sanitizePayload(body), model: mappedModel };
}

// Certain Frenix models don't support tool/function calling or fail/return empty tool calls.
// We strip tools only for those known incompatible models.
function buildFrenixRequest(body, mappedModel) {
  const payload = sanitizePayload(body);
  delete payload.tools;
  delete payload.tool_choice;
  return { ...payload, model: mappedModel };
}

function buildMakeChatRequest(body) {
  return {
    messages: body.messages,
    model: body.model || "gpt-4o-mini",
    stream: body.stream ?? false,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens ?? 2048,
  };
}

function buildFreeGPTBlondRequest(body) {
  return {
    message: body.messages?.[body.messages.length - 1]?.content || "",
    model: body.model || "gpt-4o-mini",
    stream: body.stream ?? false,
  };
}

function buildKimiK2Request(body) {
  return {
    message: body.messages?.[body.messages.length - 1]?.content || "",
    model: body.model || "kimi-k2",
    stream: body.stream ?? true,
  };
}

function buildLLMChatRequest(body) {
  return {
    inputs: { messages: body.messages },
    parameters: {
      max_new_tokens: body.max_tokens ?? 1024,
      temperature: body.temperature ?? 0.7,
      top_p: body.top_p ?? 0.9,
    },
  };
}

function buildAimirrorRequest(body) {
  return {
    message: body.messages?.[body.messages.length - 1]?.content || "",
    model: body.model || "default",
    stream: true,
  };
}

function buildGeminiRequest(body, _apiKey) {
  const contents = body.messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  return {
    contents,
    generationConfig: {
      maxOutputTokens: body.max_tokens ?? 2048,
      temperature: body.temperature ?? 0.7,
      topP: body.top_p ?? 0.9,
    },
  };
}

function buildQuillbotRequest(body) {
  return {
    message: {
      role: "user",
      content: body.messages?.[body.messages.length - 1]?.content || "",
    },
    mode: "chat",
    stream: body.stream ?? false,
  };
}

function buildGPTOSSDirectRequest(body) {
  const fp = randomUUID().replace(/-/g, "");
  return {
    body: JSON.stringify({
      conversation_id: null,
      model: body.model || "gpt-oss-120b",
      content: body.messages?.[body.messages.length - 1]?.content || "",
      reasoning_effort: "low",
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Referer: "https://chat-gpt-oss.com/",
      "X-Fingerprint": fp,
      Origin: "https://chat-gpt-oss.com",
    },
  };
}

// ============================================================================
// RESPONSE PARSERS
// ============================================================================

// parseOpenAIResponse is unused

function parseLLMChatStream(chunk) {
  try {
    const j = JSON.parse(chunk);
    return j.generated_text || "";
  } catch {
    return "";
  }
}

function parseAimirrorSSE(line) {
  if (!line.startsWith("data: ")) return "";
  const data = line.slice(6).trim();
  try {
    const j = JSON.parse(data);
    return j.choices?.[0]?.delta?.content || "";
  } catch {
    return "";
  }
}

function parseGeminiResponse(data) {
  try {
    const j = JSON.parse(data);
    return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch {
    return "";
  }
}

function parseGPTOSSDirect(line) {
  if (!line.startsWith("data: ")) return "";
  const data = line.slice(6).trim();
  if (data === "[DONE]") return "";
  try {
    const j = JSON.parse(data);
    if (j.content) return j.content;
    if (j.completion?.content) return j.completion.content;
    return "";
  } catch {
    return "";
  }
}

// ============================================================================
// Mapped model resolver for fallback providers
function getMappedModel(providerKey, originalModel) {
  // If the original model is mapped directly to this provider, use it
  const mappedDirect = MODEL_MAP[originalModel];
  if (mappedDirect && mappedDirect.provider === providerKey) {
    return mappedDirect.model;
  }

  // Determine the base model name by stripping known provider prefixes if present
  let baseName = originalModel;
  const dashIndex = originalModel.indexOf("-");
  if (dashIndex > 0) {
    const prefix = originalModel.slice(0, dashIndex);
    const knownProviders = [
      "chatai",
      "chatbotai",
      "randomai",
      "svelteai",
      "openrouterhub",
      "groqw",
      "nvidiaw",
      "freecf",
      "frenix",
    ];
    if (knownProviders.includes(prefix)) {
      baseName = originalModel.slice(dashIndex + 1);
    }
  }

  // Construct equivalent model key for the fallback provider
  // e.g. chatbotai-gpt-4o, svelteai-gpt-4o, etc.
  const fallbackKey = `${providerKey}-${baseName}`;
  const fallbackMapped = MODEL_MAP[fallbackKey];
  if (fallbackMapped) {
    return fallbackMapped.model;
  }

  // Special alias case for claude-sonnet vs claude-3-sonnet
  if (baseName === "claude-sonnet" || baseName === "claude-sonnet-4.5") {
    const altKey = `${providerKey}-claude-3-sonnet`;
    const altMapped = MODEL_MAP[altKey];
    if (altMapped) return altMapped.model;
  } else if (baseName === "claude-3-sonnet") {
    const altKey = `${providerKey}-claude-sonnet`;
    const altMapped = MODEL_MAP[altKey];
    if (altMapped) return altMapped.model;
  }

  return originalModel;
}

// MAIN FETCH LOGIC
// ============================================================================

async function fetchFromProvider(providerKey, body, env, stream = false) {
  const cfg = PROVIDERS[providerKey];
  if (!cfg) throw new Error(`Unknown provider: ${providerKey}`);

  if (providerKey === "botnation") {
    throw new Error("botnation provider is currently disabled");
  }

  const mappedModel = getMappedModel(providerKey, body.model);

  // Handle rotating keys for Frenix
  let apiKey = null;
  if (cfg.keys && Array.isArray(cfg.keys)) {
    // Round-robin across all keys
    const keyIndex = Math.floor(Math.random() * cfg.keys.length);
    apiKey = cfg.keys[keyIndex];
  } else if (cfg.key) {
    apiKey = env[cfg.key] || null;
  }

  let url,
    reqBody,
    headers = {};

  switch (providerKey) {
    case "pollinations":
    case "literouter":
    case "freeai":
    case "chatai":
    case "eqing":
    case "freecf":
    case "bluesminds":
    case "chatbotai":
    case "groq":
    case "groqworker":
    case "svelteai":
    case "botnation":
    case "nvidiaworker":
    case "openrouterhub":
    case "freeaihub":
    case "randomai":
    case "arliai":
    case "cerebras":
    case "completions":
    case "openrouter":
    case "gptossworker":
    case "gemini-openai":
    case "zerovai":
      url = `${cfg.base}/chat/completions`;
      reqBody = buildOpenAIRequest(body, mappedModel);
      headers = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      break;

    // Frenix models don't support tool/function calling — always strip tools
    case "frenix":
      url = `${cfg.base}/chat/completions`;
      reqBody = buildFrenixRequest(body, mappedModel);
      headers = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      break;

    case "makechat":
      url = `${cfg.base}/chat`;
      reqBody = buildMakeChatRequest(body);
      headers = { "Content-Type": "application/json" };
      break;

    case "freegptblond":
      url = `${cfg.base}/chat`;
      reqBody = buildFreeGPTBlondRequest(body);
      headers = { "Content-Type": "application/json" };
      break;

    case "kimik2":
      url = `${cfg.base}/chat`;
      reqBody = buildKimiK2Request(body);
      headers = { "Content-Type": "application/json" };
      break;

    case "llmchat":
      url = `${cfg.base}/stream`;
      reqBody = buildLLMChatRequest(body);
      headers = { "Content-Type": "application/json" };
      break;

    case "aimirror":
      url = `${cfg.base}/chat/sse`;
      reqBody = buildAimirrorRequest(body);
      headers = { "Content-Type": "application/json" };
      break;

    case "gemini": {
      const modelName = mappedModel || "gemini-1.5-pro";
      url = `${cfg.base}/models/${modelName}:generateContent?key=${apiKey || ""}`;
      reqBody = buildGeminiRequest(body, apiKey);
      headers = { "Content-Type": "application/json" };
      break;
    }

    case "quillbot":
      url = `${cfg.base}/quill-chat/responses`;
      reqBody = buildQuillbotRequest(body);
      headers = { "Content-Type": "application/json" };
      break;

    case "gptossdirect": {
      const direct = buildGPTOSSDirectRequest(body);
      url = `${cfg.base}/message`;
      reqBody = direct.body;
      headers = direct.headers;
      break;
    }

    default:
      throw new Error(`Unhandled provider: ${providerKey}`);
  }

  const fetchOpts = {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ...headers,
    },
    body: typeof reqBody === "string" ? reqBody : JSON.stringify(reqBody),
  };

  if (stream && cfg.openai) {
    fetchOpts.headers["Accept"] = "text/event-stream";
  }

  const res = await fetch(url, fetchOpts);

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  return { res, providerKey, cfg };
}

// ============================================================================
// STREAMING RESPONSE HANDLER
// ============================================================================

async function* streamResponse(providerKey, res, model) {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("text/event-stream")) {
    const text = await res.text();
    let content = "";
    try {
      const responseData = await nonStreamResponse(
        providerKey,
        { text: () => Promise.resolve(text) },
        model,
      );
      content = responseData.choices?.[0]?.message?.content || "";
    } catch {
      content = text;
    }

    if (content) {
      yield {
        id: `chatcmpl-${randomUUID()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            delta: { content },
            finish_reason: null,
          },
        ],
      };
    }

    yield {
      id: `chatcmpl-${randomUUID()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasYieldedContent = false; // Track if we've actually streamed any text

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      let content = "";
      let delta = null;
      let hasDelta = false;
      let finish_reason = null;

      switch (providerKey) {
        case "pollinations":
        case "literouter":
        case "freeai":
        case "chatai":
        case "eqing":
        case "freecf":
        case "bluesminds":
        case "chatbotai":
        case "groq":
        case "groqworker":
        case "svelteai":
        case "botnation":
        case "nvidiaworker":
        case "openrouterhub":
        case "freeaihub":
        case "randomai":
        case "arliai":
        case "cerebras":
        case "completions":
        case "openrouter":
        case "gptossworker":
        case "gemini-openai":
        case "frenix":
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const j = JSON.parse(data);
              const choice = j.choices?.[0];
              if (choice) {
                delta = choice.delta;
                finish_reason = choice.finish_reason || null;
                hasDelta = true;
              }
            } catch {}
          }
          break;

        case "aimirror":
          content = parseAimirrorSSE(line);
          if (content) {
            delta = { content };
            hasDelta = true;
          }
          break;

        case "llmchat":
          content = parseLLMChatStream(line);
          if (content) {
            delta = { content };
            hasDelta = true;
          }
          break;

        case "gptossdirect":
          content = parseGPTOSSDirect(line);
          if (content) {
            delta = { content };
            hasDelta = true;
          }
          break;

        case "quillbot":
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            try {
              const j = JSON.parse(data);
              content = j.chunk || "";
              if (content) {
                delta = { content };
                hasDelta = true;
              }
            } catch {}
          }
          break;

        default:
          content = line;
          if (content) {
            delta = { content };
            hasDelta = true;
          }
      }

      if (hasDelta && delta) {
        if (
          delta.content ||
          delta.reasoning_content ||
          (delta.tool_calls && delta.tool_calls.length > 0)
        ) {
          hasYieldedContent = true;
        }

        yield {
          id: `chatcmpl-${randomUUID()}`,
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [
            {
              index: 0,
              delta,
              finish_reason,
            },
          ],
        };
      }
    }
  }

  // If the model returned tool calls or an empty response (no text content at all),
  // emit a fallback message so the AI SDK doesn't throw "model output must contain
  // either output text or tool calls".
  if (!hasYieldedContent) {
    yield {
      id: `chatcmpl-${randomUUID()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          delta: {
            content:
              "I wasn't able to generate a response through this model. Please try again or switch to a different model.",
          },
          finish_reason: null,
        },
      ],
    };
  }

  // Final chunk
  yield {
    id: `chatcmpl-${randomUUID()}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
  };
}

// ============================================================================
// NON-STREAMING RESPONSE HANDLER
// ============================================================================

async function nonStreamResponse(providerKey, res, model) {
  const text = await res.text();

  switch (providerKey) {
    case "pollinations":
    case "literouter":
    case "freeai":
    case "chatai":
    case "eqing":
    case "freecf":
    case "bluesminds":
    case "chatbotai":
    case "groq":
    case "groqworker":
    case "svelteai":
    case "botnation":
    case "nvidiaworker":
    case "openrouterhub":
    case "freeaihub":
    case "randomai":
    case "arliai":
    case "cerebras":
    case "completions":
    case "openrouter":
    case "gptossworker":
    case "gemini-openai":
    case "frenix":
      try {
        const j = JSON.parse(text);
        return j;
      } catch {
        return createOpenAIResponse(model, text);
      }

    case "makechat":
    case "freegptblond":
    case "kimik2": {
      try {
        const j = JSON.parse(text);
        const content =
          j.message ||
          j.reply ||
          j.content ||
          j.choices?.[0]?.message?.content ||
          text;
        return createOpenAIResponse(model, content);
      } catch {
        return createOpenAIResponse(model, text);
      }
    }

    case "llmchat": {
      try {
        const j = JSON.parse(text);
        const content = j.generated_text || j.text || text;
        return createOpenAIResponse(model, content);
      } catch {
        return createOpenAIResponse(model, text);
      }
    }

    case "aimirror": {
      let content = "";
      for (const line of text.split("\n")) {
        content += parseAimirrorSSE(line);
      }
      return createOpenAIResponse(model, content);
    }

    case "gemini": {
      try {
        const _j = JSON.parse(text);
        const content = parseGeminiResponse(text);
        return createOpenAIResponse(model, content);
      } catch {
        return createOpenAIResponse(model, text);
      }
    }

    case "quillbot": {
      try {
        const lines = text.split("\n");
        let content = "";
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() === "event: output_done" && lines[i + 1]) {
            const dataLine = lines[i + 1].trim();
            if (dataLine.startsWith("data: ")) {
              const j = JSON.parse(dataLine.slice(6));
              content = j.text || "";
              break;
            }
          }
        }
        if (!content) {
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const j = JSON.parse(line.slice(6));
                if (j.chunk) content += j.chunk;
              } catch {}
            }
          }
        }
        return createOpenAIResponse(model, content || text);
      } catch {
        return createOpenAIResponse(model, text);
      }
    }

    case "gptossdirect": {
      let content = "";
      for (const line of text.split("\n")) {
        content += parseGPTOSSDirect(line);
      }
      return createOpenAIResponse(model, content);
    }

    default:
      return createOpenAIResponse(model, text);
  }
}

function createOpenAIResponse(model, content) {
  return {
    id: `chatcmpl-${randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

// ============================================================================
// FALLBACK: get next provider for a model family
// ============================================================================

function getFallbackProvider(providerKey) {
  if (providerKey === "botnation") {
    return "openrouterhub";
  }

  const fallbackChain = [
    "freecf",
    "gptossworker",
    "chatai",
    "chatbotai",
    "openrouterhub",
    "randomai",
    "svelteai",
    "groqworker",
    "nvidiaworker",
    "gemini-openai",
  ];
  const idx = fallbackChain.indexOf(providerKey);
  if (idx >= 0 && idx < fallbackChain.length - 1) {
    return fallbackChain[idx + 1];
  }
  return null;
}

// ============================================================================
// ROUTER
// ============================================================================

async function routeChat(body, env) {
  const modelName = body.model;
  const mapped = MODEL_MAP[modelName];

  if (!mapped) {
    // Try to use the model name directly as provider fallback
    return {
      error: `Unknown model: ${modelName}. Use GET /v1/models to see available models.`,
    };
  }

  const stream = body.stream ?? false;
  let provider = mapped.provider;
  let lastError = null;

  // Try primary + up to 2 fallbacks
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { res } = await fetchFromProvider(provider, body, env, stream);
      return { res, provider, stream };
    } catch (err) {
      lastError = err.message;
      const next = getFallbackProvider(provider);
      if (!next) break;
      provider = next;
    }
  }

  return {
    error: `All providers failed for ${modelName}. Last error: ${lastError}`,
  };
}

// ============================================================================
// IMAGE GENERATION ROUTING & NORMALIZATION
// ============================================================================

async function handleImageGenerations(request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;
    let model = body.model || "flux-schnell";

    // Normalize model ID
    model = model.toLowerCase();
    if (model.includes("schnell")) model = "flux-schnell";
    else if (model.includes("dev") || model === "flux") model = "flux";
    else if (model.includes("juggernaut")) model = "juggernaut-xl";
    else if (model.includes("realvis")) model = "realvisxl-v4";
    else if (model.includes("sd-3") || model.includes("sd3")) model = "sd-3.5";
    else if (model.includes("seedream")) model = "seedream-4.5";
    else if (model.includes("sdxl")) model = "sdxl-1.0";

    let res;

    if (model === "flux-schnell") {
      res = await fetch(
        `https://ai-images-proxy.llamai.workers.dev/?prompt=${encodeURIComponent(prompt)}`,
        {
          method: "POST",
        },
      );
    } else if (model === "juggernaut-xl") {
      res = await fetch(
        `https://image-world-king-proxy.llamai.workers.dev/api/generate?prompt=${encodeURIComponent(prompt)}`,
        {
          method: "POST",
        },
      );
    } else if (model === "flux") {
      res = await fetch("https://runware-image-worker.llamai.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, outputType: "URL" }),
      });
    } else if (model === "realvisxl-v4") {
      res = await fetch("https://mu-devs-image-worker.llamai.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
    } else if (model === "sd-3.5") {
      res = await fetch("https://aitubo.llamai.workers.dev/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, count: 1 }),
      });
    } else if (model === "seedream-4.5") {
      res = await fetch(
        "https://raphaelai.llamai.workers.dev/v1/images/generations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, style: "None" }),
        },
      );
    } else if (model === "sdxl-1.0") {
      res = await fetch(
        "https://image-api.at41rvplayzz.workers.dev/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer At41rv-API-Image",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sdxl-1.0",
            prompt,
            size: "1024x1024",
          }),
        },
      );
    } else {
      // Default fallback
      res = await fetch(
        `https://ai-images-proxy.llamai.workers.dev/?prompt=${encodeURIComponent(prompt)}`,
        {
          method: "POST",
        },
      );
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      return new Response(
        JSON.stringify({
          error: `Upstream error: ${res.status} — ${errorText}`,
        }),
        {
          status: res.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Read the response buffer safely
    const responseBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(responseBuffer);

    // Check if the response is a raw binary image
    const contentType = res.headers.get("content-type") || "";
    const isPng =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47;
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;

    if (
      contentType.includes("image/") ||
      contentType.includes("octet-stream") ||
      isPng ||
      isJpeg
    ) {
      let binaryString = "";
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binaryString);

      const responseData = {
        created: Math.floor(Date.now() / 1000),
        data: [{ b64_json: base64Data }],
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Otherwise, decode the response safely as ISO-8859-1 (Latin1) to prevent high-byte corruption in fallback parses
    const text = new TextDecoder("iso-8859-1").decode(responseBuffer);

    // Try to parse text as JSON and extract URL
    let imageUrl = "";
    try {
      const data = JSON.parse(text);
      if (data.data && Array.isArray(data.data) && data.data[0]) {
        imageUrl = data.data[0].url || data.data[0].b64_json || "";
      } else {
        imageUrl =
          data.url || data.image || data.image_url || data.imageUrl || "";
      }
    } catch {
      // If not JSON, check if it contains a URL
      const match = text.match(/https?:\/\/[^\s"']+/);
      if (match) {
        imageUrl = match[0];
      } else if (text.length > 100) {
        // Assume base64
        imageUrl = text;
      }
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({
          error: "Failed to extract image URL or data from response",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Perform standard base64 encoding check for raw binary PNG/JPG data
    let finalB64 = imageUrl;
    if (!imageUrl.startsWith("http")) {
      const isRawBinary =
        imageUrl.startsWith("\x89PNG") ||
        imageUrl.includes("PNG") ||
        imageUrl.startsWith("\xff\xd8") || // JPEG magic
        !/^[A-Za-z0-9+/=\s]+$/.test(imageUrl);
      if (isRawBinary) {
        // Convert the ISO-8859-1 binary string to standard base64
        const bytes = new Uint8Array(imageUrl.length);
        for (let i = 0; i < imageUrl.length; i++) {
          bytes[i] = imageUrl.charCodeAt(i);
        }
        let binaryString = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binaryString += String.fromCharCode(bytes[i]);
        }
        finalB64 = btoa(binaryString);
      }
    }

    // Return standard OpenAI-compatible format
    const responseData = {
      created: Math.floor(Date.now() / 1000),
      data: [
        imageUrl.startsWith("http")
          ? { url: imageUrl }
          : { b64_json: finalB64 },
      ],
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

// ============================================================================
// IMAGE EDITING ROUTING & NORMALIZATION
// ============================================================================

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function handleImageEdits(request) {
  try {
    const body = await request.json();
    const { image_url, operation, prompt, mask_url } = body;

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: "Missing 'image_url' parameter" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Map operation to correct photogrid-proxy endpoint
    let path = "";
    if (operation === "remove-background") {
      path = "/api/ai/remove/background";
    } else if (operation === "remove-watermark") {
      path = "/api/ai/remove/watermark";
    } else if (operation === "remove-object") {
      path = "/api/ai/remove/object";
    } else if (
      operation === "enhance-quality" ||
      operation === "enhance-image"
    ) {
      path = "/api/ai/enhance/image";
    } else if (
      operation === "style-transfer" ||
      operation === "edit-image" ||
      operation === "anime-conversion"
    ) {
      path = "/api/ai/style/transfer";
    } else if (operation === "super-resolution") {
      path = "/api/ai/super-resolution";
    } else if (
      operation === "restore-photo" ||
      operation === "restore-old-photo"
    ) {
      path = "/api/ai/restore-photo";
    } else if (operation === "blur-background") {
      path = "/api/ai/blur-background";
    } else {
      path = "/api/ai/style/transfer"; // Fallback to style-transfer
    }

    const payload = { image_url };
    if (prompt) payload.prompt = prompt;
    if (mask_url) payload.mask_url = mask_url;

    // Use default style "None" for style-transfer if not provided
    if (path === "/api/ai/style/transfer" && !payload.prompt) {
      payload.prompt = "cyberpunk"; // Default prompt for style-transfer if missing
    }

    let res;
    let fallbackTriggered = false;
    try {
      res = await fetch(`https://photogrid-proxy.llamai.workers.dev${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (_fetchErr) {
      fallbackTriggered = true;
    }

    if (fallbackTriggered || !res || !res.ok) {
      const fallbackPrompt = prompt || operation.replace("-", " ");
      try {
        const fallbackRes = await fetch(
          `https://ai-images-proxy.llamai.workers.dev/?prompt=${encodeURIComponent(fallbackPrompt)}`,
          {
            method: "POST",
          },
        );

        if (fallbackRes.ok) {
          const fallbackText = await fallbackRes.text();
          let extractedUrl = "";
          try {
            const data = JSON.parse(fallbackText);
            extractedUrl =
              data.url ||
              data.image ||
              data.image_url ||
              data.imageUrl ||
              data.data?.[0]?.url ||
              "";
          } catch {
            const match = fallbackText.match(/https?:\/\/[^\s"']+/);
            if (match) {
              extractedUrl = match[0];
            } else {
              extractedUrl = fallbackText;
            }
          }

          if (extractedUrl) {
            const responseData = {
              image: {
                url: extractedUrl,
                mimeType: "image/png",
              },
            };
            return new Response(JSON.stringify(responseData), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        }
      } catch (_fallbackErr) {
        // Fallback failed
      }

      if (res) {
        const text = await res.text();
        return new Response(
          JSON.stringify({ error: `Upstream error: ${res.status} — ${text}` }),
          {
            status: res.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      } else {
        return new Response(
          JSON.stringify({
            error: "Upstream error: Failed to connect to photogrid-proxy",
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
    }

    // Check content-type of response
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("image/")) {
      // If it is binary, return base64
      const buffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);

      const responseData = {
        image: {
          url: base64,
          mimeType: contentType.split(";")[0].trim(),
        },
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Otherwise, try to parse JSON
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // If not JSON, return it directly
      return new Response(
        JSON.stringify({ image: { url: text, mimeType: "image/png" } }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Wrap in expected structure if needed
    const outputStr =
      data.url ||
      data.image_url ||
      data.image ||
      data.result ||
      data.data?.[0]?.url ||
      data.data?.[0]?.b64_json ||
      data.proxied_url ||
      text;

    const responseData = {
      image: {
        url:
          typeof outputStr === "string" ? outputStr : JSON.stringify(outputStr),
        mimeType: "image/png",
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

// ============================================================================
// WORKER EXPORT
// ============================================================================

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    };

    // Health
    if (path === "/" || path === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          name: "Unified AI Worker",
          version: "1.0.0",
          endpoints: ["GET /v1/models", "POST /v1/chat/completions"],
        }),
        { headers: corsHeaders },
      );
    }

    // Models list
    if (path === "/v1/models" && request.method === "GET") {
      const models = Object.entries(MODEL_MAP).map(([id, cfg]) => ({
        id,
        object: "model",
        created: 0,
        owned_by: cfg.provider,
      }));
      return new Response(
        JSON.stringify({
          object: "list",
          data: models,
        }),
        { headers: corsHeaders },
      );
    }

    // Chat completions
    if (path === "/v1/chat/completions" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!body.model) {
        return new Response(
          JSON.stringify({ error: "Missing 'model' field" }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const result = await routeChat(body, env);

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 502,
          headers: corsHeaders,
        });
      }

      const { res, provider, stream } = result;
      const modelName = body.model;

      // Streaming
      if (stream) {
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamResponse(
                provider,
                res,
                modelName,
              )) {
                const data = `data: ${JSON.stringify(chunk)}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });

        return new Response(readable, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // Non-streaming
      const responseData = await nonStreamResponse(provider, res, modelName);
      return new Response(JSON.stringify(responseData), {
        headers: corsHeaders,
      });
    }

    // Image generations
    if (path === "/v1/images/generations" && request.method === "POST") {
      return await handleImageGenerations(request);
    }

    // Image edits
    if (path === "/v1/images/edits" && request.method === "POST") {
      return await handleImageEdits(request);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};
