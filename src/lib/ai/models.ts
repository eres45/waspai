import "server-only";

import { LanguageModel } from "ai";
import { createPollinationsModels } from "./pollinations";
import { createGptOssModels } from "./gpt-oss";
import { createGrokModels } from "./grok";
import { createQWENModels } from "./qwen";
import { createDeepSeekModels } from "./deepseek";
import { createDeepSeekV1Models } from "./deepseek-v1";
import { createGemmaModels } from "./gemma";
import { createGeminiDarkModels } from "./gemini-dark";
import { createOpenAIFreeModels } from "./openai-free";
import { createKiwiAIModels } from "./kiwi-ai";
import { createSonnetFreeModels } from "./sonnet-free";
import { createWormGPTModels } from "./wormgpt";
import { ChatModel } from "app-types/chat";
import {
  DEFAULT_FILE_PART_MIME_TYPES,
  GEMINI_FILE_MIME_TYPES,
} from "./file-support";

// Pollinations AI models - Free tier with 10 requests per minute
const pollinationsModels = createPollinationsModels();

// GPT-OSS models - Free tier
const gptOssModels = createGptOssModels();

// Grok models - Free tier
const grokModels = createGrokModels();

// QWEN models - Free tier (top 10 models)
const qwenModels = createQWENModels();

// DeepSeek models - Free tier
const deepseekModels = createDeepSeekModels();
const deepseekV1Models = createDeepSeekV1Models();

// Gemma models - Free tier
const gemmaModels = createGemmaModels();

// Gemini Dark models - Free tier
const geminiDarkModels = createGeminiDarkModels();

// OpenAI Free models - Free tier
const openAIFreeModels = createOpenAIFreeModels();

// Kiwi AI models - Free tier
const kiwiAIModels = createKiwiAIModels();

// Anthropic Claude models - Free tier (specialized endpoints)
const anthropicModels = createSonnetFreeModels();

// WormGPT AI models - Free tier
const wormgptModels = createWormGPTModels();

const staticModels = {
  // Reorganize Pollinations models under their actual provider names
  google: {
    ...pollinationsModels.gemini && { gemini: pollinationsModels.gemini },
    ...pollinationsModels["gemini-search"] && { "gemini-search": pollinationsModels["gemini-search"] },
    ...geminiDarkModels,
  },
  mistral: {
    ...pollinationsModels.mistral && { mistral: pollinationsModels.mistral },
  },
  "openai-free": {
    ...openAIFreeModels,
    ...pollinationsModels.openai && { "openai-pollinations": pollinationsModels.openai },
    ...pollinationsModels["openai-fast"] && { "openai-fast-pollinations": pollinationsModels["openai-fast"] },
    ...pollinationsModels["openai-large"] && { "openai-large-pollinations": pollinationsModels["openai-large"] },
    ...pollinationsModels["openai-reasoning"] && { "openai-reasoning-pollinations": pollinationsModels["openai-reasoning"] },
  },
  "gpt-oss": gptOssModels,
  grok: grokModels,
  qwen: qwenModels,
  deepseek: {
    ...deepseekModels,
    ...deepseekV1Models,
  },
  gemma: gemmaModels,
  "kiwi-ai": kiwiAIModels,
  anthropic: anthropicModels,
  wormgpt: wormgptModels,
};

const staticUnsupportedModels = new Set<LanguageModel>([
  // gemini-search doesn't support tool calling
  pollinationsModels["gemini-search"],
  // GPT-OSS models don't support tool calling
  gptOssModels["gpt-oss-120b"],
  gptOssModels["gpt-4-117b"],
  // Grok models don't support tool calling
  grokModels["grok-4"],
  // QWEN models don't support tool calling
  ...Object.values(qwenModels),
  // DeepSeek models don't support tool calling
  ...Object.values(deepseekModels),
  // DeepSeek v1 models don't support tool calling
  ...Object.values(deepseekV1Models),
  // Gemma models don't support tool calling
  ...Object.values(gemmaModels),
  // Gemini Dark models don't support tool calling
  ...Object.values(geminiDarkModels),
  // OpenAI Free models don't support tool calling
  ...Object.values(openAIFreeModels),
  // Kiwi AI models don't support tool calling
  ...Object.values(kiwiAIModels),
  // Anthropic Claude models don't support tool calling
  ...Object.values(anthropicModels),
  // WormGPT models don't support tool calling
  ...Object.values(wormgptModels),
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
registerFileSupport(pollinationsModels["gemini-search"], GEMINI_FILE_MIME_TYPES);
registerFileSupport(pollinationsModels.openai, DEFAULT_FILE_PART_MIME_TYPES);
registerFileSupport(pollinationsModels["openai-fast"], DEFAULT_FILE_PART_MIME_TYPES);
registerFileSupport(pollinationsModels["openai-large"], DEFAULT_FILE_PART_MIME_TYPES);
registerFileSupport(pollinationsModels["openai-reasoning"], DEFAULT_FILE_PART_MIME_TYPES);

const allModels = staticModels;

const allUnsupportedModels = new Set([
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const isImageInputUnsupportedModel = (model: LanguageModel) => {
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
      })),
    hasAPIKey: checkProviderAPIKey(provider as keyof typeof staticModels),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) {
      throw new Error("No model specified");
    }
    const selectedModel = allModels[model.provider]?.[model.model];
    if (!selectedModel) {
      console.warn(
        `⚠️  Model not found: ${model.provider}/${model.model}. Using fallback model: openai-free/gpt-4o-mini`
      );
      // Fallback to a reliable free model
      const fallbackModel = allModels["openai-free"]?.["gpt-4o-mini"];
      if (!fallbackModel) {
        throw new Error(
          `Model not found: ${model.provider}/${model.model}. Please select a valid model.`
        );
      }
      return fallbackModel;
    }
    return selectedModel;
  },
};

function checkProviderAPIKey(provider: keyof typeof staticModels) {
  // Pollinations AI doesn't require an API key for free tier
  return true;
}
