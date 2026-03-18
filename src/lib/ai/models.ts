import "server-only";
import { LanguageModel } from "ai";
import { createNvidiaModels } from "./nvidia";
import { ChatModel } from "app-types/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// NVIDIA NIM API - All models (Pro tier with API key)
const nvidiaModels = createNvidiaModels();

/**
 * Creates a custom fetch wrapper that handles non-streaming proxies.
 * If a stream is requested but the proxy returns JSON, it wraps the JSON into an SSE stream.
 */
function createStreamingProxyFetch() {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const res = await fetch(input, init);

    // Only intercept if its a successful response where we might have wanted a stream
    const contentType = res.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const isEventStream = contentType?.includes("text/event-stream");

    // Check if stream was requested in the body
    let isStreamRequested = false;
    try {
      if (init?.body && typeof init.body === "string") {
        const body = JSON.parse(init.body);
        isStreamRequested = body.stream === true;
      }
    } catch (_e) {
      // Ignore parse errors
    }

    if (res.ok && (isJson || isEventStream) && isStreamRequested) {
      // Clone the response so we can check if it's already a valid stream
      const resClone = res.clone();
      const reader = resClone.body?.getReader();
      const decoder = new TextDecoder();
      const { value } = (await reader?.read()) || {};
      const chunk = decoder.decode(value);

      // If it's already a valid SSE stream with data: prefixes, just return the original response
      if (chunk && chunk.includes("data:")) {
        return res;
      }

      // Otherwise, it's likely raw JSON (even if Content-Type is text/event-stream)
      // We'll read the full body and polyfill it
      const dataStr = chunk + (await res.text());
      let data;
      try {
        data = JSON.parse(dataStr);
      } catch (_e) {
        // If it's not JSON, return original response
        return res;
      }

      // If it's already a full completion but we wanted a stream, polyfill it
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            // Send the content as a single delta chunk
            const chunk = {
              id: data.id || `poly-${Date.now()}`,
              object: "chat.completion.chunk",
              created: data.created || Math.floor(Date.now() / 1000),
              model: data.model,
              choices: [
                {
                  index: 0,
                  delta: { content: data.choices[0].message.content },
                  finish_reason: null,
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
            );

            // Send a final chunk with finish_reason
            const finishChunk = {
              id: data.id || `poly-${Date.now()}`,
              object: "chat.completion.chunk",
              created: data.created || Math.floor(Date.now() / 1000),
              model: data.model,
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: data.choices[0].finish_reason || "stop",
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`),
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
    }

    return res;
  };
}

const streamingFetch = createStreamingProxyFetch();

// Custom Proxies Initialized
const deepseekProvider = createOpenAICompatible({
  name: "DeepSeek", // changed from Deepseek Custom
  apiKey: "dummy",
  baseURL: "https://deepseek-proxy.llamai.workers.dev/v1",
  fetch: streamingFetch,
});

const qwenProvider = createOpenAICompatible({
  name: "QWEN", // changed from Qwen Custom
  apiKey: "dummy",
  baseURL: "https://qwen-worker-proxy.ronitshrimankar1.workers.dev/v1",
});

const claudeTalkAIProvider = createOpenAICompatible({
  name: "Anthropic Claude", // changed from Claude TalkAI Custom
  apiKey: "dummy",
  baseURL: "https://claude-talkai.ronitshrimankar1.workers.dev/v1",
  fetch: streamingFetch,
});

const miniMaxM1Provider = createOpenAICompatible({
  name: "MiniMax M1", // changed from MiniMax M1 Custom
  apiKey: "dummy",
  baseURL: "https://minimax-proxy.llamai.workers.dev/v1",
  fetch: streamingFetch,
});

const miniMaxM2Provider = createOpenAICompatible({
  name: "MiniMax M2.1", // changed from MiniMax M2.1 Custom
  apiKey: "dummy",
  baseURL: "https://freeai-minimax.qwen4346.workers.dev/v1",
  fetch: streamingFetch,
});

const kimiProvider = createOpenAICompatible({
  name: "Moonshot AI (Kimi)",
  apiKey: "dummy",
  baseURL: "https://kimi-k2.qwen4346.workers.dev/v1",
  fetch: streamingFetch,
});

const n33AIProvider = createOpenAICompatible({
  name: "N33 AI",
  apiKey: "dummy",
  baseURL: "https://n33-ai.qwen4346.workers.dev/v1",
});

const chatbotAIProvider = createOpenAICompatible({
  name: "Chatbot AI (GPT)",
  apiKey: "dummy",
  baseURL: "https://chatbot-ai.qwen4346.workers.dev/v1",
  fetch: streamingFetch,
});

const grokFreeProvider = createOpenAICompatible({
  name: "xAI (Grok Free)",
  apiKey: "dummy",
  baseURL: "https://grok-proxy.qwen4346.workers.dev/v1",
  fetch: streamingFetch,
});

const staticModels = {
  // Anthropic models (via proxy)
  anthropic: {
    "claude-sonnet-4.5-proxy": nvidiaModels["meta-llama-3.1-405b-instruct"], // Fallback proxy
  },

  // xAI (Grok Free) Models
  "xAI (Grok Free)": {
    "Grok 4": grokFreeProvider("grok-4"),
    "Grok 3": grokFreeProvider("grok-3"),
    "Grok 3 Mini": grokFreeProvider("grok-3-mini"),
    "GPT-4o": grokFreeProvider("gpt-4o"),
    "GPT-4o Mini": grokFreeProvider("gpt-4o-mini"),
  },

  // Chatbot AI (GPT) Models
  "Chatbot AI (GPT)": {
    "GPT-4": chatbotAIProvider("gpt-4"),
    "GPT-4 Turbo": chatbotAIProvider("gpt-4-turbo-preview"),
    "GPT-4 (1106)": chatbotAIProvider("gpt-4-1106-preview"),
    "GPT-4 (0125)": chatbotAIProvider("gpt-4-0125-preview"),
    "GPT-3.5 Turbo": chatbotAIProvider("gpt-3.5-turbo"),
    "GPT-3.5 Turbo (16K)": chatbotAIProvider("gpt-3.5-turbo-16k"),
  },

  // Moonshot AI (Kimi) Models
  "Moonshot AI (Kimi)": {
    "Kimi K2.5": kimiProvider("kimi-k2.5"),
    "Kimi K2-0905": kimiProvider("kimi-k2-0905"),
    "Kimi K2-Thinking": kimiProvider("kimi-k2-thinking"),
  },

  // N33 AI Models
  "N33 AI": {
    "Sonar (Perplexity)": n33AIProvider("sonar"),
    "Sonar Pro (Perplexity)": n33AIProvider("sonar-pro"),
    "Grok 4.1 Fast (xAI)": n33AIProvider("grok-4.1-fast"),
    "Claude 4.5 Haiku": n33AIProvider("claude-haiku-4.5"),
    "Claude 4.5 Sonnet": n33AIProvider("claude-sonnet-4.5"),
    "Claude 4.5 Opus": n33AIProvider("claude-opus-4.5"),
    "GPT-5.2": n33AIProvider("gpt-5.2"),
    "Gemini 3 Flash": n33AIProvider("gemini-3-flash"),
    "Gemini 3 Pro": n33AIProvider("gemini-3-pro"),
  },

  // Deepseek API Models
  DeepSeek: {
    "DeepSeek V3.2": deepseekProvider("deepseek-v3.2-exp"),
    "DeepSeek V3.2 (Base)": deepseekProvider("deepseek-v3.2"),
    "DeepSeek V3": deepseekProvider("deepseek-v3"),
    "DeepSeek VL": deepseekProvider("deepseek-vl"),
    "DeepSeek V2": deepseekProvider("deepseek-v2"),
    "DeepSeek Math": deepseekProvider("deepseek-math"),
    "DeepSeek Coder": deepseekProvider("deepseek-coder"),
    "DeepSeek R1": deepseekProvider("deepseek-r1"),
    "DeepSeek Reasoner": deepseekProvider("deepseek-reasoner"),
    "DeepSeek Chat": deepseekProvider("deepseek-chat"),
  },

  // Qwen API Models
  QWEN: {
    "Qwen 2.5 Coder (Plus)": qwenProvider("qwen3-coder-plus"),
    "Qwen 2.5 Coder (Flash)": qwenProvider("qwen3-coder-flash"),
    "Qwen Vision (VL)": qwenProvider("vision-model"),
  },

  // Claude API Models
  "Anthropic Claude": {
    "Claude 3.5 Sonnet": claudeTalkAIProvider("claude-3-5-sonnet-20241022"),
    "Claude 3.5 Haiku": claudeTalkAIProvider("claude-3-5-haiku-20241022"),
    "Claude 3.5 Sonnet (Reasoning)": claudeTalkAIProvider(
      "claude-3-5-sonnet-reasoning",
    ),
    "Claude 3 Opus": claudeTalkAIProvider("claude-3-opus-20240229"),
    "Claude 3 Sonnet": claudeTalkAIProvider("claude-3-sonnet-20240229"),
    "Claude 3 Haiku": claudeTalkAIProvider("claude-3-haiku-20240307"),
    "GPT-4o": claudeTalkAIProvider("gpt-4o"),
    "GPT-4o Mini": claudeTalkAIProvider("gpt-4o-mini"),
    "ChatGPT-4o (Latest)": claudeTalkAIProvider("chatgpt-4o-latest"),
    "GPT-4 Turbo": claudeTalkAIProvider("gpt-4-turbo"),
    "GPT-4": claudeTalkAIProvider("gpt-4"),
    o1: claudeTalkAIProvider("o1"),
    "o1-mini": claudeTalkAIProvider("o1-mini"),
    "o1-preview": claudeTalkAIProvider("o1-preview"),
    "o3-mini": claudeTalkAIProvider("o3-mini"),
    "Deepseek R1 (Anthropic Node)": claudeTalkAIProvider("deepseek-r1"),
    "Deepseek Reasoner (Anthropic Node)":
      claudeTalkAIProvider("deepseek-reasoner"),
    "Claude 2": claudeTalkAIProvider("claude-2"),
    "Claude Instant": claudeTalkAIProvider("claude-instant"),
  },

  // MiniMax Models
  "MiniMax M1": {
    "MiniMax-01 (M1)": miniMaxM1Provider("minimax-01"),
  },
  "MiniMax M2.1": {
    "MiniMax-01 (M2.1)": miniMaxM2Provider("minimax-01"),
  },

  // DeepSeek models
  deepseek: {
    // Removed: deepseek-coder, deepseek-r1-distill-qwen-7b, deepseek-r1-distill-qwen-14b, deepseek-r1-distill-qwen-32b (Not Found / Down)
    "deepseek-r1-distill-llama-8b":
      nvidiaModels["deepseek-ai-deepseek-r1-distill-llama-8b"],
  },

  // IBM Granite models
  granite: {
    // Removed: granite-3.0-3b, granite-3.0-8b, granite-34b, granite-8b-code, granite-3.3-8b-instruct (Not Found/Degraded)
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
    // Removed: llama-4-scout, codellama-70b (Not Found)
    "llama-guard-4-12b": nvidiaModels["meta-llama-guard-4-12b"],
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
    // Removed: phi-3-vision, phi-4-mini-instruct, phi-4-mini-flash-reasoning (Not Found/Degraded/Down)
    "phi-3.5-mini-instruct": nvidiaModels["microsoft-phi-3.5-mini-instruct"],
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
    // Removed: mistral-large-2, codestral, mistral-nemo (Not Found)
    "mistral-large-3-675b-instruct":
      nvidiaModels["mistralai-mistral-large-3-675b-instruct-2512"],
    "mistral-medium-3-instruct":
      nvidiaModels["mistralai-mistral-medium-3-instruct"],
    "mixtral-8x7b-instruct-v0.1":
      nvidiaModels["mistralai-mixtral-8x7b-instruct-v0.1"],
    "mixtral-8x22b-instruct-v0.1":
      nvidiaModels["mistralai-mixtral-8x22b-instruct-v0.1"],
    "mathstral-7b-v0.1": nvidiaModels["mistralai-mathstral-7b-v0.1"],
    "ministral-14b-instruct-2512":
      nvidiaModels["mistralai-ministral-14b-instruct-2512"],
  },

  // Moonshot models
  moonshot: {
    "kimi-k2-instruct": nvidiaModels["moonshotai-kimi-k2-instruct"],
    "kimi-k2-instruct-0905": nvidiaModels["moonshotai-kimi-k2-instruct-0905"],
  },

  // NVIDIA Nemotron models
  nemotron: {
    // Removed: nemotron-4-340b, nemotron-51b, nemotron-70b (Not Found)
    "nemotron-mini-4b-instruct":
      nvidiaModels["nvidia-nemotron-mini-4b-instruct"],
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
    // Removed: qwen3-235b-a22b, qwen3-coder-480b-a35b-instruct, qwen3.5-397b-a17b (Down/Not Found)
    "qwen3-next-80b-a3b-instruct":
      nvidiaModels["qwen-qwen3-next-80b-a3b-instruct"],
    "qwq-32b": nvidiaModels["qwen-qwq-32b"],
  },

  // GLM models (Z-AI)
  zai: {
    // Removed: glm-4.7 (Down)
    "glm-5": nvidiaModels["z-ai-glm5"],
    "chatglm3-6b": nvidiaModels["thudm-chatglm3-6b"],
  },

  // Other quality models
  other: {
    "jamba-1.5-mini-instruct": nvidiaModels["ai21labs-jamba-1.5-mini-instruct"],
    "falcon3-7b-instruct": nvidiaModels["tiiuae-falcon3-7b-instruct"],
    "solar-10.7b-instruct": nvidiaModels["upstage-solar-10.7b-instruct"],
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
  // Removed: phi-3-vision (Not Found)
  "phi-3.5-vision-instruct": staticModels.microsoft["phi-3.5-vision-instruct"],
  "phi-4-multimodal-instruct":
    staticModels.microsoft["phi-4-multimodal-instruct"],
};

const allModels: Record<string, Record<string, LanguageModel>> = {
  ...staticModels,
};

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

function checkProviderAPIKey(_provider: string) {
  // Check if NVIDIA API key is set
  return !!process.env.NVIDIA_API_KEY;
}
