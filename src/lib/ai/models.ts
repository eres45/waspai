import "server-only";
import { LanguageModel } from "ai";
import { createNvidiaModels } from "./nvidia";
import { ChatModel } from "app-types/chat";

// NVIDIA NIM API - All models (Pro tier with API key)
const nvidiaModels = createNvidiaModels();

const staticModels = {
  // Anthropic models (via proxy)
  anthropic: {
    "claude-sonnet-4.5-proxy": nvidiaModels["meta-llama-3.1-405b-instruct"], // Fallback proxy
  },

  // DeepSeek models
  deepseek: {
    "deepseek-coder-6.7b-instruct":
      nvidiaModels["deepseek-ai-deepseek-coder-6.7b-instruct"],
    "deepseek-r1-distill-llama-8b":
      nvidiaModels["deepseek-ai-deepseek-r1-distill-llama-8b"],
    "deepseek-r1-distill-qwen-7b":
      nvidiaModels["deepseek-ai-deepseek-r1-distill-qwen-7b"],
    "deepseek-r1-distill-qwen-14b":
      nvidiaModels["deepseek-ai-deepseek-r1-distill-qwen-14b"],
    "deepseek-r1-distill-qwen-32b":
      nvidiaModels["deepseek-ai-deepseek-r1-distill-qwen-32b"],
  },

  // IBM Granite models
  granite: {
    "granite-3.0-3b-instruct":
      nvidiaModels["ibm-granite-3.0-3b-a800m-instruct"],
    "granite-3.0-8b-instruct": nvidiaModels["ibm-granite-3.0-8b-instruct"],
    "granite-3.3-8b-instruct": nvidiaModels["ibm-granite-3.3-8b-instruct"],
    "granite-34b-code-instruct": nvidiaModels["ibm-granite-34b-code-instruct"],
    "granite-8b-code-instruct": nvidiaModels["ibm-granite-8b-code-instruct"],
  },

  // Llama models (Meta)
  llama: {
    "llama-3.1-8b-instruct": nvidiaModels["meta-llama-3.1-8b-instruct"],
    "llama-3.1-70b-instruct": nvidiaModels["meta-llama-3.1-70b-instruct"],
    "llama-3.1-405b-instruct": nvidiaModels["meta-llama-3.1-405b-instruct"],
    "llama-3.2-1b-instruct": nvidiaModels["meta-llama-3.2-1b-instruct"],
    "llama-3.2-3b-instruct": nvidiaModels["meta-llama-3.2-3b-instruct"],
    "llama-3.2-11b-vision-instruct":
      nvidiaModels["meta-llama-3.2-11b-vision-instruct"],
    "llama-3.2-90b-vision-instruct":
      nvidiaModels["meta-llama-3.2-90b-vision-instruct"],
    "llama-3.3-70b-instruct": nvidiaModels["meta-llama-3.3-70b-instruct"],
    "llama-4-maverick-17b-128e-instruct":
      nvidiaModels["meta-llama-4-maverick-17b-128e-instruct"],
    "llama-4-scout-17b-16e-instruct":
      nvidiaModels["meta-llama-4-scout-17b-16e-instruct"],
    "llama-guard-4-12b": nvidiaModels["meta-llama-guard-4-12b"],
    "codellama-70b": nvidiaModels["meta-codellama-70b"],
  },

  // Microsoft Phi models
  microsoft: {
    "phi-3-mini-4k-instruct": nvidiaModels["microsoft-phi-3-mini-4k-instruct"],
    "phi-3-mini-128k-instruct":
      nvidiaModels["microsoft-phi-3-mini-128k-instruct"],
    "phi-3-small-8k-instruct":
      nvidiaModels["microsoft-phi-3-small-8k-instruct"],
    "phi-3-small-128k-instruct":
      nvidiaModels["microsoft-phi-3-small-128k-instruct"],
    "phi-3-medium-4k-instruct":
      nvidiaModels["microsoft-phi-3-medium-4k-instruct"],
    "phi-3-medium-128k-instruct":
      nvidiaModels["microsoft-phi-3-medium-128k-instruct"],
    "phi-3-vision-128k-instruct":
      nvidiaModels["microsoft-phi-3-vision-128k-instruct"],
    "phi-3.5-mini-instruct": nvidiaModels["microsoft-phi-3.5-mini-instruct"],
    "phi-3.5-moe-instruct": nvidiaModels["microsoft-phi-3.5-moe-instruct"],
    "phi-3.5-vision-instruct":
      nvidiaModels["microsoft-phi-3.5-vision-instruct"],
    "phi-4-mini-instruct": nvidiaModels["microsoft-phi-4-mini-instruct"],
    "phi-4-mini-flash-reasoning":
      nvidiaModels["microsoft-phi-4-mini-flash-reasoning"],
    "phi-4-multimodal-instruct":
      nvidiaModels["microsoft-phi-4-multimodal-instruct"],
  },

  // Mistral models
  mistral: {
    "mistral-7b-instruct-v0.2":
      nvidiaModels["mistralai-mistral-7b-instruct-v0.2"],
    "mistral-7b-instruct-v0.3":
      nvidiaModels["mistralai-mistral-7b-instruct-v0.3"],
    "mistral-small-24b-instruct":
      nvidiaModels["mistralai-mistral-small-24b-instruct"],
    "mistral-small-3.1-24b-instruct":
      nvidiaModels["mistralai-mistral-small-3.1-24b-instruct-2503"],
    "mistral-large-2-instruct":
      nvidiaModels["mistralai-mistral-large-2-instruct"],
    "mistral-large-3-675b-instruct":
      nvidiaModels["mistralai-mistral-large-3-675b-instruct-2512"],
    "mistral-medium-3-instruct":
      nvidiaModels["mistralai-mistral-medium-3-instruct"],
    "mixtral-8x7b-instruct-v0.1":
      nvidiaModels["mistralai-mixtral-8x7b-instruct-v0.1"],
    "mixtral-8x22b-instruct-v0.1":
      nvidiaModels["mistralai-mixtral-8x22b-instruct-v0.1"],
    "codestral-22b-instruct-v0.1":
      nvidiaModels["mistralai-codestral-22b-instruct-v0.1"],
    "mathstral-7b-v0.1": nvidiaModels["mistralai-mathstral-7b-v0.1"],
    "ministral-14b-instruct-2512":
      nvidiaModels["mistralai-ministral-14b-instruct-2512"],
    "mistral-nemo-12b-instruct":
      nvidiaModels["nv-mistralai-mistral-nemo-12b-instruct"],
  },

  // Moonshot models
  moonshot: {
    "kimi-k2-instruct": nvidiaModels["moonshotai-kimi-k2-instruct"],
    "kimi-k2-instruct-0905": nvidiaModels["moonshotai-kimi-k2-instruct-0905"],
  },

  // NVIDIA Nemotron models
  nemotron: {
    "nemotron-4-340b-instruct": nvidiaModels["nvidia-nemotron-4-340b-instruct"],
    "nemotron-mini-4b-instruct":
      nvidiaModels["nvidia-nemotron-mini-4b-instruct"],
    "llama-3.1-nemotron-51b-instruct":
      nvidiaModels["nvidia-llama-3.1-nemotron-51b-instruct"],
    "llama-3.1-nemotron-70b-instruct":
      nvidiaModels["nvidia-llama-3.1-nemotron-70b-instruct"],
    "llama-3.1-nemotron-nano-4b-v1.1":
      nvidiaModels["nvidia-llama-3.1-nemotron-nano-4b-v1.1"],
    "llama-3.1-nemotron-nano-8b-v1":
      nvidiaModels["nvidia-llama-3.1-nemotron-nano-8b-v1"],
    "llama-3.3-nemotron-super-49b-v1":
      nvidiaModels["nvidia-llama-3.3-nemotron-super-49b-v1"],
    "llama-3.3-nemotron-super-49b-v1.5":
      nvidiaModels["nvidia-llama-3.3-nemotron-super-49b-v1.5"],
  },

  // OpenAI models (via NVIDIA)
  openai: {
    "gpt-oss-20b": nvidiaModels["openai-gpt-oss-20b"],
    "gpt-oss-120b": nvidiaModels["openai-gpt-oss-120b"],
  },

  // Qwen models
  qwen: {
    "qwen2-7b-instruct": nvidiaModels["qwen-qwen2-7b-instruct"],
    "qwen2.5-7b-instruct": nvidiaModels["qwen-qwen2.5-7b-instruct"],
    "qwen2.5-coder-7b-instruct": nvidiaModels["qwen-qwen2.5-coder-7b-instruct"],
    "qwen2.5-coder-32b-instruct":
      nvidiaModels["qwen-qwen2.5-coder-32b-instruct"],
    "qwen3-235b-a22b": nvidiaModels["qwen-qwen3-235b-a22b"],
    "qwen3-coder-480b-a35b-instruct":
      nvidiaModels["qwen-qwen3-coder-480b-a35b-instruct"],
    "qwen3-next-80b-a3b-instruct":
      nvidiaModels["qwen-qwen3-next-80b-a3b-instruct"],
    "qwen3-next-80b-a3b-thinking":
      nvidiaModels["qwen-qwen3-next-80b-a3b-thinking"],
    "qwen3.5-397b-a17b": nvidiaModels["qwen-qwen3.5-397b-a17b"],
    "qwq-32b": nvidiaModels["qwen-qwq-32b"],
  },

  // GLM models (Z-AI)
  zai: {
    "glm-4.7": nvidiaModels["z-ai-glm4.7"],
    "glm-5": nvidiaModels["z-ai-glm5"],
    "chatglm3-6b": nvidiaModels["thudm-chatglm3-6b"],
  },

  // Other quality models
  other: {
    "jamba-1.5-mini-instruct": nvidiaModels["ai21labs-jamba-1.5-mini-instruct"],
    "jamba-1.5-large-instruct":
      nvidiaModels["ai21labs-jamba-1.5-large-instruct"],
    "dbrx-instruct": nvidiaModels["databricks-dbrx-instruct"],
    "starcoder2-7b": nvidiaModels["bigcode-starcoder2-7b"],
    "starcoder2-15b": nvidiaModels["bigcode-starcoder2-15b"],
    "falcon3-7b-instruct": nvidiaModels["tiiuae-falcon3-7b-instruct"],
    "solar-10.7b-instruct": nvidiaModels["upstage-solar-10.7b-instruct"],
    "zamba2-7b-instruct": nvidiaModels["zyphra-zamba2-7b-instruct"],
    "baichuan2-13b-chat": nvidiaModels["baichuan-inc-baichuan2-13b-chat"],
  },
};

const staticUnsupportedModels = new Set<LanguageModel>([]);

const staticSupportImageInputModels: Record<string, LanguageModel> = {
  // Vision models support image input
  "llama-3.2-11b-vision-instruct":
    staticModels.llama["llama-3.2-11b-vision-instruct"],
  "llama-3.2-90b-vision-instruct":
    staticModels.llama["llama-3.2-90b-vision-instruct"],
  "phi-3-vision-128k-instruct":
    staticModels.microsoft["phi-3-vision-128k-instruct"],
  "phi-3.5-vision-instruct": staticModels.microsoft["phi-3.5-vision-instruct"],
  "phi-4-multimodal-instruct":
    staticModels.microsoft["phi-4-multimodal-instruct"],
};

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
        // All NVIDIA models are Pro tier (require API key)
        const tier = "Pro";

        // Check if model supports image input
        const supportsImages = Object.values(
          staticSupportImageInputModels,
        ).includes(model);

        return {
          name,
          isToolCallUnsupported: isToolCallUnsupportedModel(model),
          isImageInputUnsupported: !supportsImages,
          supportedFileMimeTypes: supportsImages
            ? ["image/jpeg", "image/png", "image/webp", "image/gif"]
            : [],
          tier,
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
        `⚠️  Model not found: ${model.provider}/${model.model}. Using fallback: llama/llama-3.3-70b-instruct`,
      );
      // Fallback to a reliable model
      const fallbackModel = allModels["llama"]?.["llama-3.3-70b-instruct"];
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
  // Check if NVIDIA API key is set
  return !!process.env.NVIDIA_API_KEY;
}
