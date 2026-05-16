import { LanguageModel } from "ai";
import {
  ANTHROPIC_FILE_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
} from "./file-support";
import { ChatModel } from "app-types/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const UNIFIED_WORKER_URL = "https://unified-ai-worker.rutv.workers.dev";

// Single unified provider — all models go through one worker
const unifiedProvider = createOpenAICompatible({
  name: "Unified AI Worker",
  apiKey: "dummy",
  baseURL: `${UNIFIED_WORKER_URL}/v1`,
});

// ─── Model Catalog ───────────────────────────────────────────────────────────

const staticModels = {
  // --- Anthropic Claude Models ---
  Anthropic: {
    "Claude 3.5 Sonnet": unifiedProvider("claude-3-5-sonnet-20241022"),
    "Claude 4.5 Sonnet": unifiedProvider("claude-sonnet-4.5"),
    "Claude 3.5 Haiku": unifiedProvider("claude-3-5-haiku-20241022"),
    "Claude 4.5 Haiku": unifiedProvider("claude-haiku-4.5"),
    "Claude 3.5 Sonnet (Reason)": unifiedProvider(
      "claude-3-5-sonnet-reasoning",
    ),
    "Claude 3 Opus": unifiedProvider("claude-3-opus-20240229"),
    "Claude 4.5 Opus": unifiedProvider("claude-opus-4.5"),
    "Claude 3 Sonnet": unifiedProvider("claude-3-sonnet-20240229"),
    "Claude 3 Haiku": unifiedProvider("claude-3-haiku-20240307"),
    "Claude 2": unifiedProvider("claude-2"),
    "Claude Instant": unifiedProvider("claude-instant"),
  },

  // --- OpenAI Models ---
  OpenAI: {
    "GPT-4o": unifiedProvider("gpt-4o"),
    "GPT-4o Mini": unifiedProvider("gpt-4o-mini"),
    "ChatGPT-4o (Latest)": unifiedProvider("chatgpt-4o-latest"),
    "GPT-5.2": unifiedProvider("gpt-5.2"),
    "GPT-4 Turbo": unifiedProvider("gpt-4-turbo"),
    "GPT-4": unifiedProvider("gpt-4"),
    "GPT-3.5 Turbo": unifiedProvider("gpt-3.5-turbo"),
    o1: unifiedProvider("o1"),
    "o1-mini": unifiedProvider("o1-mini"),
    "o1-preview": unifiedProvider("o1-preview"),
    "o3-mini": unifiedProvider("o3-mini"),
    "GPT-4.1": unifiedProvider("gpt-4.1"),
    "GPT-4.1 Mini": unifiedProvider("gpt-4.1-mini"),
    "GPT-4.1 Nano": unifiedProvider("gpt-4.1-nano"),
    "GPT-4o Search Preview": unifiedProvider("gpt-4o-search-preview"),
    "GPT-OSS 20B": unifiedProvider("openai-gpt-oss-20b"),
    "GPT-OSS 120B": unifiedProvider("openai-gpt-oss-120b"),
  },

  // --- DeepSeek Models ---
  DeepSeek: {
    "DeepSeek V3.2": unifiedProvider("deepseek-v3.2"),
    "DeepSeek V3": unifiedProvider("deepseek-v3"),
    "DeepSeek VL": unifiedProvider("deepseek-vl"),
    "DeepSeek V2": unifiedProvider("deepseek-v2"),
    "DeepSeek R1": unifiedProvider("deepseek-r1"),
    "DeepSeek Reasoner": unifiedProvider("deepseek-reasoner"),
    "DeepSeek Chat": unifiedProvider("deepseek-chat"),
    "DeepSeek Coder": unifiedProvider("deepseek-coder"),
    "DeepSeek R1 Distill 8B": unifiedProvider(
      "deepseek-ai/deepseek-r1-distill-llama-8b",
    ),
  },

  // --- Google Gemini Models ---
  Google: {
    "Gemini 3 Pro": unifiedProvider("gemini-3-pro"),
    "Gemini 3.1 Flash Image": unifiedProvider(
      "gemini-3.1-flash-image-preview",
    ),
    "Gemini 3 Flash": unifiedProvider("gemini-3-flash-preview"),
    "Gemini 2.0 Flash": unifiedProvider("gemini-2.0-flash"),
  },

  // --- xAI (Grok) Models ---
  xAI: {
    "Grok 4.1 Fast": unifiedProvider("grok-4.1-fast"),
    "Grok 4": unifiedProvider("grok-4"),
    "Grok 3": unifiedProvider("grok-3"),
    "Grok 3 Mini": unifiedProvider("grok-3-mini"),
  },

  // --- Qwen Models ---
  Qwen: {
    "Qwen 3 Coder Plus": unifiedProvider("qwen3-coder-plus"),
    "Qwen 3 Coder Flash": unifiedProvider("qwen3-coder-flash"),
    "Qwen Vision": unifiedProvider("qwen-vl"),
    "Qwen 2 7B": unifiedProvider("qwen/qwen2-7b-instruct"),
    "Qwen 2.5 7B": unifiedProvider("qwen/qwen2.5-7b-instruct"),
    "Qwen 2.5 Coder 7B": unifiedProvider("qwen/qwen2.5-coder-7b-instruct"),
    "Qwen 2.5 Coder 32B": unifiedProvider("qwen/qwen2.5-coder-32b-instruct"),
    "Qwen 3 Coder 480B": unifiedProvider(
      "qwen/qwen3-coder-480b-a35b-instruct",
    ),
    "QwQ 32B": unifiedProvider("qwen/qwq-32b"),
  },

  // --- Meta (Llama) Models ---
  Meta: {
    "Llama 3.1 8B": unifiedProvider("meta/llama-3.1-8b-instruct"),
    "Llama 3.1 70B": unifiedProvider("meta/llama-3.1-70b-instruct"),
    "Llama 3.1 405B": unifiedProvider("meta/llama-3.1-405b-instruct"),
    "Llama 3.2 1B": unifiedProvider("meta/llama-3.2-1b-instruct"),
    "Llama 3.2 3B": unifiedProvider("meta/llama-3.2-3b-instruct"),
    "Llama 3.2 11B Vision": unifiedProvider(
      "meta/llama-3.2-11b-vision-instruct",
    ),
    "Llama 3.2 90B Vision": unifiedProvider(
      "meta/llama-3.2-90b-vision-instruct",
    ),
    "Llama 3.3 70B": unifiedProvider("meta/llama-3.3-70b-instruct"),
    "Llama 4 Maverick 17B": unifiedProvider(
      "meta/llama-4-maverick-17b-128e-instruct",
    ),
    "Llama Guard 4 12B": unifiedProvider("meta/llama-guard-4-12b"),
    "Llama 3 8B": unifiedProvider("meta/llama3-8b-instruct"),
    "Llama 3 70B": unifiedProvider("meta/llama3-70b-instruct"),
  },

  // --- Microsoft (Phi) Models ---
  Microsoft: {
    "Phi-3 Mini 4K": unifiedProvider("microsoft/phi-3-mini-4k-instruct"),
    "Phi-3 Mini 128K": unifiedProvider("microsoft/phi-3-mini-128k-instruct"),
    "Phi-3 Small 8K": unifiedProvider("microsoft/phi-3-small-8k-instruct"),
    "Phi-3 Small 128K": unifiedProvider("microsoft/phi-3-small-128k-instruct"),
    "Phi-3 Medium 4K": unifiedProvider("microsoft/phi-3-medium-4k-instruct"),
    "Phi-3 Medium 128K": unifiedProvider(
      "microsoft/phi-3-medium-128k-instruct",
    ),
    "Phi-3.5 Mini": unifiedProvider("microsoft/phi-3.5-mini-instruct"),
    "Phi-3.5 Vision": unifiedProvider("microsoft/phi-3.5-vision-instruct"),
    "Phi-4 Mini Reasoning": unifiedProvider(
      "microsoft/phi-4-mini-flash-reasoning",
    ),
    "Phi-4 Mini": unifiedProvider("microsoft/phi-4-mini-instruct"),
    "Phi-4 Multimodal": unifiedProvider(
      "microsoft/phi-4-multimodal-instruct",
    ),
  },

  // --- Mistral AI Models ---
  Mistral: {
    "Mistral 7B v0.2": unifiedProvider(
      "mistralai/mistral-7b-instruct-v0.2",
    ),
    "Mistral 7B v0.3": unifiedProvider(
      "mistralai/mistral-7b-instruct-v0.3",
    ),
    "Mistral Small 24B": unifiedProvider(
      "mistralai/mistral-small-24b-instruct",
    ),
    "Mistral Small 3.1 24B": unifiedProvider(
      "mistralai/mistral-small-3.1-24b-instruct-2503",
    ),
    "Mistral Large 3 675B": unifiedProvider(
      "mistralai/mistral-large-3-675b-instruct-2512",
    ),
    "Mistral Medium 3": unifiedProvider(
      "mistralai/mistral-medium-3-instruct",
    ),
    "Mixtral 8x7B": unifiedProvider(
      "mistralai/mixtral-8x7b-instruct-v0.1",
    ),
    "Mixtral 8x22B": unifiedProvider(
      "mistralai/mixtral-8x22b-instruct-v0.1",
    ),
    "Mathstral 7B": unifiedProvider("mistralai/mathstral-7b-v0.1"),
    "Ministral 14B": unifiedProvider(
      "mistralai/ministral-14b-instruct-2512",
    ),
    "Mistral Devstral 123B": unifiedProvider(
      "mistralai/devstral-2-123b-instruct-2512",
    ),
    "Mistral Magistral Small": unifiedProvider(
      "mistralai/magistral-small-2506",
    ),
    "Mistral Mamba Codestral": unifiedProvider(
      "mistralai/mamba-codestral-7b-v0.1",
    ),
  },

  // --- Moonshot (Kimi) Models ---
  Moonshot: {
    "Kimi K2.5": unifiedProvider("kimi-k2.5"),
    "Kimi K2-0905": unifiedProvider("kimi-k2-0905"),
    "Kimi K2 Thinking": unifiedProvider("kimi-k2-thinking"),
    "Kimi K2": unifiedProvider("moonshotai/kimi-k2-instruct"),
    "Kimi for Coding": unifiedProvider("kimi-for-coding"),
  },

  // --- MiniMax Models ---
  MiniMax: {
    "MiniMax-01": unifiedProvider("minimax-01"),
    "MiniMax M2.5": unifiedProvider("minimax-m2.5"),
    "MiniMax M2.7 (Coding)": unifiedProvider("coding-minimax-m2.7"),
    "MiniMax M2.5 (Coding)": unifiedProvider("coding-minimax-m2.5"),
    "MiniMax M2.1 (Coding)": unifiedProvider("coding-minimax-m2.1"),
    "MiniMax M2 (Coding)": unifiedProvider("coding-minimax-m2"),
  },

  // --- Perplexity Models ---
  Perplexity: {
    Sonar: unifiedProvider("sonar"),
    "Sonar Pro": unifiedProvider("sonar-pro"),
  },

  // --- NVIDIA Nemotron Models ---
  NVIDIA: {
    "Nemotron Mini 4B": unifiedProvider("nvidia/nemotron-mini-4b-instruct"),
    "Llama 3.1 Nemotron Nano 8B": unifiedProvider(
      "nvidia/llama-3.1-nemotron-nano-8b-v1",
    ),
    "Llama 3.3 Nemotron Super 49B": unifiedProvider(
      "nvidia/llama-3.3-nemotron-super-49b-v1",
    ),
    "Nemotron Ultra 253B": unifiedProvider(
      "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    ),
    "Nemotron Nano 4B": unifiedProvider(
      "nvidia/llama-3.1-nemotron-nano-4b-v1.1",
    ),
    "Nemotron Nano VL 8B": unifiedProvider(
      "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
    ),
  },

  // --- Z-AI (GLM) Models ---
  "Z-AI": {
    "GLM 5": unifiedProvider("z-ai/glm5"),
    "GLM 4.7": unifiedProvider("z-ai/glm4.7"),
    "GLM 4.7 Flash": unifiedProvider("glm-4.7-flash"),
    "GLM 5 (Coding)": unifiedProvider("coding-glm-5"),
    "GLM 5 Turbo (Coding)": unifiedProvider("coding-glm-5-turbo"),
    "GLM 4.7 (Coding)": unifiedProvider("coding-glm-4.7"),
    "GLM 4.6 (Coding)": unifiedProvider("coding-glm-4.6"),
  },

  // --- StepFun Models ---
  StepFun: {
    "Step 3.5 Flash": unifiedProvider("step-3.5-flash"),
  },

  // --- Xiaomi Models ---
  Xiaomi: {
    "Mimo v2 Flash": unifiedProvider("mimo-v2-flash"),
    "Mimo v2 Pro": unifiedProvider("mimo-v2-pro"),
    "Mimo v2 Omni": unifiedProvider("mimo-v2-omni"),
  },

  // --- Other Models ---
  Other: {
    "Jamba 1.5 Mini": unifiedProvider("ai21labs/jamba-1.5-mini-instruct"),
    "Baichuan 2 13B": unifiedProvider("baichuan-inc/baichuan2-13b-chat"),
    "IBM Granite 3.3": unifiedProvider("ibm/granite-3.3-8b-instruct"),
    "Zamba 2 7B": unifiedProvider("zyphra/zamba2-7b-instruct"),
    "WormGPT (Uncensored)": unifiedProvider("wormgpt"),
  },
};

// ─── Vision-capable models ───────────────────────────────────────────────────

const staticSupportImageInputModels: Record<string, LanguageModel> = {
  "Llama 3.2 11B Vision": staticModels.Meta["Llama 3.2 11B Vision"],
  "Llama 3.2 90B Vision": staticModels.Meta["Llama 3.2 90B Vision"],
  "Phi-4 Multimodal": staticModels.Microsoft["Phi-4 Multimodal"],
  "Qwen Vision": staticModels.Qwen["Qwen Vision"],
  "Gemini 3.1 Flash Image": staticModels.Google["Gemini 3.1 Flash Image"],
  "Gemini 3 Flash": staticModels.Google["Gemini 3 Flash"],
  "Gemini 2.0 Flash": staticModels.Google["Gemini 2.0 Flash"],
};

// ─── Exports ─────────────────────────────────────────────────────────────────

export const allModels: Record<string, Record<string, LanguageModel>> = {
  ...staticModels,
};

export const isToolCallUnsupportedModel = (_model: LanguageModel) => false;

export const isImageInputUnsupportedModel = (model: LanguageModel) => {
  return !(Object.values(staticSupportImageInputModels) as unknown[]).includes(model);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  if ((Object.values(staticModels.OpenAI) as unknown[]).includes(model)) {
    return Array.from(OPENAI_FILE_MIME_TYPES);
  }
  if ((Object.values(staticModels.Anthropic) as unknown[]).includes(model)) {
    return Array.from(ANTHROPIC_FILE_MIME_TYPES);
  }
  return [];
};

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => {
      const supportsImages = (Object.values(
        staticSupportImageInputModels,
      ) as unknown[]).includes(model);
      return {
        name,
        isToolCallUnsupported: false,
        isImageInputUnsupported: !supportsImages,
        supportedFileMimeTypes: getFilePartSupportedMimeTypes(model),
        tier: "Free",
      };
    }),
    hasAPIKey: false,
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) throw new Error("No model specified");

    const providerKey = Object.keys(allModels).find(
      (k) => k.toLowerCase() === model.provider.toLowerCase(),
    );

    let selectedModel: LanguageModel | undefined;
    if (providerKey && allModels[providerKey]) {
      const modelKey = Object.keys(allModels[providerKey]).find(
        (k) => k.toLowerCase() === model.model.toLowerCase(),
      );
      if (modelKey) selectedModel = allModels[providerKey][modelKey];
    }

    if (!selectedModel) {
      console.warn(
        `⚠️  Model not found: ${model.provider}/${model.model}. Falling back to Llama 3.3 70B`,
      );
      return staticModels.Meta["Llama 3.3 70B"];
    }
    return selectedModel;
  },
};

// Export unified worker URL for use in image/video/edit tools
export { UNIFIED_WORKER_URL };
