import "server-only";

import { LanguageModel } from "ai";
import { createPollinationsModels } from "./pollinations";
import { createA4FModels } from "./a4f-models";
import { createDeepInfraModels } from "./deepinfra";
import { createLLMChatModels } from "./llmchat";
import { createTypeGPTModels } from "./typegpt";
import { ChatModel } from "app-types/chat";
import {
  DEFAULT_FILE_PART_MIME_TYPES,
  GEMINI_FILE_MIME_TYPES,
} from "./file-support";

// Pollinations AI models - Free tier with 10 requests per minute
const pollinationsModels = createPollinationsModels();

// A4F Models - Professional tier
const a4fModels = createA4FModels();

// DeepInfra Models - Pro tier
const deepInfraModels = createDeepInfraModels();

// LLMChat Models - Free tier
const llmChatModels = createLLMChatModels();

// TypeGPT Models
const typegptModels = createTypeGPTModels();

const staticModels = {
  google: {
    ...(pollinationsModels.gemini && { gemini: pollinationsModels.gemini }),
    ...(pollinationsModels["gemini-search"] && {
      "gemini-search": pollinationsModels["gemini-search"],
    }),
    "google-gemma-2-9b-it": deepInfraModels["google-gemma-2-9b-it"],
    "google-gemma-2-12b-it": deepInfraModels["google-gemma-2-12b-it"],
    "google-gemma-3-27b-it": typegptModels["google-gemma-3-27b-it"], // New
    "cf-google-gemma-7b-it": llmChatModels["cf-google-gemma-7b-it"],
    "cf-google-gemma-2b-it-lora": llmChatModels["cf-google-gemma-2b-it-lora"],
  },
  mistral: {
    ...(pollinationsModels.mistral && { mistral: pollinationsModels.mistral }),
    "mistralai-Mistral-7B-Instruct-v0.1":
      deepInfraModels["mistralai-Mistral-7B-Instruct-v0.1"],
    "mistralai-Mistral-7B-Instruct-v0.2":
      deepInfraModels["mistralai-Mistral-7B-Instruct-v0.2"],
    "mistralai-Mistral-Small-Instruct-2409":
      deepInfraModels["mistralai-Mistral-Small-Instruct-2409"],
    "mistralai-Devstral-Small-2505":
      typegptModels["mistralai-Devstral-Small-2505"], // New
    "mistralai-Mistral-Small-3.1-24B-Instruct-2503":
      typegptModels["mistralai-Mistral-Small-3.1-24B-Instruct-2503"], // New
    "cf-mistralai-mistral-small-3.1-24b-instruct":
      llmChatModels["cf-mistralai-mistral-small-3.1-24b-instruct"],
    "cf-mistralai-mistral-7b-instruct-v0.1":
      llmChatModels["cf-mistralai-mistral-7b-instruct-v0.1"],
    "cf-mistralai-mistral-7b-instruct-v0.2":
      llmChatModels["cf-mistralai-mistral-7b-instruct-v0.2"],
    "cf-mistralai-openhermes-2.5-mistral-7b":
      llmChatModels["cf-mistralai-openhermes-2.5-mistral-7b"],
  },
  "openai-free": {
    ...(pollinationsModels.openai && {
      "openai-pollinations": pollinationsModels.openai,
    }),
    ...(pollinationsModels["openai-fast"] && {
      "openai-fast-pollinations": pollinationsModels["openai-fast"],
    }),
    ...(pollinationsModels["openai-large"] && {
      "openai-large-pollinations": pollinationsModels["openai-large"],
    }),
    ...(pollinationsModels["openai-reasoning"] && {
      "openai-reasoning-pollinations": pollinationsModels["openai-reasoning"],
    }),
  },
  openai: {
    "openai-gpt-oss-120b": a4fModels["openai-gpt-oss-120b"],
    "openai-gpt-oss-20b": a4fModels["openai-gpt-oss-20b"],
    "openai-gpt-oss-safeguard-20b": a4fModels["openai-gpt-oss-safeguard-20b"],
  },
  meta: {
    "llama-4-scout-17b-16e-instruct":
      a4fModels["meta-llama-llama-4-scout-17b-16e-instruct"],
    "llama-guard-4-12b": a4fModels["meta-llama-llama-guard-4-12b"],
    "llama-prompt-guard-2-86m":
      a4fModels["meta-llama-llama-prompt-guard-2-86m"],
  },
  qwen: {
    "qwen-qwen3-32b": a4fModels["qwen-qwen3-32b"],
    "Qwen-Qwen2-7B-Instruct": deepInfraModels["Qwen-Qwen2-7B-Instruct"],
    "Qwen-Qwen3-Coder-480B-A35B-Instruct-Turbo":
      deepInfraModels["Qwen-Qwen3-Coder-480B-A35B-Instruct-Turbo"],
    "Qwen-Qwen3-235B-A22B-Instruct-2507":
      typegptModels["Qwen-Qwen3-235B-A22B-Instruct-2507"], // New
    "qwen-qwen3-next-80b-a3b-instruct":
      typegptModels["qwen-qwen3-next-80b-a3b-instruct"], // New
    "qwen-qwen3-next-80b-a3b-thinking":
      typegptModels["qwen-qwen3-next-80b-a3b-thinking"], // New
    "cf-qwen-qwen1.5-7b-chat-awq": llmChatModels["cf-qwen-qwen1.5-7b-chat-awq"],
    "cf-qwen-qwen1.5-14b-chat-awq":
      llmChatModels["cf-qwen-qwen1.5-14b-chat-awq"],
    "cf-qwen-qwen1.5-0.5b-chat": llmChatModels["cf-qwen-qwen1.5-0.5b-chat"],
    "cf-qwen-qwen1.5-1.8b-chat": llmChatModels["cf-qwen-qwen1.5-1.8b-chat"],
  },
  moonshot: {
    "moonshotai-kimi-k2-instruct": a4fModels["moonshotai-kimi-k2-instruct"],
    "moonshotai-kimi-k2-instruct-0905":
      a4fModels["moonshotai-kimi-k2-instruct-0905"],
    "moonshotai-Kimi-K2-Thinking":
      deepInfraModels["moonshotai-Kimi-K2-Thinking"],
  },
  allam: {},
  canopy: {
    "canopylabs-orpheus-v1-english": a4fModels["canopylabs-orpheus-v1-english"],
  },
  deepseek: {
    "deepseek-ai-deepseek-r1-distill-qwen-32b":
      typegptModels["deepseek-ai-deepseek-r1-distill-qwen-32b"], // New
    "deepseek-ai-DeepSeek-V3.1-Terminus":
      deepInfraModels["deepseek-ai-DeepSeek-V3.1-Terminus"],
    "deepseek-ai-DeepSeek-R1-Turbo":
      deepInfraModels["deepseek-ai-DeepSeek-R1-Turbo"],
    "deepseek-ai-DeepSeek-R1": deepInfraModels["deepseek-ai-DeepSeek-R1"],
    "cf-deepseek-ai-deepseek-coder-6.7b-base":
      llmChatModels["cf-deepseek-ai-deepseek-coder-6.7b-base"],
    "cf-deepseek-ai-deepseek-coder-6.7b-instruct":
      llmChatModels["cf-deepseek-ai-deepseek-coder-6.7b-instruct"],
    "cf-deepseek-ai-deepseek-math-7b-instruct":
      llmChatModels["cf-deepseek-ai-deepseek-math-7b-instruct"],
  },
  minimax: {
    "MiniMaxAI-MiniMax-M2": deepInfraModels["MiniMaxAI-MiniMax-M2"],
  },
  microsoft: {
    "microsoft-phi-4-multimodal-instruct":
      typegptModels["microsoft-phi-4-multimodal-instruct"], // New
    "cf-microsoft-phi-2": llmChatModels["cf-microsoft-phi-2"],
  },
  tiiuae: {
    "cf-tiiuae-falcon-7b-instruct":
      llmChatModels["cf-tiiuae-falcon-7b-instruct"],
  },
  defog: {
    "cf-defog-sqlcoder-7b-2": llmChatModels["cf-defog-sqlcoder-7b-2"],
  },
  lgai: {
    "LGAI-EXAONE-K-EXAONE-236B-A23B":
      typegptModels["LGAI-EXAONE-K-EXAONE-236B-A23B"], // New
  },
  zai: {
    "zai-org-GLM-4.6": typegptModels["zai-org-GLM-4.6"], // New
    "zai-org-GLM-4.7": typegptModels["zai-org-GLM-4.7"], // New
  },
  others: {
    "cf-huggingfacegi-zephyr-7b-beta":
      llmChatModels["cf-huggingfacegi-zephyr-7b-beta"],
    "cf-intel-neural-chat-7b-v3-1":
      llmChatModels["cf-intel-neural-chat-7b-v3-1"],
    "cf-nexusflow-starling-lm-7b-beta":
      llmChatModels["cf-nexusflow-starling-lm-7b-beta"],
    "cf-openchat-openchat-3.5": llmChatModels["cf-openchat-openchat-3.5"],
    "cf-una-cybertron-una-cybertron-7b-v2-bf16":
      llmChatModels["cf-una-cybertron-una-cybertron-7b-v2-bf16"],
    "cf-tinyllama-tinyllama-1.1b-chat-v1.0":
      llmChatModels["cf-tinyllama-tinyllama-1.1b-chat-v1.0"],
  },
  llm: {
    "llama-3.1-8b-instant": a4fModels["llama-3.1-8b-instant"],
    "llama-3.3-70b-versatile": a4fModels["llama-3.3-70b-versatile"],
    "Llama-3.3-70B-DeepInfra":
      deepInfraModels["meta-llama-Llama-3.3-70B-Instruct"],
    "Llama-3.1-8B-DeepInfra":
      deepInfraModels["meta-llama-Llama-3.1-8B-Instruct"],
    "Llama-3.2-3B-DeepInfra":
      deepInfraModels["meta-llama-Llama-3.2-3B-Instruct"],
    "Llama-3.2-1B-DeepInfra":
      deepInfraModels["meta-llama-Llama-3.2-1B-Instruct"],
    "Llama-3-8B-DeepInfra": deepInfraModels["meta-llama-Llama-3-8B-Instruct"],
    "cf-llama-3-8b": llmChatModels["cf-meta-llama-3-8b-instruct"],
    "cf-llama-3.1-8b": llmChatModels["cf-meta-llama-3.1-8b-instruct"],
    "cf-llama-2-7b": llmChatModels["cf-meta-llama-2-7b-chat-fp16"],
    "cf-llama-2-13b": llmChatModels["cf-meta-llama-2-13b-chat"],
    "cf-llama-guard": llmChatModels["cf-meta-llama-guard-7b"],
    "cf-llama-3-8b-awq": llmChatModels["cf-meta-llama-3-8b-instruct-awq"],
  },
};

const staticUnsupportedModels = new Set<LanguageModel>([
  // gemini-search doesn't support tool calling
  pollinationsModels["gemini-search"],
]);

const staticSupportImageInputModels = {
  gemini: pollinationsModels.gemini,
  "gemini-search": pollinationsModels["gemini-search"],
  openai: pollinationsModels.openai,
  "openai-fast": pollinationsModels["openai-fast"],
  "openai-large": pollinationsModels["openai-large"],
  "openai-reasoning": pollinationsModels["openai-reasoning"],
};

const staticFilePartSupportByModel = new Map<
  LanguageModel,
  readonly string[]
>();

const registerFileSupport = (
  model: LanguageModel | undefined,
  mimeTypes: readonly string[] = DEFAULT_FILE_PART_MIME_TYPES,
) => {
  if (!model) return;
  staticFilePartSupportByModel.set(model, Array.from(mimeTypes));
};

// Register image support for models that support it
registerFileSupport(pollinationsModels.gemini, GEMINI_FILE_MIME_TYPES);
registerFileSupport(
  pollinationsModels["gemini-search"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(pollinationsModels.openai, DEFAULT_FILE_PART_MIME_TYPES);
registerFileSupport(
  pollinationsModels["openai-fast"],
  DEFAULT_FILE_PART_MIME_TYPES,
);
registerFileSupport(
  pollinationsModels["openai-large"],
  DEFAULT_FILE_PART_MIME_TYPES,
);
registerFileSupport(
  pollinationsModels["openai-reasoning"],
  DEFAULT_FILE_PART_MIME_TYPES,
);

const allModels = staticModels;

const allUnsupportedModels = new Set([...staticUnsupportedModels]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

export const isImageInputUnsupportedModel = (model: LanguageModel) => {
  return !Object.values(staticSupportImageInputModels).includes(model);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  return staticFilePartSupportByModel.get(model) ?? [];
};

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    // Filter out gemini-search from the model menu (it's used automatically for search queries)
    models: Object.entries(models)
      .filter(([name]) => name !== "gemini-search")
      .map(([name, model]) => ({
        name,
        isToolCallUnsupported: isToolCallUnsupportedModel(model),
        isImageInputUnsupported: isImageInputUnsupportedModel(model),
        supportedFileMimeTypes: [...getFilePartSupportedMimeTypes(model)],
        isPro:
          [
            "meta",
            "openai",
            "qwen",
            "moonshot",
            "allam",
            "canopy",
            "deepseek",
            "minimax",
            "microsoft",
            "tiiuae",
            "defog",
            "other",
            "llm",
            "lgai",
            "zai",
          ].includes(provider) ||
          (["google", "mistral"].includes(provider) && name.includes("-")),
      })),
    hasAPIKey: checkProviderAPIKey(provider as keyof typeof staticModels),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) {
      throw new Error("No model specified");
    }
    const selectedModel =
      allModels[model.provider as keyof typeof allModels]?.[model.model];
    if (!selectedModel) {
      console.warn(
        `⚠️  Model not found: ${model.provider}/${model.model}. Using fallback model: openai-free/openai-pollinations`,
      );
      // Fallback to a reliable free model (Gemini 2.5 Flash)
      const fallbackModel = allModels["google"]?.["gemini"];
      if (!fallbackModel) {
        throw new Error(
          `Model not found: ${model.provider}/${model.model}. Please select a valid model.`,
        );
      }
      return fallbackModel;
    }
    return selectedModel;
  },
};

function checkProviderAPIKey(_provider: keyof typeof staticModels) {
  // Pollinations AI doesn't require an API key for free tier
  return true;
}
