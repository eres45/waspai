import "server-only";
import { LanguageModel } from "ai";
import { createA4FModels } from "./a4f-models";
import { createDeepInfraModels } from "./deepinfra";
import { createLLMChatModels } from "./llmchat";
import { createTypeGPTModels } from "./typegpt";
import { createLaoZhangModels } from "./laozhang";
import { createWorkersModels } from "./workers";
import { createMakeHubModels } from "./makehub";
import { createCodexModels } from "./codex";
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

// MakeHub Models - Premium Router
const makehubModels = createMakeHubModels();

// Codex Models - Free Tier
const codexModels = createCodexModels();

const staticModels = {
  anthropic: {
    "claude-3-5-haiku-latest": laozhangModels["claude-3-5-haiku-latest"],
    "claude-3-5-sonnet-latest": laozhangModels["claude-3-5-sonnet-latest"],
    "claude-3-7-sonnet-20250219-thinking":
      laozhangModels["claude-3-7-sonnet-20250219-thinking"],
    "claude-3-7-sonnet-latest": laozhangModels["claude-3-7-sonnet-latest"],
    "claude-3-opus-20240229": laozhangModels["claude-3-opus-20240229"],
    "claude-haiku-4-5-20251001": laozhangModels["claude-haiku-4-5-20251001"],
    "claude-opus-4-1-20250805": laozhangModels["claude-opus-4-1-20250805"],
    "claude-opus-4-20250514": laozhangModels["claude-opus-4-20250514"],
    "claude-opus-4-5-20251101": laozhangModels["claude-opus-4-5-20251101"],
    "claude-sonnet-4-20250514": laozhangModels["claude-sonnet-4-20250514"],
    "claude-sonnet-4-5-20250929": laozhangModels["claude-sonnet-4-5-20250929"],
    "claude-sonnet-4.5-proxy": workersModels["claude-sonnet-4.5-proxy"],
    "cld-3-7-sonnet-20250219": laozhangModels["cld-3-7-sonnet-20250219"],
    "cld-opus-4-20250514": laozhangModels["cld-opus-4-20250514"],
    "cld-sonnet-4-20250514": laozhangModels["cld-sonnet-4-20250514"],
    "cld-opus-4-20250514": laozhangModels["cld-opus-4-20250514"],
    "cld-sonnet-4-20250514": laozhangModels["cld-sonnet-4-20250514"],
    // MakeHub Anthropic
    "mh-claude-3-5-sonnet": makehubModels["anthropic-claude-3-5-sonnet"],
    "mh-claude-3-7-sonnet": makehubModels["anthropic-claude-3-7-sonnet"],
    "mh-claude-3-5-haiku": makehubModels["anthropic-claude-3-5-haiku"],
    "mh-claude-4-sonnet": makehubModels["anthropic-claude-4-sonnet"],
    "mh-claude-4-opus": makehubModels["anthropic-claude-4-opus"],
    "mh-anthropic-router": makehubModels["anthropic-family"],
  },
  canopy: {
    "canopylabs-orpheus-v1-english": a4fModels["canopylabs-orpheus-v1-english"],
  },
  codex: {
    "codex-gpt-5.2": codexModels["gpt-5.2"],
    "codex-gpt-5.1": codexModels["gpt-5.1"],
    "codex-gpt-5": codexModels["gpt-5"],
    "codex-gpt-4.1-mini": codexModels["gpt-4.1-mini"],
    "codex-claude-sonnet-4": codexModels["anthropic-claude-sonnet-4"],
    "codex-gemini-2.5-pro": codexModels["google-gemini-2.5-pro-preview-05-06"],
    "codex-deepseek-v3.2": codexModels["deepseek-ai-deepseek-v3.2"],
    "codex-deepseek-r1": codexModels["deepseek-ai-deepseek-R1-0528"],
    "codex-o1-preview": codexModels["o1-preview"],
    "codex-o3-mini": codexModels["o3-mini"],
    "codex-llama-4-maverick": codexModels["meta-llama-4-maverick-17b-128e-instruct"],
    "codex-kimi-k2.5": codexModels["moonshotai-kimi-k2.5"],
    "codex-grok-4": codexModels["x-ai-grok-4"],
  },
  cohere: {
    "command-r-plus-08-2024": typegptModels["command-r-plus-08-2024"],
    "command-r7b-12-2024": typegptModels["command-r7b-12-2024"],
  },
  deepseek: {
    "cf-deepseek-ai-deepseek-coder-6.7b-base":
      llmChatModels["cf-deepseek-ai-deepseek-coder-6.7b-base"],
    "cf-deepseek-ai-deepseek-coder-6.7b-instruct":
      llmChatModels["cf-deepseek-ai-deepseek-coder-6.7b-instruct"],
    "cf-deepseek-ai-deepseek-math-7b-instruct":
      llmChatModels["cf-deepseek-ai-deepseek-math-7b-instruct"],
    "deepseek-ai-DeepSeek-R1-0528":
      deepInfraModels["deepseek-ai-DeepSeek-R1-0528"],
    "deepseek-ai-DeepSeek-R1-0528-Turbo":
      deepInfraModels["deepseek-ai-DeepSeek-R1-0528-Turbo"],
    "deepseek-ai-DeepSeek-R1-Distill-Llama-70B":
      deepInfraModels["deepseek-ai-DeepSeek-R1-Distill-Llama-70B"],
    "deepseek-ai-DeepSeek-R1-Turbo":
      deepInfraModels["deepseek-ai-DeepSeek-R1-0528-Turbo"],
    "deepseek-ai-deepseek-r1": typegptModels["deepseek-ai-deepseek-r1"],
    "deepseek-ai-DeepSeek-V3": deepInfraModels["deepseek-ai-DeepSeek-V3"],
    "deepseek-ai-deepseek-v3.1": typegptModels["deepseek-ai-deepseek-v3.1"],
    "deepseek-ai-DeepSeek-V3.1": deepInfraModels["deepseek-ai-DeepSeek-V3.1"],
    "deepseek-ai-DeepSeek-V3.1-Terminus":
      deepInfraModels["deepseek-ai-DeepSeek-V3.1-Terminus"],
    "deepseek-ai-DeepSeek-V3.2": deepInfraModels["deepseek-ai-DeepSeek-V3.2"],
    "deepseek-ai-DeepSeek-V3-0324":
      deepInfraModels["deepseek-ai-DeepSeek-V3-0324"],
    "deepseek-r1": laozhangModels["deepseek-r1"],
    "deepseek-r1": laozhangModels["deepseek-r1"],
    // MakeHub DeepSeek
    "mh-deepseek-r1": makehubModels["deepseek-deepseek-R1-fp8"],
    "mh-deepseek-v3": makehubModels["deepseek-deepseek-V3-fp8"],
    "mh-deepseek-r1-distill": makehubModels["deepseek-deepseek-R1-distill-llama-70b-fp16"],
    "mh-deepseek-router": makehubModels["deepseek-family"],
  },
  defog: {
    "cf-defog-sqlcoder-7b-2": llmChatModels["cf-defog-sqlcoder-7b-2"],
  },
  google: {
    "cf-google-gemma-2b-it-lora": llmChatModels["cf-google-gemma-2b-it-lora"],
    "cf-google-gemma-7b-it": llmChatModels["cf-google-gemma-7b-it"],
    "gemini-1.5-pro-latest": laozhangModels["gemini-1.5-pro-latest"],
    "gemini-2.0-flash-001": laozhangModels["gemini-2.0-flash-001"],
    "gemini-2.5-flash": laozhangModels["gemini-2.5-flash"],
    "gemini-2.5-pro": laozhangModels["gemini-2.5-pro"],
    "gemini-2.5-pro-thinking": laozhangModels["gemini-2.5-pro-thinking"],
    "gemini-3-flash-preview": laozhangModels["gemini-3-flash-preview"],
    "gemini-3-pro-preview": laozhangModels["gemini-3-pro-preview"],
    "gemini-3-pro-preview-thinking":
      laozhangModels["gemini-3-pro-preview-thinking"],
    "google-gemma-2-9b-it": deepInfraModels["google-gemma-2-9b-it"],
    "google-gemma-2-9b-it": deepInfraModels["google-gemma-2-9b-it"],
    // MakeHub Google
    "mh-gemini-2.5-pro": makehubModels["google-gemini-2.5-pro"],
    "mh-gemini-2.5-flash": makehubModels["google-gemini-2.5-flash"],
    "mh-gemini-2.0-flash-thinking": makehubModels["google-gemini-2.0-flash-thinking"],
    "mh-google-router": makehubModels["google-family"],
  },
  grok: {
    "grok-3-latest": laozhangModels["grok-3-latest"],
    "grok-3-reasoning": laozhangModels["grok-3-reasoning"],
    "grok-4-deepsearch": laozhangModels["grok-4-deepsearch"],
    "grok-4-latest": laozhangModels["grok-4-latest"],
    "grok-4-latest": laozhangModels["grok-4-latest"],
    // MakeHub Grok
    "mh-grok-3": makehubModels["xai-grok-3"],
    "mh-grok-3-mini": makehubModels["xai-grok-3-mini"],
    "mh-grok-4": makehubModels["xai-grok-4"],
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
    "Llama-3.3-70B-DeepInfra":
      deepInfraModels["meta-llama-Llama-3.3-70B-Instruct-Turbo"],
  },
  meta: {
    "llama-3.2-90b-vision-instruct":
      typegptModels["meta-llama-3.2-90b-vision-instruct"],
    "llama-3.3-70b-deepinfra-turbo":
      deepInfraModels["meta-llama-Llama-3.3-70B-Instruct-Turbo"],
    "llama-4-maverick-17b-128e-instruct-fp8":
      deepInfraModels["meta-llama-Llama-4-Maverick-17B-128E-Instruct-FP8"],
    "llama-4-scout-17b-16e-instruct":
      typegptModels["meta-llama-4-scout-17b-16e-instruct"],
    "llama-guard-4-12b": deepInfraModels["meta-llama-Llama-Guard-4-12B"],
    "llama-prompt-guard-2-86m":
      a4fModels["meta-llama-llama-prompt-guard-2-86m"],
    "llama-prompt-guard-2-86m":
      a4fModels["meta-llama-llama-prompt-guard-2-86m"],
    // MakeHub Llama
    "mh-llama-3.3-70b": makehubModels["meta-Llama-3.3-70B-fp16"],
    "mh-llama-4-scout": makehubModels["meta-Llama-4-Scout-17B-16E-fp8"],
    "mh-llama-4-maverick": makehubModels["meta-Llama-4-Maverick-17B-128E-fp8"],
    "mh-meta-router": makehubModels["meta-family"],
  },
  microsoft: {
    "cf-microsoft-phi-2": llmChatModels["cf-microsoft-phi-2"],
  },
  minimax: {
    "MiniMaxAI-MiniMax-M2": deepInfraModels["MiniMaxAI-MiniMax-M2"],
    "MiniMaxAI-MiniMax-M2": deepInfraModels["MiniMaxAI-MiniMax-M2"],
    "mh-minimax-m1": makehubModels["minimax-minimax-m1"],
  },
  mistral: {
    "cf-mistralai-mistral-7b-instruct-v0.1":
      llmChatModels["cf-mistralai-mistral-7b-instruct-v0.1"],
    "cf-mistralai-mistral-7b-instruct-v0.2":
      llmChatModels["cf-mistralai-mistral-7b-instruct-v0.2"],
    "cf-mistralai-mistral-small-3.1-24b-instruct":
      llmChatModels["cf-mistralai-mistral-small-3.1-24b-instruct"],
    "cf-mistralai-openhermes-2.5-mistral-7b":
      llmChatModels["cf-mistralai-openhermes-2.5-mistral-7b"],
    "mistralai-Mistral-7B-Instruct-v0.1":
      deepInfraModels["mistralai-Mistral-7B-Instruct-v0.1"],
    "mistralai-Mistral-7B-Instruct-v0.2":
      deepInfraModels["mistralai-Mistral-7B-Instruct-v0.2"],
    "mistralai-Mistral-Small-3.2-24B-Instruct-2506":
      deepInfraModels["mistralai-Mistral-Small-3.2-24B-Instruct-2506"],
    "mistralai-Mistral-Small-3.2-24B-Instruct-2506":
      deepInfraModels["mistralai-Mistral-Small-3.2-24B-Instruct-2506"],
    // MakeHub Mistral
    "mh-mistral-nemo": makehubModels["mistral-open-mistral-nemo"],
    "mh-codestral": makehubModels["mistral-codestral"],
  },
  moonshot: {
    "moonshotai-kimi-k2-instruct": a4fModels["moonshotai-kimi-k2-instruct"],
    "moonshotai-kimi-k2-instruct-0905":
      deepInfraModels["moonshotai-Kimi-K2-Instruct-0905"],
    "moonshotai-Kimi-K2-Thinking":
      deepInfraModels["moonshotai-Kimi-K2-Thinking"],
    wormgpt: workersModels["wormgpt"],
  },
  nvidia: {
    "nemotron-3-nano-30b-a3b": typegptModels["nemotron-3-nano-30b-a3b"],
    "nemotron-nano-9b-v2": typegptModels["nemotron-nano-9b-v2"],
  },
  openai: {
    "chatgpt-4o-latest": laozhangModels["chatgpt-4o-latest"],
    "gpt-4.1": laozhangModels["gpt-4.1"],
    "gpt-4.1-mini": laozhangModels["gpt-4.1-mini"],
    "gpt-4o": laozhangModels["gpt-4o"],
    "gpt-5": laozhangModels["gpt-5"],
    "gpt-5-mini": laozhangModels["gpt-5-mini"],
    "gpt-5-pro": laozhangModels["gpt-5-pro"],
    "gpt-5.1": laozhangModels["gpt-5.1"],
    "gpt-5.2": laozhangModels["gpt-5.2"],
    "o1": laozhangModels["o1"],
    "o1-pro": laozhangModels["o1-pro"],
    "o3": laozhangModels["o3"],
    "o3-mini": laozhangModels["o3-mini"],
    "o3-pro": laozhangModels["o3-pro"],
    "o4-mini": laozhangModels["o4-mini"],
    "o4-mini-high": laozhangModels["o4-mini-high"],
    "openai-gpt-oss-120b": typegptModels["openai-gpt-oss-120b"],
    "openai-gpt-oss-20b": typegptModels["openai-gpt-oss-20b"],
    "openai-gpt-oss-safeguard-20b": a4fModels["openai-gpt-oss-safeguard-20b"],
    "openai-gpt-oss-safeguard-20b": a4fModels["openai-gpt-oss-safeguard-20b"],
    // MakeHub OpenAI
    "mh-gpt-4o": makehubModels["openai-gpt-4o"],
    "mh-gpt-4o-mini": makehubModels["openai-gpt-4o-mini"],
    "mh-gpt-4.5": makehubModels["openai-gpt-4.5"],
    "mh-o3": makehubModels["openai-o3"],
    "mh-o4-mini": makehubModels["openai-o4-mini"],
    "mh-openai-router": makehubModels["openai-family"],
  },
  others: {
    "cf-huggingfacegi-zephyr-7b-beta":
      llmChatModels["cf-huggingfacegi-zephyr-7b-beta"],
    "cf-intel-neural-chat-7b-v3-1":
      llmChatModels["cf-intel-neural-chat-7b-v3-1"],
    "cf-nexusflow-starling-lm-7b-beta":
      llmChatModels["cf-nexusflow-starling-lm-7b-beta"],
    "cf-openchat-openchat-3.5": llmChatModels["cf-openchat-openchat-3.5"],
    "cf-tinyllama-tinyllama-1.1b-chat-v1.0":
      llmChatModels["cf-tinyllama-tinyllama-1.1b-chat-v1.0"],
    "cf-una-cybertron-una-cybertron-7b-v2-bf16":
      llmChatModels["cf-una-cybertron-una-cybertron-7b-v2-bf16"],
  },
  qwen: {
    "cf-qwen-qwen1.5-0.5b-chat": llmChatModels["cf-qwen-qwen1.5-0.5b-chat"],
    "cf-qwen-qwen1.5-1.8b-chat": llmChatModels["cf-qwen-qwen1.5-1.8b-chat"],
    "cf-qwen-qwen1.5-14b-chat-awq":
      llmChatModels["cf-qwen-qwen1.5-14b-chat-awq"],
    "cf-qwen-qwen1.5-7b-chat-awq": llmChatModels["cf-qwen-qwen1.5-7b-chat-awq"],
    "Qwen-Qwen2-7B-Instruct": deepInfraModels["Qwen-Qwen2-7B-Instruct"],
    "Qwen-Qwen3-235B-A22B-Instruct-2507":
      deepInfraModels["Qwen-Qwen3-235B-A22B-Instruct-2507"],
    "qwen-qwen3-32b": a4fModels["qwen-qwen3-32b"],
    "Qwen-Qwen3-Coder-480B-A35B-Instruct-Turbo":
      deepInfraModels["Qwen-Qwen3-Coder-480B-A35B-Instruct-Turbo"],
    "qwen-qwen3-next-80b-a3b-instruct":
      deepInfraModels["Qwen-Qwen3-Next-80B-A3B-Instruct"],
    "qwen-qwen3-next-80b-a3b-instruct":
      deepInfraModels["Qwen-Qwen3-Next-80B-A3B-Instruct"],
    // MakeHub Qwen
    "mh-qwen-3-235b": makehubModels["qwen-Qwen3-235B-A22B-fp8"],
    "mh-qwq-32b": makehubModels["qwen-QWQ-32b-fp16"],
  },
  tiiuae: {
    "cf-tiiuae-falcon-7b-instruct":
      llmChatModels["cf-tiiuae-falcon-7b-instruct"],
  },
  umbra: {
     "umbra": typegptModels["umbra"],
  },
  makehub: {
     "mh-sota-router": makehubModels["makehub-sota-family"],
     "mh-cost-router": makehubModels["makehub-cost-family"],
  },
  zai: {
    "glm-4.5-air": typegptModels["glm-4.5-air"],
    "zai-org-GLM-4.5-air": workersModels["glm-4.5-air"],
    "zai-org-GLM-4.7": workersModels["glm-4.7"],
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
          Object.values(a4fModels).includes(model) ||
          Object.values(deepInfraModels).includes(model) ||
          Object.values(makehubModels).includes(model)
        ) {
          tier = "Pro";
        }
        // 3. "Free" for Workers, LLMChat, Codex
        else if (
          Object.values(workersModels).includes(model) ||
          Object.values(llmChatModels).includes(model) ||
          Object.values(codexModels).includes(model)
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
