import { LanguageModel } from "ai";
import {
  ANTHROPIC_FILE_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
} from "./file-support";
import { ChatModel } from "app-types/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const UNIFIED_WORKER_URL = "https://nvidia-nim-worker.rutv.workers.dev";
export const CREATIVE_WORKER_URL = "https://unified-ai-worker.rutv.workers.dev";

// Single unified provider — every model routes through the worker
const unifiedProvider = createOpenAICompatible({
  name: "Unified AI Worker",
  apiKey: "dummy",
  baseURL: `${UNIFIED_WORKER_URL}/v1`,
});

// Creative AI worker provider for open-source / fallback models
const creativeProvider = createOpenAICompatible({
  name: "Creative AI Worker",
  apiKey: "dummy",
  baseURL: `${CREATIVE_WORKER_URL}/v1`,
});

// Sarvam AI provider
const sarvamProvider = createOpenAICompatible({
  name: "Sarvam",
  apiKey: process.env.SARVAM_API_KEY || "dummy",
  baseURL: "https://api.sarvam.ai/v1",
  headers: {
    "api-subscription-key": process.env.SARVAM_API_KEY || "",
  },
});

// ─── Vision / image-input heuristic ──────────────────────────────────────────
// Models whose IDs contain these keywords support image input.
const VISION_KEYWORDS = [
  "vision",
  "vl",
  "multimodal",
  "image-preview",
  "image-gen",
  "gemini",
  "gpt-4o",
  "gpt-4-turbo",
  "claude-3",
  "claude-4",
];

function isVisionModel(modelId: string): boolean {
  const id = modelId.toLowerCase();
  return VISION_KEYWORDS.some((kw) => id.includes(kw));
}

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

interface WorkerModelsResponse {
  object?: string;
  data: WorkerModel[];
}

/**
 * Fetch the full model list from the unified worker.
 * Cached for 5 minutes using Next.js fetch cache.
 */
export async function fetchModelsFromWorker(): Promise<WorkerModel[]> {
  try {
    const [resNvidia, resCreative] = await Promise.allSettled([
      fetch(`${UNIFIED_WORKER_URL}/v1/models`, {
        next: { revalidate: 300 }, // cache 5 min
        headers: { Accept: "application/json" },
      }).then(async (r) => {
        if (!r.ok) throw new Error(`NVIDIA worker returned ${r.status}`);
        return r.json() as Promise<WorkerModelsResponse>;
      }),
      fetch(`${CREATIVE_WORKER_URL}/v1/models`, {
        next: { revalidate: 300 }, // cache 5 min
        headers: { Accept: "application/json" },
      }).then(async (r) => {
        if (!r.ok) throw new Error(`Creative worker returned ${r.status}`);
        return r.json() as Promise<WorkerModelsResponse>;
      }),
    ]);

    const models: WorkerModel[] = [];

    if (resNvidia.status === "fulfilled" && resNvidia.value?.data) {
      models.push(...resNvidia.value.data);
    } else if (resNvidia.status === "rejected") {
      console.error(
        "[models] Failed to fetch from NVIDIA worker:",
        resNvidia.reason,
      );
    }

    if (resCreative.status === "fulfilled" && resCreative.value?.data) {
      models.push(...resCreative.value.data);
    } else if (resCreative.status === "rejected") {
      console.error(
        "[models] Failed to fetch from Creative worker:",
        resCreative.reason,
      );
    }

    return models;
  } catch (err) {
    console.error("[models] Failed to fetch from workers:", err);
    return [];
  }
}

/**
 * Build modelsInfo from live worker data.
 * Groups models by their `owned_by` field (provider).
 */
export async function buildDynamicModelsInfo() {
  const rawWorkerModels = await fetchModelsFromWorker();

  // Deduplicate models by ID (some workers return the same model multiple times)
  const seen = new Set<string>();
  const workerModels = rawWorkerModels.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  // Filter out image, video, and audio models
  const chatModels = workerModels.filter((m) => {
    const ownedBy = (m.owned_by ?? "").toLowerCase();
    const id = m.id.toLowerCase();

    const imageVideoProviders = [
      "pimage",
      "cfimg",
      "pollinations",
      "genmyart",
      "magicstudio",
      "aiimages",
      "imageworldking",
      "runware",
      "aitubo",
      "raphaelai",
      "swiftsora",
    ];

    if (imageVideoProviders.includes(ownedBy)) return false;

    // Exclude image/video keywords in ID
    if (
      id.includes("flux") ||
      id.includes("sdxl") ||
      id.includes("sora") ||
      id.includes("dreamshaper") ||
      id.startsWith("gma-") ||
      id.startsWith("ms-") ||
      id.startsWith("ra-")
    ) {
      return false;
    }

    // Exclude speech/whisper models
    if (id.includes("whisper")) return false;

    return true;
  });

  // Group by provider determined dynamically
  const grouped = new Map<string, WorkerModel[]>();
  for (const m of chatModels) {
    const provider = getModelProvider(m.id, m.owned_by);
    if (!grouped.has(provider)) grouped.set(provider, []);
    grouped.get(provider)!.push(m);
  }

  const result = Array.from(grouped.entries()).map(([provider, models]) => ({
    provider,
    hasAPIKey: true,
    models: models
      .map((m) => ({
        name: m.id,
        isToolCallUnsupported: !m.id.includes("/"),
        isImageInputUnsupported: !isVisionModel(m.id),
        supportedFileMimeTypes: getMimeTypes(m.id),
        tier: "Free",
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  if (process.env.SARVAM_API_KEY) {
    result.push({
      provider: "Sarvam",
      hasAPIKey: true,
      models: [
        {
          name: "sarvam-30b",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: [],
          tier: "Sarvam",
        },
        {
          name: "sarvam-105b",
          isToolCallUnsupported: false,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: [],
          tier: "Sarvam",
        },
        {
          name: "sarvam-m",
          isToolCallUnsupported: true,
          isImageInputUnsupported: true,
          supportedFileMimeTypes: [],
          tier: "Legacy",
        }
      ]
    });
  }

  return result;
}

function getModelProvider(modelId: string, ownedBy?: string): string {
  const id = modelId.toLowerCase();
  const raw = (ownedBy || "").toLowerCase();

  if (
    id.includes("claude") ||
    id.includes("anthropic") ||
    raw.includes("anthropic") ||
    raw.includes("claude")
  )
    return "Anthropic";
  if (
    id.includes("gpt-") ||
    id.includes("o1-") ||
    id.includes("o3-") ||
    id.includes("chatgpt") ||
    raw.includes("openai") ||
    raw.includes("gpt")
  )
    return "OpenAI";
  if (
    id.includes("gemini") ||
    id.includes("gemma") ||
    raw.includes("google") ||
    raw.includes("gemini")
  )
    return "Google";
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
    return ownedBy.charAt(0).toUpperCase() + ownedBy.slice(1);
  }
  return "Other";
}

// ─── Synchronous helpers ─────────────────────────────────────────────────────

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  const modelId = (model as any).modelId || "";
  if (modelId && !modelId.includes("/")) {
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

    if (model.provider === "Sarvam" || modelId.startsWith("sarvam-")) {
      return sarvamProvider(modelId) as unknown as LanguageModel;
    }

    // NVIDIA NIM models on the nvidia-nim-worker always have a slash in their ID (e.g., 'meta/llama-3.1-8b-instruct')
    // Open-source/creative worker models on unified-ai-worker do not contain a slash (e.g., 'llama-3.2-1b', 'chatai-gpt-4o')
    if (modelId.includes("/")) {
      return unifiedProvider(modelId) as unknown as LanguageModel;
    }

    return creativeProvider(modelId) as unknown as LanguageModel;
  },
};

export { unifiedProvider };
