import { LanguageModel } from "ai";
import {
  ANTHROPIC_FILE_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
} from "./file-support";
import { ChatModel } from "app-types/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const UNIFIED_WORKER_URL =
  "https://unified-ai-worker.rutv.workers.dev";

// Single unified provider — every model routes through the worker
const unifiedProvider = createOpenAICompatible({
  name: "Unified AI Worker",
  apiKey: "dummy",
  baseURL: `${UNIFIED_WORKER_URL}/v1`,
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
  if (id.includes("gpt") || id.includes("openai") || id.includes("o1") || id.includes("o3")) {
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
    const res = await fetch(`${UNIFIED_WORKER_URL}/v1/models`, {
      next: { revalidate: 300 }, // cache 5 min
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Worker /v1/models returned ${res.status}`);
    const json: WorkerModelsResponse = await res.json();
    return json.data ?? [];
  } catch (err) {
    console.error("[models] Failed to fetch from unified worker:", err);
    return [];
  }
}

/**
 * Build modelsInfo from live worker data.
 * Groups models by their `owned_by` field (provider).
 */
export async function buildDynamicModelsInfo() {
  const workerModels = await fetchModelsFromWorker();

  // Group by provider (owned_by)
  const grouped = new Map<string, WorkerModel[]>();
  for (const m of workerModels) {
    const provider = normalizeProvider(m.owned_by ?? "Other");
    if (!grouped.has(provider)) grouped.set(provider, []);
    grouped.get(provider)!.push(m);
  }

  return Array.from(grouped.entries()).map(([provider, models]) => ({
    provider,
    hasAPIKey: false,
    models: models.map((m) => ({
      name: m.id,
      isToolCallUnsupported: false,
      isImageInputUnsupported: !isVisionModel(m.id),
      supportedFileMimeTypes: getMimeTypes(m.id),
      tier: "Free",
    })),
  }));
}

function normalizeProvider(raw: string): string {
  const p = raw.toLowerCase();
  if (p.includes("anthropic") || p.includes("claude")) return "Anthropic";
  if (p.includes("openai") || p.includes("gpt")) return "OpenAI";
  if (p.includes("google") || p.includes("gemini")) return "Google";
  if (p.includes("deepseek")) return "DeepSeek";
  if (p.includes("meta") || p.includes("llama")) return "Meta";
  if (p.includes("qwen") || p.includes("alibaba")) return "Qwen";
  if (p.includes("mistral") || p.includes("mixtral")) return "Mistral";
  if (p.includes("xai") || p.includes("grok")) return "xAI";
  if (p.includes("nvidia") || p.includes("nemotron")) return "NVIDIA";
  if (p.includes("microsoft") || p.includes("phi")) return "Microsoft";
  if (p.includes("moonshot") || p.includes("kimi")) return "Moonshot";
  if (p.includes("minimax")) return "MiniMax";
  if (p.includes("perplexity") || p.includes("sonar")) return "Perplexity";
  if (p.includes("z-ai") || p.includes("glm") || p.includes("zhipu")) return "Z-AI";
  if (p.includes("stepfun")) return "StepFun";
  if (p.includes("xiaomi") || p.includes("mimo")) return "Xiaomi";
  return raw; // keep as-is if unknown
}

// ─── Synchronous helpers ─────────────────────────────────────────────────────

export const isToolCallUnsupportedModel = (_model: LanguageModel) => false;

export const isImageInputUnsupportedModel = (model: LanguageModel) => {
  // We can't do a lookup anymore since there's no static catalog.
  // Instead use the model's specificationVersion or modelId if accessible.
  // For safety, allow all models through (vision check happens at tool level).
  return false;
};

export const getFilePartSupportedMimeTypes = (_model: LanguageModel) => {
  // Without a static catalog we can't determine MIME types per model synchronously.
  // Return a generous set that works for most models.
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
    // model.model is the model ID as shown in the UI / stored in DB
    return unifiedProvider(model.model) as unknown as LanguageModel;
  },
};

export { unifiedProvider };
