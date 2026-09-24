import { LanguageModel } from "ai";
import {
  ANTHROPIC_FILE_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
} from "./file-support";
import { ChatModel } from "app-types/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const MULTIMODAL_WORKER_URL =
  "https://wasp-multimodal-worker.hhhlproxy.workers.dev";
export const UNIFIED_WORKER_URL = MULTIMODAL_WORKER_URL;
export const CREATIVE_WORKER_URL = MULTIMODAL_WORKER_URL;
export const CLAUDE_WORKER_URL = MULTIMODAL_WORKER_URL;

// Dedicated Multimodal Worker (DeepSeek Chat + Groq FreeCF + PicAI GPT-Image-2/FLUX)
const multimodalProvider = createOpenAICompatible({
  name: "Multimodal AI Worker",
  apiKey: "dummy",
  baseURL: `${MULTIMODAL_WORKER_URL}/v1`,
});

// Single unified provider aliases routing through multimodal worker
const unifiedProvider = multimodalProvider;
const creativeProvider = multimodalProvider;
const claudeProvider = multimodalProvider;

// Sarvam AI provider
const sarvamProvider = createOpenAICompatible({
  name: "Sarvam",
  apiKey: process.env.SARVAM_API_KEY || "dummy",
  baseURL: "https://api.sarvam.ai/v1",
  headers: {
    "api-subscription-key": process.env.SARVAM_API_KEY || "",
  },
  fetch: async (url, options) => {
    if (options?.body) {
      try {
        const parsedBody = JSON.parse(options.body as string);
        console.log(
          "[DEBUG Sarvam Request Body] Messages count:",
          parsedBody.messages?.length,
        );
        parsedBody.messages?.forEach((msg: any, idx: number) => {
          if (msg.tool_calls) {
            console.log(
              `[DEBUG Sarvam Request Body] Message ${idx} tool_calls:`,
              JSON.stringify(msg.tool_calls),
            );
          }
        });
      } catch (e) {
        console.error("[DEBUG Sarvam Request Body] Parse error:", e);
      }
    }
    return fetch(url, options);
  },
});

// HCNSEC AI Provider (Agnes 2.5 Flash / SenseNova)
export const HCNSEC_BASE_URL = "https://api.hcnsec.cn/v1";
export const HCNSEC_DEFAULT_KEYS = [
  "sk-qe2aRHBgUT6E2JTQBPYCZ24qdO7vnpTrtPfj4tLlBupa4Xru",
  "sk-jCvRq7DEZRE7EvLXWRycSDCiyfkOaNR8MC1eb2BpnNMqJpDe",
];

function getHcnsecKeys(): string[] {
  const envKeys = process.env.HCNSEC_API_KEY || process.env.HCNSEC_API_KEYS;
  if (!envKeys) return HCNSEC_DEFAULT_KEYS;
  const split = envKeys
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return split.length > 0 ? split : HCNSEC_DEFAULT_KEYS;
}

const hcnsecProvider = createOpenAICompatible({
  name: "HCNSEC",
  apiKey: "dummy",
  baseURL: HCNSEC_BASE_URL,
  fetch: async (url, options) => {
    const keys = getHcnsecKeys();
    let lastError: any;
    for (const key of keys) {
      try {
        const headers = new Headers(options?.headers || {});
        headers.set("Authorization", `Bearer ${key}`);
        const res = await fetch(url, { ...options, headers });
        if (res.ok) return res;
        if (res.status === 401 || res.status === 429) {
          continue;
        }
        return res;
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    return fetch(url, options);
  },
});

// TokenHarbor AI Provider (DeepSeek V4.1 Flash, Qwen 3.8 Flash, MiMo, etc.)
export const TOKENHARBOR_BASE_URL = "https://tokenharbor.ai/v1";
export const TOKENHARBOR_DEFAULT_KEYS = [
  "thk_live_5XKowZNJ-e-ydWUuqnbm1FO-CIAbO6HWE55G6ad00xC8YfbqGrwYN_wyVXXABLaV",
  "thk_live_7IpjJXQhhVJ-Smyx8s2LsXhKadnt6RRtIDVOWWVMdNZbDUu8m5FAi3TgSLdDAUJR",
];

export const TOKENHARBOR_FREE_MODELS = new Set([
  "deepseek-v4.1-flash:free",
  "deepseek-v4-flash:free",
  "qwen3.8-flash:free",
  "mimo-v2.6-flash:free",
  "mimo-v2.5:free",
]);

function getTokenHarborKeys(): string[] {
  const envKeys =
    process.env.TOKENHARBOR_API_KEY || process.env.TOKENHARBOR_API_KEYS;
  if (!envKeys) return TOKENHARBOR_DEFAULT_KEYS;
  const split = envKeys
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return split.length > 0 ? split : TOKENHARBOR_DEFAULT_KEYS;
}

const tokenHarborProvider = createOpenAICompatible({
  name: "TokenHarbor",
  apiKey: "dummy",
  baseURL: TOKENHARBOR_BASE_URL,
  fetch: async (url, options) => {
    const keys = getTokenHarborKeys();
    let lastError: any;
    for (const key of keys) {
      try {
        const headers = new Headers(options?.headers || {});
        headers.set("Authorization", `Bearer ${key}`);
        const res = await fetch(url, { ...options, headers });
        if (res.ok) return res;
        if (res.status === 401 || res.status === 429) {
          continue;
        }
        return res;
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    return fetch(url, options);
  },
});

// Mistral AI Provider (mistral-code-latest, ministral-14b-latest, codestral-latest)
export const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";
export const MISTRAL_DEFAULT_KEY =
  "mstrl_k8kdT2jytnkDuQeEUs9Thsr4w6ZAL20j_3ZJm1U";

export const MISTRAL_MODELS = new Set([
  "mistral-code-latest",
  "ministral-14b-latest",
  "ministral-14b",
  "codestral-latest",
]);

function getMistralKey(): string {
  return process.env.MISTRAL_API_KEY?.trim() || MISTRAL_DEFAULT_KEY;
}

const mistralProvider = createOpenAICompatible({
  name: "Mistral",
  apiKey: "dummy",
  baseURL: MISTRAL_BASE_URL,
  fetch: async (url, options) => {
    const key = getMistralKey();
    const headers = new Headers(options?.headers || {});
    headers.set("Authorization", `Bearer ${key}`);
    return fetch(url, { ...options, headers });
  },
});

// ─── MIME type heuristic ──────────────────────────────────────────────────────
function getMimeTypes(modelId: string): string[] {
  const id = modelId.toLowerCase();
  if (
    id.includes("gpt") ||
    id.includes("openai") ||
    id.includes("o1") ||
    id.includes("o3")
  ) {
    return Array.from(OPENAI_FILE_MIME_TYPES);
  }
  if (id.includes("claude") || id.includes("anthropic")) {
    return Array.from(ANTHROPIC_FILE_MIME_TYPES);
  }
  return [];
}

// ─── Worker model shape ───────────────────────────────────────────────────────
interface WorkerModel {
  id: string;
  object?: string;
  owned_by?: string;
  created?: number;
}

/**
 * Fetch the full verified model list.
 */
export async function fetchModelsFromWorker(): Promise<WorkerModel[]> {
  try {
    const res = await fetch(`${MULTIMODAL_WORKER_URL}/v1/models`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch (_err) {}

  return [
    { id: "gpt-oss-120b", owned_by: "openai" },
    { id: "deepseek-v4.1-flash:free", owned_by: "deepseek" },
    { id: "deepseek-v4-flash:free", owned_by: "deepseek" },
    { id: "qwen3.8-flash:free", owned_by: "qwen" },
    { id: "mimo-v2.6-flash:free", owned_by: "xiaomi" },
    { id: "mimo-v2.5:free", owned_by: "xiaomi" },
    { id: "mistral-code-latest", owned_by: "mistral" },
    { id: "ministral-14b-latest", owned_by: "mistral" },
    { id: "codestral-latest", owned_by: "mistral" },
  ];
}

export const DEFAULT_CHAT_MODEL: ChatModel = {
  provider: "OpenAI",
  model: "gpt-oss-120b",
};

const FREE_TIER_MODELS = new Set([
  "gpt-oss-120b",
  "gpt-oss-120b-p2",
  "openai/gpt-oss-120b",
  "deepseek-v4.1-flash:free",
  "deepseek-v4-flash:free",
  "qwen3.8-flash:free",
  "mimo-v2.6-flash:free",
  "mimo-v2.5:free",
  "mistral-code-latest",
  "ministral-14b-latest",
  "ministral-14b",
  "codestral-latest",
]);

const LOWERCASE_FREE_TIER_MODELS = new Set(
  Array.from(FREE_TIER_MODELS).map((id) => id.toLowerCase()),
);

const LOWERCASE_EXCLUDED_MODELS = new Set<string>([
  // No models currently excluded
]);

function getBaseModelId(modelId: string): string {
  const parts = modelId.split("/");
  return parts[parts.length - 1].toLowerCase();
}

export function getModelTier(modelId: string): string {
  const lowercaseModelId = modelId.toLowerCase();

  // LordRouter models are Pro tier unless explicitly registered in the free list
  if (
    lowercaseModelId.startsWith("lordrouter-") &&
    !LOWERCASE_FREE_TIER_MODELS.has(lowercaseModelId)
  ) {
    return "Pro";
  }

  const baseId = getBaseModelId(modelId);

  const isExcluded = Array.from(LOWERCASE_EXCLUDED_MODELS).some((exId) => {
    return (
      lowercaseModelId === exId ||
      baseId === exId ||
      lowercaseModelId.endsWith(`-${exId}`) ||
      lowercaseModelId.endsWith(`/${exId}`)
    );
  });
  if (isExcluded) return "Pro";

  const isFree = Array.from(LOWERCASE_FREE_TIER_MODELS).some((freeId) => {
    return (
      lowercaseModelId === freeId ||
      baseId === freeId ||
      lowercaseModelId.endsWith(`-${freeId}`) ||
      lowercaseModelId.endsWith(`/${freeId}`)
    );
  });

  return isFree ? "Free" : "Pro";
}

/**
 * Build modelsInfo from live worker data.
 * Groups models by their `owned_by` field (provider).
 */
export async function buildDynamicModelsInfo() {
  return [
    {
      provider: "OpenAI",
      hasAPIKey: true,
      models: [
        {
          name: "gpt-oss-120b",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "DeepSeek",
      hasAPIKey: true,
      models: [
        {
          name: "deepseek-v4.1-flash:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "deepseek-v4-flash:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "Qwen",
      hasAPIKey: true,
      models: [
        {
          name: "qwen3.8-flash:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "Xiaomi",
      hasAPIKey: true,
      models: [
        {
          name: "mimo-v2.6-flash:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "mimo-v2.5:free",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
    {
      provider: "Mistral",
      hasAPIKey: true,
      models: [
        {
          name: "mistral-code-latest",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "ministral-14b-latest",
          isToolCallUnsupported: false,
          isImageInputUnsupported: false,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
        {
          name: "codestral-latest",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: Array.from(OPENAI_FILE_MIME_TYPES),
          tier: "Free",
        },
      ],
    },
  ];
}

export function getModelProvider(modelId: string, ownedBy?: string): string {
  const id = modelId.toLowerCase();
  if (id === "waspai-model") return "WaspAI";
  if (id === "auto" || id.includes("agnes")) return "Agnes";
  if (id.includes("sensenova")) return "SenseNova";
  const raw = (ownedBy || "").toLowerCase();

  // Groq worker models
  if (raw === "groqworker" || id.startsWith("groqw-")) return "Groq";

  // Frenix-prefixed models: resolve to the correct vendor before broad pattern checks
  if (id.startsWith("frenix-llama")) return "Meta";
  if (id.startsWith("frenix-gemma") || id.startsWith("frenix-gemini"))
    return "Google";
  if (
    id.startsWith("frenix-mistral") ||
    id.startsWith("frenix-ministral") ||
    id.startsWith("frenix-mixtral")
  )
    return "Mistral";
  if (id.startsWith("frenix-phi")) return "Microsoft";
  if (id.startsWith("frenix-nemotron") || id.startsWith("frenix-riva"))
    return "NVIDIA";
  if (id.startsWith("frenix-glm")) return "Z-AI";
  if (id.startsWith("frenix-minimax")) return "MiniMax";
  if (id.startsWith("frenix-turbo")) return "Perplexity";
  if (id.startsWith("frenix-axion")) return "Axion";
  if (id.startsWith("frenix-qwen")) return "Qwen";
  if (id.startsWith("frenix-grok")) return "xAI";
  if (id.startsWith("frenix-")) return "Frenix";

  if (
    id.includes("claude") ||
    id.includes("anthropic") ||
    raw.includes("anthropic") ||
    raw.includes("claude") ||
    raw.includes("frenix")
  )
    return "Anthropic";
  if (
    id.includes("gemini") ||
    id.includes("gemma") ||
    raw.includes("google") ||
    raw.includes("gemini")
  )
    return "Google";
  if (
    id.includes("gpt-") ||
    id.includes("o1-") ||
    id.includes("o3-") ||
    id.includes("chatgpt") ||
    raw.includes("openai") ||
    raw.includes("gpt")
  )
    return "OpenAI";
  if (id.includes("deepseek") || raw.includes("deepseek")) return "DeepSeek";
  if (id.includes("llama") || raw.includes("meta") || raw.includes("llama"))
    return "Meta";
  if (id.includes("qwen") || raw.includes("qwen") || raw.includes("alibaba"))
    return "Qwen";
  if (
    id.includes("mistral") ||
    id.includes("mixtral") ||
    raw.includes("mistral") ||
    raw.includes("mixtral")
  )
    return "Mistral";
  if (id.includes("grok") || raw.includes("xai") || raw.includes("grok"))
    return "xAI";
  if (
    id.includes("nvidia") ||
    id.includes("nemotron") ||
    raw.includes("nvidia") ||
    raw.includes("nemotron")
  )
    return "NVIDIA";
  if (
    id.includes("phi-") ||
    id.includes("wizardlm") ||
    raw.includes("microsoft") ||
    raw.includes("phi")
  )
    return "Microsoft";
  if (
    id.includes("kimi") ||
    id.includes("moonshot") ||
    raw.includes("moonshot") ||
    raw.includes("kimi")
  )
    return "Moonshot";
  if (id.includes("minimax") || raw.includes("minimax")) return "MiniMax";
  if (
    id.includes("sonar") ||
    id.includes("perplexity") ||
    raw.includes("perplexity") ||
    raw.includes("sonar")
  )
    return "Perplexity";
  if (
    id.includes("glm") ||
    id.includes("zhipu") ||
    raw.includes("z-ai") ||
    raw.includes("zhipu") ||
    raw.includes("glm")
  )
    return "Z-AI";
  if (id.includes("step-") || raw.includes("stepfun")) return "StepFun";
  if (id.includes("mimo") || raw.includes("xiaomi") || raw.includes("mimo"))
    return "Xiaomi";
  if (id.includes("command-") || raw.includes("cohere")) return "Cohere";

  if (ownedBy) {
    if (ownedBy.toLowerCase() === "lordrouter") {
      return "Other";
    }
    return ownedBy.charAt(0).toUpperCase() + ownedBy.slice(1);
  }
  return "Other";
}

// ─── Synchronous helpers ─────────────────────────────────────────────────────

export const isToolCallUnsupportedModel = (model: LanguageModel | string) => {
  const modelId =
    typeof model === "string"
      ? model.toLowerCase()
      : ((model as any).modelId || "").toLowerCase();

  // WaspAI model natively supports tool calling
  if (modelId === "waspai-model") {
    return false;
  }

  // Sarvam models support tool calling (sarvam-105b is the only active model)
  if (modelId.startsWith("sarvam-")) {
    return false;
  }

  // GPT-OSS models support tool calling
  if (modelId.includes("gpt-oss")) {
    return false;
  }

  // LordRouter models support tool calling unless they are reasoning/thinking/qwq models
  if (modelId.startsWith("lordrouter-")) {
    if (
      modelId.includes("thinking") ||
      modelId.includes("reasoning") ||
      modelId.includes("qwq")
    ) {
      return true;
    }
    return false;
  }

  // Disable tool calls for all Frenix models (improves response time, prevents empty stream bugs)
  if (modelId.includes("frenix-")) {
    return true;
  }

  // Models that are known to NOT support tool/function calling:
  // - Small guard/safety models (llama-guard)
  // - Very small base models (llama-2-7b, phi-2)
  // - Incompatible Frenix models that fail or return empty tool calls:
  const unsupportedPatterns = [
    "llama-guard",
    "llama-2-7b",
    "llama-2-13b",
    "phi-2",
    "frenix-glm-5",
    "frenix-glm-4.7",
    "frenix-minimax-m2.5",
    "frenix-gemma-4-31b",
    "frenix-gemma-3n-e2b",
    "frenix-riva-translate",
  ];

  const isExcluded = unsupportedPatterns.some((p) => modelId.includes(p));
  if (isExcluded) return true;

  // Agnes and SenseNova models support tool calling
  if (modelId === "auto" || modelId.startsWith("sensenova")) {
    return false;
  }

  // TokenHarbor free models support tool calling
  if (modelId.endsWith(":free") || TOKENHARBOR_FREE_MODELS.has(modelId)) {
    return false;
  }

  // Mistral models support tool calling
  if (
    MISTRAL_MODELS.has(modelId) ||
    modelId.startsWith("ministral-") ||
    modelId.startsWith("codestral-") ||
    modelId === "mistral-code-latest"
  ) {
    return false;
  }

  // Legacy fallback: if it doesn't include a slash and is not a Frenix model (which we know are compatible),
  // assume it doesn't support tool calls
  if (!modelId.includes("/") && !modelId.includes("frenix-")) {
    return true;
  }

  return false;
};

export const isImageInputUnsupportedModel = (_model: LanguageModel) => {
  // We can't do a lookup anymore since there's no static catalog.
  // Instead use the model's specificationVersion or modelId if accessible.
  // For safety, allow all models through (vision check happens at tool level).
  return false;
};

export const getFilePartSupportedMimeTypes = (_model: LanguageModel) => {
  const modelId = (_model as any).modelId || "";
  const specificMimes = getMimeTypes(modelId);
  if (specificMimes.length > 0) return specificMimes;

  return [
    ...Array.from(OPENAI_FILE_MIME_TYPES),
    ...Array.from(ANTHROPIC_FILE_MIME_TYPES),
  ];
};

// ─── Model provider ───────────────────────────────────────────────────────────

export const customModelProvider = {
  /**
   * modelsInfo is now empty at build time.
   * The /api/chat/models route fetches dynamically from the worker.
   */
  modelsInfo: [] as {
    provider: string;
    hasAPIKey: boolean;
    models: {
      name: string;
      isToolCallUnsupported: boolean;
      isImageInputUnsupported: boolean;
      supportedFileMimeTypes: string[];
      tier: string;
    }[];
  }[],

  /**
   * Get a model instance from the unified worker.
   * No lookup table needed — all models use the same provider.
   */
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) throw new Error("No model specified");
    const modelId = model.model;

    // Mistral provider (mistral-code-latest, ministral-14b-latest, codestral-latest)
    if (
      model.provider === "Mistral" ||
      model.provider?.toLowerCase() === "mistral" ||
      MISTRAL_MODELS.has(modelId) ||
      modelId === "ministral-14b" ||
      modelId === "ministral-14b-latest" ||
      modelId === "mistral-code-latest" ||
      modelId === "codestral-latest"
    ) {
      const resolvedId =
        modelId === "ministral-14b" ? "ministral-14b-latest" : modelId;
      return mistralProvider(resolvedId) as unknown as LanguageModel;
    }

    // TokenHarbor provider (DeepSeek V4.1 Flash, Qwen 3.8 Flash, MiMo, etc.)
    if (
      model.provider === "TokenHarbor" ||
      modelId.endsWith(":free") ||
      TOKENHARBOR_FREE_MODELS.has(modelId)
    ) {
      return tokenHarborProvider(modelId) as unknown as LanguageModel;
    }

    if (
      model.provider === "Agnes" ||
      model.provider === "SenseNova" ||
      model.provider === "HCNSEC" ||
      modelId === "auto" ||
      modelId === "sensenova-6.8-flash-lite"
    ) {
      return hcnsecProvider(modelId) as unknown as LanguageModel;
    }

    if (model.provider === "Sarvam" || modelId.startsWith("sarvam-")) {
      return sarvamProvider(modelId) as unknown as LanguageModel;
    }

    // Groq & Open Source models & DeepSeek routed via dedicated Multimodal Worker
    if (
      model.provider?.toLowerCase() === "groq" ||
      model.provider?.toLowerCase() === "deepseek" ||
      modelId.startsWith("groqw-") ||
      modelId.startsWith("deepseek-") ||
      modelId.startsWith("llama-") ||
      modelId.startsWith("gpt-oss-") ||
      modelId === "gpt-oss-120b" ||
      modelId === "gpt-oss-120b-p2" ||
      modelId === "deepseek-v4-flash"
    ) {
      return multimodalProvider(modelId) as unknown as LanguageModel;
    }

    // Default safe fallback: route through multimodal worker preserving modelId
    return multimodalProvider(modelId) as unknown as LanguageModel;
  },
};

export function sanitizeMessageToolCalls<
  T extends { parts?: any; toolInvocations?: any },
>(messages: T[]): T[] {
  return messages.map((msg) => {
    if (!msg.parts || !Array.isArray(msg.parts)) {
      if (
        (msg as any).toolInvocations &&
        Array.isArray((msg as any).toolInvocations)
      ) {
        return {
          ...msg,
          toolInvocations: (msg as any).toolInvocations.map((inv: any) => {
            let cleanArgs = inv.args;
            if (cleanArgs === null || cleanArgs === undefined) {
              cleanArgs = {};
            } else if (typeof cleanArgs === "string") {
              try {
                const parsed = JSON.parse(cleanArgs);
                if (
                  parsed &&
                  typeof parsed === "object" &&
                  !Array.isArray(parsed)
                ) {
                  cleanArgs = parsed;
                } else {
                  cleanArgs = {};
                }
              } catch {
                cleanArgs = {};
              }
            } else if (
              typeof cleanArgs !== "object" ||
              Array.isArray(cleanArgs)
            ) {
              cleanArgs = {};
            }
            return { ...inv, args: cleanArgs };
          }),
        };
      }
      return msg;
    }

    return {
      ...msg,
      parts: msg.parts.map((part: any) => {
        if (
          part.type === "tool-call" ||
          part.type === "dynamic-tool" ||
          part.type?.startsWith("tool-")
        ) {
          let cleanArgs = part.args !== undefined ? part.args : part.input;
          if (cleanArgs === null || cleanArgs === undefined) {
            cleanArgs = {};
          } else if (typeof cleanArgs === "string") {
            try {
              const parsed = JSON.parse(cleanArgs);
              if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
              ) {
                cleanArgs = parsed;
              } else {
                cleanArgs = {};
              }
            } catch {
              cleanArgs = {};
            }
          } else if (
            typeof cleanArgs !== "object" ||
            Array.isArray(cleanArgs)
          ) {
            cleanArgs = {};
          }
          return {
            ...part,
            args: cleanArgs,
            input: cleanArgs,
          };
        }
        return part;
      }),
    };
  });
}

export { unifiedProvider, creativeProvider, claudeProvider };
