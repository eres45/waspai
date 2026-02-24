import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * NVIDIA NIM API Integration
 * API: https://integrate.api.nvidia.com/v1
 * Provides access to 140+ chat models from various providers
 */
export function createNvidiaModels() {
  const apiKey = process.env.NVIDIA_API_KEY;

  const provider = createOpenAICompatible({
    name: "nvidia",
    apiKey: apiKey || "",
    baseURL: "https://integrate.api.nvidia.com/v1",
  });

  // Chat/instruct models organized by provider
  const modelIds = [
    // Meta Llama models
    "meta/llama-3.1-405b-instruct",
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.2-11b-vision-instruct",
    "meta/llama-3.2-1b-instruct",
    "meta/llama-3.2-3b-instruct",
    "meta/llama-3.2-90b-vision-instruct",
    "meta/llama-3.3-70b-instruct",
    "meta/llama-4-maverick-17b-128e-instruct",
    // Removed: llama-4-scout (Not Found)
    "meta/llama-guard-4-12b",
    "meta/llama3-70b-instruct",
    "meta/llama3-8b-instruct",

    // Qwen models
    "qwen/qwen2-7b-instruct",
    "qwen/qwen2.5-7b-instruct",
    "qwen/qwen2.5-coder-32b-instruct",
    "qwen/qwen2.5-coder-7b-instruct",
    "qwen/qwen3-235b-a22b",
    "qwen/qwen3-coder-480b-a35b-instruct",
    "qwen/qwen3-next-80b-a3b-instruct",
    // Removed: qwen3-next-80b-a3b-thinking (Bad Request)
    "qwen/qwen3.5-397b-a17b",
    "qwen/qwq-32b",

    // Mistral models
    // Removed: codestral, mistral-nemo (Not Found)
    "mistralai/devstral-2-123b-instruct-2512",
    "mistralai/magistral-small-2506",
    "mistralai/mamba-codestral-7b-v0.1",
    "mistralai/mathstral-7b-v0.1",
    "mistralai/ministral-14b-instruct-2512",
    "mistralai/mistral-7b-instruct-v0.2",
    "mistralai/mistral-7b-instruct-v0.3",
    // Removed: mistral-large-2 (Not Found)
    "mistralai/mistral-large-3-675b-instruct-2512",
    "mistralai/mistral-medium-3-instruct",
    "mistralai/mistral-small-24b-instruct",
    "mistralai/mistral-small-3.1-24b-instruct-2503",
    "mistralai/mixtral-8x22b-instruct-v0.1",
    "mistralai/mixtral-8x7b-instruct-v0.1",

    // Microsoft Phi models
    "microsoft/phi-3-medium-128k-instruct",
    "microsoft/phi-3-medium-4k-instruct",
    "microsoft/phi-3-mini-128k-instruct",
    "microsoft/phi-3-mini-4k-instruct",
    "microsoft/phi-3-small-128k-instruct",
    "microsoft/phi-3-small-8k-instruct",
    // Removed: phi-3-vision (Not Found)
    "microsoft/phi-3.5-mini-instruct",
    // Removed: phi-3.5-moe (Not Found)
    "microsoft/phi-3.5-vision-instruct",
    "microsoft/phi-4-mini-flash-reasoning",
    "microsoft/phi-4-mini-instruct",
    "microsoft/phi-4-multimodal-instruct",

    // NVIDIA Nemotron models
    "nvidia/llama-3.1-nemoguard-8b-content-safety",
    "nvidia/llama-3.1-nemoguard-8b-topic-control",
    // Removed: nemotron-51b, nemotron-70b (Not Found)
    "nvidia/llama-3.1-nemotron-nano-4b-v1.1",
    "nvidia/llama-3.1-nemotron-nano-8b-v1",
    "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
    "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
    "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    "nvidia/llama-3.3-nemotron-super-49b-v1",
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    "nvidia/llama3-chatqa-1.5-70b",
    "nvidia/llama3-chatqa-1.5-8b",
    "nvidia/mistral-nemo-minitron-8b-8k-instruct",
    // Removed: nemotron-4-340b (Not Found)
    "nvidia/nemotron-mini-4b-instruct",

    // DeepSeek models
    // Removed: deepseek-coder (Not Found)
    "deepseek-ai/deepseek-r1-distill-llama-8b",
    "deepseek-ai/deepseek-r1-distill-qwen-14b",
    "deepseek-ai/deepseek-r1-distill-qwen-32b",
    "deepseek-ai/deepseek-r1-distill-qwen-7b",

    // GLM models
    "z-ai/glm4.7",
    "z-ai/glm5",
    "thudm/chatglm3-6b",

    // OpenAI models
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",

    // Moonshot models
    "moonshotai/kimi-k2-instruct",
    "moonshotai/kimi-k2-instruct-0905",

    // Other quality models
    "ai21labs/jamba-1.5-large-instruct",
    "ai21labs/jamba-1.5-mini-instruct",
    "baichuan-inc/baichuan2-13b-chat",
    "bigcode/starcoder2-15b",
    "bigcode/starcoder2-7b",
    "databricks/dbrx-instruct",
    // Removed: granite-3.0-3b, granite-3.0-8b, granite-34b, granite-8b-code (Not Found)
    "ibm/granite-3.3-8b-instruct",
    // Removed: codellama-70b (Not Found)
    "tiiuae/falcon3-7b-instruct",
    "upstage/solar-10.7b-instruct",
    "zyphra/zamba2-7b-instruct",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Create key: replace / with - for valid identifier
    const key = id.replace(/\//g, "-");
    models[key] = provider(id);
  });

  return models;
}
