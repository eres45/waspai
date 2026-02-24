import "server-only";
import { LanguageModel } from "ai";
import { createA4FModels } from "./a4f-models";
import { createLLMChatModels } from "./llmchat";
import { createWorkersModels } from "./workers";
import { ChatModel } from "app-types/chat";

// A4F Models - Professional tier
const a4fModels = createA4FModels();

// LLMChat Models - Free tier
const llmChatModels = createLLMChatModels();

// Workers Models - Free Workers
const workersModels = createWorkersModels();

const staticModels = {
  anthropic: {
    "claude-sonnet-4.5-proxy": workersModels["claude-sonnet-4.5-proxy"],
  },
  // Removed: canopy (terms acceptance required), deepseek (empty/invalid responses)
  defog: {
    "cf-defog-sqlcoder-7b-2": llmChatModels["cf-defog-sqlcoder-7b-2"],
  },
  google: {
    "cf-google-gemma-2b-it-lora": llmChatModels["cf-google-gemma-2b-it-lora"],
    "cf-google-gemma-7b-it": llmChatModels["cf-google-gemma-7b-it"],
  },
  llm: {
    "cf-llama-2-13b": llmChatModels["cf-meta-llama-2-13b-chat"],
    "cf-llama-2-7b": llmChatModels["cf-meta-llama-2-7b-chat-fp16"],
    "cf-llama-3-8b": llmChatModels["cf-meta-llama-3-8b-instruct"],
    "cf-llama-3-8b-awq": llmChatModels["cf-meta-llama-3-8b-instruct-awq"],
    "cf-llama-3.1-8b": llmChatModels["cf-meta-llama-3.1-8b-instruct"],
    "cf-llama-guard": llmChatModels["cf-meta-llama-guard-7b"],
    "llama-3.1-8b-instant": a4fModels["llama-3.1-8b-instant"],
    "llama-3.3-70b-versatile": a4fModels["llama-3.3-70b-versatile"],
  },
  meta: {
    "llama-prompt-guard-2-86m":
      a4fModels["meta-llama-llama-prompt-guard-2-86m"],
  },
  microsoft: {
    "cf-microsoft-phi-2": llmChatModels["cf-microsoft-phi-2"],
  },
  mistral: {
    "cf-mistralai-mistral-7b-instruct-v0.1":
      llmChatModels["cf-mistralai-mistral-7b-instruct-v0.1"],
    "cf-mistralai-mistral-7b-instruct-v0.2":
      llmChatModels["cf-mistralai-mistral-7b-instruct-v0.2"],
    "cf-mistralai-mistral-small-3.1-24b-instruct":
      llmChatModels["cf-mistralai-mistral-small-3.1-24b-instruct"],
    // Removed: openhermes (empty response)
  },
  moonshot: {
    // Removed: kimi-k2-instruct (auth error)
    wormgpt: workersModels["wormgpt"],
  },
  openai: {
    "openai-gpt-oss-safeguard-20b": a4fModels["openai-gpt-oss-safeguard-20b"],
  },
  // Removed: entire 'others' provider (all models returning empty/invalid responses)
  qwen: {
    // Removed: qwen1.5 models (invalid JSON responses)
    "qwen-qwen3-32b": a4fModels["qwen-qwen3-32b"],
  },
  // Removed: tiiuae (invalid JSON response)
  zai: {
    "zai-org-GLM-4.5-air": workersModels["glm-4.5-air"],
    "zai-org-GLM-4.7": workersModels["glm-4.7"],
    // Removed: GLM-5 (auth error)
  },
};

const staticUnsupportedModels = new Set<LanguageModel>([]);

const staticSupportImageInputModels = {};

// No free models with image support remaining for automatic registration

const allModels = staticModels;

const allUnsupportedModels = new Set([...staticUnsupportedModels]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

export const isImageInputUnsupportedModel = (model: LanguageModel) => {
  return !Object.values(staticSupportImageInputModels).includes(model);
};

export const getFilePartSupportedMimeTypes = (_model: LanguageModel) => {
  return [];
};

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models)
      .filter(([name]) => name !== "gemini-search")
      .map(([name, model]) => {
        let tier = "Free"; // Default to Free
        // Determine tier based on logic
        // 1. "Pro" for A4F
        if (Object.values(a4fModels).includes(model)) {
          tier = "Pro";
        }
        // 2. "Free" for Workers, LLMChat
        else if (
          Object.values(workersModels).includes(model) ||
          Object.values(llmChatModels).includes(model)
        ) {
          tier = "Free";
        }

        return {
          name,
          isToolCallUnsupported: isToolCallUnsupportedModel(model),
          isImageInputUnsupported: isImageInputUnsupportedModel(model),
          supportedFileMimeTypes: [...getFilePartSupportedMimeTypes(model)],
          tier, // New property
        };
      }),
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
        `⚠️  Model not found: ${model.provider}/${model.model}. Using fallback model: google/cf-google-gemma-7b-it`,
      );
      // Fallback to a reliable free model (Gemma 7B)
      const fallbackModel = allModels["google"]?.["cf-google-gemma-7b-it"];
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
  return true;
}
