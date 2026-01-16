import "server-only";
import { LanguageModel } from "ai";
import { createA4FModels } from "./a4f-models";
import { createDeepInfraModels } from "./deepinfra";
import { createLLMChatModels } from "./llmchat";
import { createTypeGPTModels } from "./typegpt";
import { createLaoZhangModels } from "./laozhang";
import { createWorkersModels } from "./workers";
import { ChatModel } from "app-types/chat";

// A4F Models - Professional tier
const a4fModels = createA4FModels();

// DeepInfra Models - Pro tier
const deepInfraModels = createDeepInfraModels();

// LLMChat Models - Free tier
const llmChatModels = createLLMChatModels();

// TypeGPT Models
const typegptModels = createTypeGPTModels();

// LaoZhang Models - Pro Flagships
const laozhangModels = createLaoZhangModels();

// Workers Models - Free Workers
const workersModels = createWorkersModels();

const staticModels = {
  cohere: {
    "command-r-plus-08-2024": typegptModels["command-r-plus-08-2024"],
    "command-r7b-12-2024": typegptModels["command-r7b-12-2024"],
  },
  nvidia: {
    "nemotron-3-nano-30b-a3b": typegptModels["nemotron-3-nano-30b-a3b"],
    "nemotron-nano-9b-v2": typegptModels["nemotron-nano-9b-v2"],
  },
  google: {
    "google-gemma-2-9b-it": deepInfraModels["google-gemma-2-9b-it"],
    "gemini-1.5-pro-latest": laozhangModels["gemini-1.5-pro-latest"],
    "gemini-2.0-flash-001": laozhangModels["gemini-2.0-flash-001"],
    "gemini-2.5-flash": laozhangModels["gemini-2.5-flash"],
    "gemini-2.5-pro": laozhangModels["gemini-2.5-pro"],
    "gemini-2.5-pro-thinking": laozhangModels["gemini-2.5-pro-thinking"],
    "gemini-3-flash-preview": laozhangModels["gemini-3-flash-preview"],
    "gemini-3-pro-preview": laozhangModels["gemini-3-pro-preview"],
    "gemini-3-pro-preview-thinking":
      laozhangModels["gemini-3-pro-preview-thinking"],
    "cf-google-gemma-7b-it": llmChatModels["cf-google-gemma-7b-it"],
    "cf-google-gemma-2b-it-lora": llmChatModels["cf-google-gemma-2b-it-lora"],
  },
  mistral: {
    "mistralai-Mistral-7B-Instruct-v0.1":
      deepInfraModels["mistralai-Mistral-7B-Instruct-v0.1"],
    "mistralai-Mistral-7B-Instruct-v0.2":
      deepInfraModels["mistralai-Mistral-7B-Instruct-v0.2"],
    "mistralai-Mistral-Small-3.2-24B-Instruct-2506":
      deepInfraModels["mistralai-Mistral-Small-3.2-24B-Instruct-2506"], // New Verified
    "cf-mistralai-mistral-small-3.1-24b-instruct":
      llmChatModels["cf-mistralai-mistral-small-3.1-24b-instruct"],
    "cf-mistralai-mistral-7b-instruct-v0.1":
      llmChatModels["cf-mistralai-mistral-7b-instruct-v0.1"],
    "cf-mistralai-mistral-7b-instruct-v0.2":
      llmChatModels["cf-mistralai-mistral-7b-instruct-v0.2"],
    "cf-mistralai-openhermes-2.5-mistral-7b":
      llmChatModels["cf-mistralai-openhermes-2.5-mistral-7b"],
  },
  anthropic: {
    "claude-3-5-haiku-latest": laozhangModels["claude-3-5-haiku-latest"],
    "claude-3-5-sonnet-latest": laozhangModels["claude-3-5-sonnet-latest"],
    "claude-3-7-sonnet-latest": laozhangModels["claude-3-7-sonnet-latest"],
    "claude-3-7-sonnet-20250219-thinking":
      laozhangModels["claude-3-7-sonnet-20250219-thinking"],
    "claude-3-opus-20240229": laozhangModels["claude-3-opus-20240229"],
    "claude-haiku-4-5-20251001": laozhangModels["claude-haiku-4-5-20251001"],
    "claude-opus-4-20250514": laozhangModels["claude-opus-4-20250514"],
    "claude-opus-4-1-20250805": laozhangModels["claude-opus-4-1-20250805"],
    "claude-opus-4-5-20251101": laozhangModels["claude-opus-4-5-20251101"],
    "claude-sonnet-4-20250514": laozhangModels["claude-sonnet-4-20250514"],
    "claude-sonnet-4-5-20250929": laozhangModels["claude-sonnet-4-5-20250929"],
    "claude-sonnet-4.5-proxy": workersModels["claude-sonnet-4.5-proxy"], // New Free Proxy
    "cld-3-7-sonnet-20250219": laozhangModels["cld-3-7-sonnet-20250219"],
    "cld-opus-4-20250514": laozhangModels["cld-opus-4-20250514"],
    "cld-sonnet-4-20250514": laozhangModels["cld-sonnet-4-20250514"],
  },
  openai: {
    "chatgpt-4o-latest": laozhangModels["chatgpt-4o-latest"],
    "gpt-4.1": laozhangModels["gpt-4.1"],
    "gpt-4.1-mini": laozhangModels["gpt-4.1-mini"],
    "gpt-4o": laozhangModels["gpt-4o"],
    "gpt-5": laozhangModels["gpt-5"],
    "gpt-5-pro": laozhangModels["gpt-5-pro"],
    "gpt-5-mini": laozhangModels["gpt-5-mini"],
    "gpt-5.1": laozhangModels["gpt-5.1"],
    "gpt-5.2": laozhangModels["gpt-5.2"],
    "o1": laozhangModels["o1"],
    "o1-pro": laozhangModels["o1-pro"],
    "o3": laozhangModels["o3"],
    "o3-pro": laozhangModels["o3-pro"],
    "o3-mini": laozhangModels["o3-mini"],
    "o4-mini": laozhangModels["o4-mini"],
    "o4-mini-high": laozhangModels["o4-mini-high"],
    "openai-gpt-oss-120b": typegptModels["openai-gpt-oss-120b"], // Switched to TypeGPT
    "openai-gpt-oss-20b": typegptModels["openai-gpt-oss-20b"], // Switched to TypeGPT
    "openai-gpt-oss-safeguard-20b": a4fModels["openai-gpt-oss-safeguard-20b"],
  },
  meta: {
    "llama-4-scout-17b-16e-instruct":
      typegptModels["meta-llama-4-scout-17b-16e-instruct"], // Switched to TypeGPT
    "llama-3.2-90b-vision-instruct":
      typegptModels["meta-llama-3.2-90b-vision-instruct"], // New TypeGPT
    "llama-4-maverick-17b-128e-instruct-fp8":
      deepInfraModels["meta-llama-Llama-4-Maverick-17B-128E-Instruct-FP8"], // New Verified
    "llama-guard-4-12b": deepInfraModels["meta-llama-Llama-Guard-4-12B"], // Switched to DeepInfra free
    "llama-3.3-70b-deepinfra-turbo":
      deepInfraModels["meta-llama-Llama-3.3-70B-Instruct-Turbo"], // New Verified
    "llama-prompt-guard-2-86m":
      a4fModels["meta-llama-llama-prompt-guard-2-86m"],
  },
  grok: {
    "grok-3-latest": laozhangModels["grok-3-latest"],
    "grok-3-reasoning": laozhangModels["grok-3-reasoning"],
    "grok-4-latest": laozhangModels["grok-4-latest"],
    "grok-4-deepsearch": laozhangModels["grok-4-deepsearch"],
  },
  qwen: {
    "qwen-qwen3-32b": a4fModels["qwen-qwen3-32b"],
    "Qwen-Qwen2-7B-Instruct": deepInfraModels["Qwen-Qwen2-7B-Instruct"],
    "Qwen-Qwen3-Coder-480B-A35B-Instruct-Turbo":
      deepInfraModels["Qwen-Qwen3-Coder-480B-A35B-Instruct-Turbo"],
    "Qwen-Qwen3-235B-A22B-Instruct-2507":
      deepInfraModels["Qwen-Qwen3-235B-A22B-Instruct-2507"], // Switched to DeepInfra free
    "qwen-qwen3-next-80b-a3b-instruct":
      deepInfraModels["Qwen-Qwen3-Next-80B-A3B-Instruct"], // Switched to DeepInfra free
    "cf-qwen-qwen1.5-7b-chat-awq": llmChatModels["cf-qwen-qwen1.5-7b-chat-awq"],
    "cf-qwen-qwen1.5-14b-chat-awq":
      llmChatModels["cf-qwen-qwen1.5-14b-chat-awq"],
    "cf-qwen-qwen1.5-0.5b-chat": llmChatModels["cf-qwen-qwen1.5-0.5b-chat"],
    "cf-qwen-qwen1.5-1.8b-chat": llmChatModels["cf-qwen-qwen1.5-1.8b-chat"],
  },
  moonshot: {
    "moonshotai-kimi-k2-instruct": a4fModels["moonshotai-kimi-k2-instruct"],
    "moonshotai-kimi-k2-instruct-0905":
      deepInfraModels["moonshotai-Kimi-K2-Instruct-0905"], // Switched to DeepInfra free
    "moonshotai-Kimi-K2-Thinking":
      deepInfraModels["moonshotai-Kimi-K2-Thinking"],
    wormgpt: workersModels["wormgpt"], // New Free Worker
  },
  canopy: {
    "canopylabs-orpheus-v1-english": a4fModels["canopylabs-orpheus-v1-english"],
  },
  deepseek: {
    "deepseek-ai-deepseek-r1": typegptModels["deepseek-ai-deepseek-r1"], // TypeGPT
    "deepseek-ai-deepseek-v3.1": typegptModels["deepseek-ai-deepseek-v3.1"], // TypeGPT
    "deepseek-ai-deepseek-r1-distill-llama-70b":
      deepInfraModels["deepseek-ai-DeepSeek-R1-Distill-Llama-70B"], // New Verified
    "deepseek-ai-deepseek-r1-0528-turbo":
      deepInfraModels["deepseek-ai-DeepSeek-R1-0528-Turbo"], // New Verified
    "deepseek-ai-deepseek-r1-0528":
      deepInfraModels["deepseek-ai-DeepSeek-R1-0528"], // New Verified
    "deepseek-ai-DeepSeek-V3.1-Terminus":
      deepInfraModels["deepseek-ai-DeepSeek-V3.1-Terminus"],
    "deepseek-ai-DeepSeek-V3.1": deepInfraModels["deepseek-ai-DeepSeek-V3.1"], // New Verified
    "deepseek-ai-DeepSeek-V3.2": deepInfraModels["deepseek-ai-DeepSeek-V3.2"], // New Verified
    "deepseek-ai-DeepSeek-V3-0324":
      deepInfraModels["deepseek-ai-DeepSeek-V3-0324"], // New Verified
    "deepseek-ai-DeepSeek-V3": deepInfraModels["deepseek-ai-DeepSeek-V3"], // New Verified
    "deepseek-ai-DeepSeek-R1-Turbo":
      deepInfraModels["deepseek-ai-DeepSeek-R1-0528-Turbo"], // Map to new turbo
    "deepseek-r1": laozhangModels["deepseek-r1"],
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
    "cf-microsoft-phi-2": llmChatModels["cf-microsoft-phi-2"],
  },
  tiiuae: {
    "cf-tiiuae-falcon-7b-instruct":
      llmChatModels["cf-tiiuae-falcon-7b-instruct"],
  },
  defog: {
    "cf-defog-sqlcoder-7b-2": llmChatModels["cf-defog-sqlcoder-7b-2"],
  },
  lgai: {},
  zai: {
    "glm-4.5-air": typegptModels["glm-4.5-air"], // TypeGPT
    "zai-org-GLM-4.7": workersModels["glm-4.7"], // Upgraded to free worker
    "zai-org-GLM-4.5-air": workersModels["glm-4.5-air"], // Upgraded to free worker
  },
  umbra: {
     "umbra": typegptModels["umbra"],
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
      deepInfraModels["meta-llama-Llama-3.3-70B-Instruct-Turbo"], // Updated to verified turbo
    "cf-llama-3-8b": llmChatModels["cf-meta-llama-3-8b-instruct"],
    "cf-llama-3.1-8b": llmChatModels["cf-meta-llama-3.1-8b-instruct"],
    "cf-llama-2-7b": llmChatModels["cf-meta-llama-2-7b-chat-fp16"],
    "cf-llama-2-13b": llmChatModels["cf-meta-llama-2-13b-chat"],
    "cf-llama-guard": llmChatModels["cf-meta-llama-guard-7b"],
    "cf-llama-3-8b-awq": llmChatModels["cf-meta-llama-3-8b-instruct-awq"],
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
        // 1. "Ultra" for LaoZhang
        if (Object.values(laozhangModels).includes(model)) {
          tier = "Ultra";
        }
        // 2. "Pro" for TypeGPT, A4F, DeepInfra
        else if (
          Object.values(typegptModels).includes(model) ||
          Object.values(a4fModels).includes(model) ||
          Object.values(deepInfraModels).includes(model)
        ) {
          tier = "Pro";
        }
        // 3. "Free" for Workers, LLMChat
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
        `⚠️  Model not found: ${model.provider}/${model.model}. Using fallback model: google/google-gemma-2-9b-it`,
      );
      // Fallback to a reliable free model (Gemma 2 9B)
      const fallbackModel = allModels["google"]?.["google-gemma-2-9b-it"];
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
