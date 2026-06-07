var __defProp = Object.defineProperty;
var __name = (target, value) =>
  __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-FBkCWl/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url =
    request instanceof URL
      ? request
      : new URL(
          (typeof request === "string" ? new Request(request, init) : request)
            .url,
        );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`,
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  },
});

// src/index.js
var MODEL_MAP = {
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
  "gpt-oss-20b": { provider: "lordrouter", model: "openai/gpt-oss-20b:free" },
  "gpt-5-nano": { provider: "gptossworker", model: "gpt-5-nano" },
  // Raw / Legacy Claude Models — routed via LordRouter which supports system messages
  "claude-sonnet": { provider: "lordrouter", model: "claude-sonnet-4-6" },
  "claude-3-sonnet": { provider: "lordrouter", model: "claude-sonnet-4-6" },
  "claude-sonnet-4.5": { provider: "lordrouter", model: "claude-sonnet-4-6" },
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
  // SvelteAI (5 working - routed via working proxies because svelteai upstream is down)
  "svelteai-gpt-4o": { provider: "chatai", model: "gpt-4o" },
  "svelteai-gpt-4o-mini": { provider: "chatai", model: "gpt-4o-mini" },
  "svelteai-gpt-4": { provider: "chatbotai", model: "gpt-4" },
  "svelteai-gpt-3.5-turbo": {
    provider: "chatai",
    model: "gpt-3.5-turbo",
  },
  "svelteai-gpt-3.5-16k": {
    provider: "chatai",
    model: "gpt-3.5-turbo",
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
  "google-gemma-2-9b-it": { provider: "freecf", model: "gemma-3-12b" },
  "gemma-2-9b-it": { provider: "freecf", model: "gemma-3-12b" },
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
var LORDROUTER_MODELS = [
  "@cf/moonshotai/kimi-k2.5",
  "@cf/moonshotai/kimi-k2.6",
  "claude-opus-4-1",
  "claude-opus-4-5",
  "claude-opus-4-6",
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "deepseek-r1",
  "deepseek-v3",
  "deepseek-v4-flash",
  "deepseek-v4-pro",
  "gemini-2.5-pro",
  "gemini-3-pro",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro",
  "gemini-3.5-flash",
  "gemini-3.5-flash-thinking",
  "gemini-3.5-flash-thinking-lite",
  "gemini-auto",
  "gemini-flash-lite",
  "gemma-4-26b-a4b-it",
  "gemma-4-31b-it",
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "gpt-5",
  "gpt-5-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5.1",
  "gpt-5.3",
  "gpt-5.3-chat-latest",
  "gpt-5.4",
  "gpt-5.5",
  "grok-4",
  "kimi-k2",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
  "llama-3.3-70b",
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "moonshotai/kimi-k2.6:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "o3",
  "o3-mini",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "poolside/laguna-m.1:free",
  "poolside/laguna-xs.2:free",
  "qwen-3-max",
  "qwen-qwq-32b",
  "qwen/qwen3-coder:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "stepfun-ai/step-3.5-flash",
  "stepfun-ai/step-3.7-flash",
  "z-ai/glm-4.5-air:free",
];
for (const model of LORDROUTER_MODELS) {
  MODEL_MAP[`lordrouter-${model}`] = { provider: "lordrouter", model };
}
var PROVIDERS = {
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
  lordrouter: {
    base: "https://lordrouter.xyz/v1",
    keys: ["sk-6dF5EeJRn45B8ZUvfPZDTl1ETxICiaBtfrdVp8PgC1SuEm4z"],
    openai: true,
  },
};
function randomUUID() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 3) | 8).toString(16);
      });
}
__name(randomUUID, "randomUUID");
var ALLOWED_PARAMS = [
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
    if (data[key] !== void 0) {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}
__name(sanitizePayload, "sanitizePayload");
function buildOpenAIRequest(body, mappedModel) {
  return { ...sanitizePayload(body), model: mappedModel };
}
__name(buildOpenAIRequest, "buildOpenAIRequest");
function buildFrenixRequest(body, mappedModel) {
  const payload = sanitizePayload(body);
  delete payload.tools;
  delete payload.tool_choice;
  return { ...payload, model: mappedModel };
}
__name(buildFrenixRequest, "buildFrenixRequest");
function buildMakeChatRequest(body) {
  return {
    messages: body.messages,
    model: body.model || "gpt-4o-mini",
    stream: body.stream ?? false,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens ?? 2048,
  };
}
__name(buildMakeChatRequest, "buildMakeChatRequest");
function buildFreeGPTBlondRequest(body) {
  return {
    message: body.messages?.[body.messages.length - 1]?.content || "",
    model: body.model || "gpt-4o-mini",
    stream: body.stream ?? false,
  };
}
__name(buildFreeGPTBlondRequest, "buildFreeGPTBlondRequest");
function buildKimiK2Request(body) {
  return {
    message: body.messages?.[body.messages.length - 1]?.content || "",
    model: body.model || "kimi-k2",
    stream: body.stream ?? true,
  };
}
__name(buildKimiK2Request, "buildKimiK2Request");
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
__name(buildLLMChatRequest, "buildLLMChatRequest");
function buildAimirrorRequest(body) {
  return {
    message: body.messages?.[body.messages.length - 1]?.content || "",
    model: body.model || "default",
    stream: true,
  };
}
__name(buildAimirrorRequest, "buildAimirrorRequest");
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
__name(buildGeminiRequest, "buildGeminiRequest");
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
__name(buildQuillbotRequest, "buildQuillbotRequest");
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
__name(buildGPTOSSDirectRequest, "buildGPTOSSDirectRequest");
function parseLLMChatStream(chunk) {
  try {
    const j = JSON.parse(chunk);
    return j.generated_text || "";
  } catch {
    return "";
  }
}
__name(parseLLMChatStream, "parseLLMChatStream");
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
__name(parseAimirrorSSE, "parseAimirrorSSE");
function parseGeminiResponse(data) {
  try {
    const j = JSON.parse(data);
    return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch {
    return "";
  }
}
__name(parseGeminiResponse, "parseGeminiResponse");
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
__name(parseGPTOSSDirect, "parseGPTOSSDirect");
function getMappedModel(providerKey, originalModel) {
  const mappedDirect = MODEL_MAP[originalModel];
  if (mappedDirect && mappedDirect.provider === providerKey) {
    return mappedDirect.model;
  }
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
  const fallbackKey = `${providerKey}-${baseName}`;
  const fallbackMapped = MODEL_MAP[fallbackKey];
  if (fallbackMapped) {
    return fallbackMapped.model;
  }
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
__name(getMappedModel, "getMappedModel");
async function fetchFromProvider(
  providerKey,
  body,
  env,
  stream = false,
  clientIp = "",
) {
  const cfg = PROVIDERS[providerKey];
  if (!cfg) throw new Error(`Unknown provider: ${providerKey}`);
  if (providerKey === "botnation") {
    throw new Error("botnation provider is currently disabled");
  }
  const mappedModel = getMappedModel(providerKey, body.model);
  let actualStream = stream;
  if (providerKey === "groqworker" && mappedModel === "openai/gpt-oss-120b") {
    actualStream = false;
  }
  let apiKey = null;
  if (cfg.keys && Array.isArray(cfg.keys)) {
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
    case "lordrouter":
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
  if (
    providerKey === "groqworker" &&
    mappedModel === "openai/gpt-oss-120b" &&
    reqBody
  ) {
    reqBody.stream = false;
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
  if (clientIp) {
    fetchOpts.headers["X-Forwarded-For"] = clientIp;
    fetchOpts.headers["X-Real-IP"] = clientIp;
    fetchOpts.headers["CF-Connecting-IP"] = clientIp;
  }
  if (actualStream && cfg.openai) {
    fetchOpts.headers["Accept"] = "text/event-stream";
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15e3);
  let res;
  try {
    res = await fetch(url, {
      ...fetchOpts,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        "Timeout: The model provider took longer than 15 seconds to respond.",
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  return { res, providerKey, cfg };
}
__name(fetchFromProvider, "fetchFromProvider");
async function* streamResponse(providerKey, res, model) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    const text = await res.text();
    let content = "";
    let reasoning_content = "";
    let tool_calls = null;
    try {
      const responseData = await nonStreamResponse(
        providerKey,
        { text: /* @__PURE__ */ __name(() => Promise.resolve(text), "text") },
        model,
      );
      const msg = responseData.choices?.[0]?.message;
      if (msg) {
        content = msg.content || "";
        reasoning_content = msg.reasoning_content || msg.reasoning || "";
        tool_calls = msg.tool_calls || null;
      }
    } catch {
      content = text;
    }
    if (!reasoning_content && !content && !tool_calls) {
      content =
        "I wasn't able to generate a response through this model. Please try again or switch to a different model.";
    }
    if (reasoning_content) {
      yield {
        id: `chatcmpl-${randomUUID()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1e3),
        model,
        choices: [
          {
            index: 0,
            delta: { reasoning_content },
            finish_reason: null,
          },
        ],
      };
    }
    if (content) {
      yield {
        id: `chatcmpl-${randomUUID()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1e3),
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
    if (tool_calls) {
      yield {
        id: `chatcmpl-${randomUUID()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1e3),
        model,
        choices: [
          {
            index: 0,
            delta: { tool_calls },
            finish_reason: null,
          },
        ],
      };
    }
    yield {
      id: `chatcmpl-${randomUUID()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1e3),
      model,
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
    };
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasYieldedContent = false;
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
        case "zerovai":
        case "lordrouter":
        case "frenix":
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const j = JSON.parse(data);
              const choice = j.choices?.[0];
              if (choice) {
                delta = choice.delta;
                if (delta) {
                  if (delta.reasoning && !delta.reasoning_content) {
                    delta.reasoning_content = delta.reasoning;
                  }
                  if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
                    delta.tool_calls = delta.tool_calls.map((tc, idx) => {
                      if (tc.index === void 0) {
                        return { ...tc, index: idx };
                      }
                      return tc;
                    });
                  }
                }
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
          created: Math.floor(Date.now() / 1e3),
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
  if (!hasYieldedContent) {
    yield {
      id: `chatcmpl-${randomUUID()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1e3),
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
  yield {
    id: `chatcmpl-${randomUUID()}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1e3),
    model,
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
  };
}
__name(streamResponse, "streamResponse");
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
        const choice = j.choices?.[0];
        if (choice && choice.message) {
          if (choice.message.reasoning && !choice.message.reasoning_content) {
            choice.message.reasoning_content = choice.message.reasoning;
          }
        }
        return j;
      } catch {
        return createOpenAIResponse(model, text);
      }
    case "lordrouter":
      try {
        const j = JSON.parse(text);
        const choice = j.choices?.[0];
        if (choice && choice.message) {
          if (choice.message.reasoning && !choice.message.reasoning_content) {
            choice.message.reasoning_content = choice.message.reasoning;
          }
          if (!choice.message.content) {
            choice.message.content = choice.message.reasoning_content || "";
          }
        }
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
__name(nonStreamResponse, "nonStreamResponse");
function createOpenAIResponse(model, content) {
  return {
    id: `chatcmpl-${randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1e3),
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
__name(createOpenAIResponse, "createOpenAIResponse");
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
__name(getFallbackProvider, "getFallbackProvider");
async function routeChat(body, env, clientIp = "") {
  const modelName = body.model;
  const mapped = MODEL_MAP[modelName];
  if (!mapped) {
    return {
      error: `Unknown model: ${modelName}. Use GET /v1/models to see available models.`,
    };
  }
  const stream = body.stream ?? false;
  let provider = mapped.provider;
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { res } = await fetchFromProvider(
        provider,
        body,
        env,
        stream,
        clientIp,
      );
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
__name(routeChat, "routeChat");
async function handleImageGenerations(request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;
    let model = body.model || "flux-schnell";
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
          error: `Upstream error: ${res.status} \u2014 ${errorText}`,
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
    const responseBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(responseBuffer);
    const contentType = res.headers.get("content-type") || "";
    const isPng =
      bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const isJpeg = bytes[0] === 255 && bytes[1] === 216;
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
      const responseData2 = {
        created: Math.floor(Date.now() / 1e3),
        data: [{ b64_json: base64Data }],
      };
      return new Response(JSON.stringify(responseData2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    const text = new TextDecoder("iso-8859-1").decode(responseBuffer);
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
      const match = text.match(/https?:\/\/[^\s"']+/);
      if (match) {
        imageUrl = match[0];
      } else if (text.length > 100) {
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
    let finalB64 = imageUrl;
    if (!imageUrl.startsWith("http")) {
      const isRawBinary =
        imageUrl.startsWith("\x89PNG") ||
        imageUrl.includes("PNG") ||
        imageUrl.startsWith("\xFF\xD8") || // JPEG magic
        !/^[A-Za-z0-9+/=\s]+$/.test(imageUrl);
      if (isRawBinary) {
        const bytes2 = new Uint8Array(imageUrl.length);
        for (let i = 0; i < imageUrl.length; i++) {
          bytes2[i] = imageUrl.charCodeAt(i);
        }
        let binaryString = "";
        const len = bytes2.byteLength;
        for (let i = 0; i < len; i++) {
          binaryString += String.fromCharCode(bytes2[i]);
        }
        finalB64 = btoa(binaryString);
      }
    }
    const responseData = {
      created: Math.floor(Date.now() / 1e3),
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
__name(handleImageGenerations, "handleImageGenerations");
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
__name(arrayBufferToBase64, "arrayBufferToBase64");
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
      path = "/api/ai/style/transfer";
    }
    const payload = { image_url };
    if (prompt) payload.prompt = prompt;
    if (mask_url) payload.mask_url = mask_url;
    if (path === "/api/ai/style/transfer" && !payload.prompt) {
      payload.prompt = "cyberpunk";
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
            const data2 = JSON.parse(fallbackText);
            extractedUrl =
              data2.url ||
              data2.image ||
              data2.image_url ||
              data2.imageUrl ||
              data2.data?.[0]?.url ||
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
            const responseData2 = {
              image: {
                url: extractedUrl,
                mimeType: "image/png",
              },
            };
            return new Response(JSON.stringify(responseData2), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        }
      } catch (_fallbackErr) {}
      if (res) {
        const text2 = await res.text();
        return new Response(
          JSON.stringify({
            error: `Upstream error: ${res.status} \u2014 ${text2}`,
          }),
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
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("image/")) {
      const buffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const responseData2 = {
        image: {
          url: base64,
          mimeType: contentType.split(";")[0].trim(),
        },
      };
      return new Response(JSON.stringify(responseData2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
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
__name(handleImageEdits, "handleImageEdits");
var src_default = {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
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
      const clientIp =
        request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Real-IP") ||
        "";
      const result = await routeChat(body, env, clientIp);
      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 502,
          headers: corsHeaders,
        });
      }
      const { res, provider, stream } = result;
      const modelName = body.model;
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
                const data = `data: ${JSON.stringify(chunk)}

`;
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
      const responseData = await nonStreamResponse(provider, res, modelName);
      return new Response(JSON.stringify(responseData), {
        headers: corsHeaders,
      });
    }
    if (path === "/v1/images/generations" && request.method === "POST") {
      return await handleImageGenerations(request);
    }
    if (path === "/v1/images/edits" && request.method === "POST") {
      return await handleImageEdits(request);
    }
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: corsHeaders,
    });
  },
};

// C:/Users/Ronit/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(
  async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } finally {
      try {
        if (request.body !== null && !request.bodyUsed) {
          const reader = request.body.getReader();
          while (!(await reader.read()).done) {}
        }
      } catch (e) {
        console.error("Failed to drain the unused request body.", e);
      }
    }
  },
  "drainBody",
);
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/Ronit/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause),
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(
  async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } catch (e) {
      const error = reduceError(e);
      return Response.json(error, {
        status: 500,
        headers: { "MF-Experimental-Error-Stack": "true" },
      });
    }
  },
  "jsonError",
);
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-FBkCWl/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default,
];
var middleware_insertion_facade_default = src_default;

// C:/Users/Ronit/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    },
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware,
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-FBkCWl/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (
    __INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 ||
    __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0
  ) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function (request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function (type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {},
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    },
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (
    __INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 ||
    __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0
  ) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {},
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher,
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default,
};
//# sourceMappingURL=index.js.map
