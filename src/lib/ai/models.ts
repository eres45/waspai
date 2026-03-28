import { LanguageModel } from "ai";
import {
  ANTHROPIC_FILE_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
} from "./file-support";
import { createNvidiaModels } from "./nvidia";
import { ChatModel } from "app-types/chat";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Sanitizes model output by removing proxy-injected metadata suffixes
 * (e.g., trailing total_tokens count or shard IDs like -1).
 */
/**
 * Sanitizes model output by removing proxy-injected metadata suffixes
 * (e.g., trailing total_tokens count or shard IDs like -1).
 * Also handles a stateful citation buffer for streaming.
 */
function sanitizeContentWithBuffer(
  content: string,
  state: { citationBuffer: string },
  totalTokens?: number,
): string {
  if (!content && !state.citationBuffer) return content;

  // Append new content to our persistent buffer
  const fullContent = state.citationBuffer + content;
  let cleaned = fullContent;

  // 1. Strip all COMPLETE citations like [1], [2], [10:1] etc.
  // We use a regex that looks for [...]
  cleaned = cleaned.replace(/\[\d+\]/g, "");
  cleaned = cleaned.replace(/\[\d+:\d+\]/g, ""); // Support [page:line] style

  // 3. Strip all XML tool call tags (e.g., <tool_call>, <function>, <parameter>, <invoke>)
  // This prevents internal model "thoughts" or manual tool call syntax from leaking into the UI.
  cleaned = cleaned.replace(
    /<(tool_call|function|parameter|invoke|tool_code|minimax:tool_call)[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  cleaned = cleaned.replace(
    /<(tool_call|function|parameter|invoke|tool_code|minimax:tool_call)[^>]*\/>/gi,
    "",
  );
  cleaned = cleaned.replace(
    /<\/?(tool_call|function|parameter|invoke|tool_code|minimax:tool_call)[^>]*>/gi,
    "",
  );

  // 4. Strip all markdown image links (![alt](url)) to prevent duplicates
  // This is a fail-safe for when the model includes an image link that is already in the UI.
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/gi, "");

  // 2. Look for a partial citation at the VERY END of the string
  // Matches: "[", "[1", "[12", etc.
  const partialMatch = cleaned.match(/\[\d*$/);

  if (partialMatch) {
    // Keep the partial part in the buffer for the next chunk
    state.citationBuffer = partialMatch[0];
    // Remove it from what we send to the UI now
    cleaned = cleaned.slice(0, -partialMatch[0].length);
  } else {
    // No partial citation at the end, clear the buffer
    state.citationBuffer = "";
  }

  // 3. One-time sanitization for non-streaming artifacts (only if no buffer)
  if (state.citationBuffer === "") {
    // Remove trailing total_tokens
    if (totalTokens !== undefined && totalTokens > 0) {
      const tokenStr = totalTokens.toString();
      if (cleaned.endsWith(tokenStr)) {
        cleaned = cleaned.slice(0, -tokenStr.length);
      }
    }
    // Remove trailing '-1' placeholder
    if (cleaned.endsWith("-1")) {
      cleaned = cleaned.slice(0, -2);
    }
  }

  return cleaned;
}

/**
 * Processes a single SSE line, sanitizing content if it's a data chunk.
 */
function processSseLine(
  line: string,
  state: { citationBuffer: string },
): string {
  const trimmedLine = line.trim();
  if (!trimmedLine) return "";

  let dataStr = "";
  let isSse = false;

  if (trimmedLine.startsWith("data: ")) {
    dataStr = trimmedLine.slice(6).trim();
    isSse = true;
  } else if (trimmedLine.startsWith("{")) {
    dataStr = trimmedLine;
    isSse = true;
  }

  if (isSse) {
    if (dataStr === "[DONE]") {
      return "data: [DONE]";
    }

    try {
      const data = JSON.parse(dataStr);
      const delta = data.choices?.[0]?.delta;
      const message = data.choices?.[0]?.message;

      if (delta) {
        if (delta.content !== undefined) {
          delta.content = sanitizeContentWithBuffer(delta.content, state);
        }
        // Pass through reasoning fields
        if (delta.reasoning_content !== undefined) {
          delta.reasoning_content = sanitizeContentWithBuffer(
            delta.reasoning_content,
            state,
          );
        }
        if (delta.thought !== undefined) {
          delta.thought = sanitizeContentWithBuffer(delta.thought, state);
        }
      } else if (message) {
        if (message.content !== undefined) {
          message.content = sanitizeContentWithBuffer(
            message.content,
            state,
            data.usage?.total_tokens,
          );
        }
        // Pass through reasoning fields for non-streaming
        if (message.reasoning_content !== undefined) {
          message.reasoning_content = sanitizeContentWithBuffer(
            message.reasoning_content,
            state,
          );
        }
      }
      return `data: ${JSON.stringify(data)}`;
    } catch {
      return trimmedLine.startsWith("{") ? `data: ${trimmedLine}` : trimmedLine;
    }
  }

  return trimmedLine;
}

/**
 * Creates a custom fetch wrapper that handles non-streaming proxies.
 * If a stream is requested but the proxy returns JSON, it wraps the JSON into an SSE stream.
 */
function createStreamingProxyFetch(options?: { forceNonStreaming?: boolean }) {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    let isStreamRequested = false;
    let newInit = init;

    // Check if stream was requested in the body
    try {
      if (init?.body && typeof init.body === "string") {
        const body = JSON.parse(init.body);
        isStreamRequested = body.stream === true;

        if (isStreamRequested && options?.forceNonStreaming) {
          body.stream = false;
          newInit = {
            ...init,
            body: JSON.stringify(body),
          };
        }
      }
    } catch (_e) {
      // Ignore parse errors
    }

    const res = await fetch(input, newInit);

    // If it's a 2xx response, we might need to intercept it
    if (res.ok) {
      const contentType = res.headers.get("content-type");
      const isJson = contentType?.includes("application/json");
      const isEventStream = contentType?.includes("text/event-stream");

      // If it's already an SSE stream, intercept it to sanitize chunks
      if (isEventStream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        const citationState = { citationBuffer: "" };

        const stream = new ReadableStream({
          async pull(controller) {
            const { done, value } = await reader.read();

            if (done) {
              if (buffer.trim()) {
                const eventLines = buffer.split("\n");
                let transformedEvent = "";
                for (const line of eventLines) {
                  transformedEvent +=
                    processSseLine(line, citationState) + "\n";
                }
                controller.enqueue(encoder.encode(transformedEvent));
              }
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
              const eventLines = event.split("\n");
              let transformedEvent = "";
              for (const line of eventLines) {
                transformedEvent += processSseLine(line, citationState) + "\n";
              }
              controller.enqueue(encoder.encode(transformedEvent + "\n"));
            }
          },
          cancel() {
            reader.cancel();
          },
        });

        return new Response(stream, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      }

      // If it's JSON but we requested a stream, polyfill it
      if (isJson && isStreamRequested) {
        // Read the full body once
        const bodyText = await res.text();

        // Check if it's a valid SSE stream with data: prefixes (fallback in case content-type was wrong)
        if (bodyText.includes("data:")) {
          return new Response(bodyText, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
          });
        }

        // Try to parse as JSON to see if we need to polyfill
        let data;
        try {
          data = JSON.parse(bodyText);
        } catch (_e) {
          // Not valid JSON, return a new response from the original text
          return new Response(bodyText, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
          });
        }

        // Polyfill logic: If it's a completion JSON but we wanted a stream
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
                    delta: {
                      content: sanitizeContentWithBuffer(
                        data.choices[0].message.content,
                        { citationBuffer: "" }, // Non-streaming, fresh buffer
                        data.usage?.total_tokens,
                      ),
                      // Pass through reasoning if polyfilling
                      reasoning_content:
                        data.choices[0].message.reasoning_content,
                    },
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

        // If we reach here, it's a 200 with JSON but not a recognized completion
        return new Response(bodyText, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      }
    }

    // For all other cases (errors, non-intercepted successes), we still need to
    // ensure the response is fresh if possible. But here 'res' hasn't been read yet.
    return res;
  };
}

export const streamingFetch = createStreamingProxyFetch();

// NVIDIA NIM API - All models (Pro tier with API key)
const nvidiaModels = createNvidiaModels();

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
  fetch: streamingFetch,
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
  fetch: streamingFetch,
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

const aiHubMixProvider = createOpenAICompatible({
  name: "AIHubMix",
  apiKey: "dummy",
  baseURL: "https://aihubmix-worker.llamai.workers.dev/v1",
  fetch: createStreamingProxyFetch({ forceNonStreaming: true }),
});

const staticModels = {
  // --- Anthropic Claude Models ---
  Anthropic: {
    "Claude 3.5 Sonnet (P1)": claudeTalkAIProvider(
      "claude-3-5-sonnet-20241022",
    ),
    "Claude 4.5 Sonnet (P2)": n33AIProvider("claude-sonnet-4.5"),
    "Claude 3.5 Haiku (P1)": claudeTalkAIProvider("claude-3-5-haiku-20241022"),
    "Claude 4.5 Haiku (P2)": n33AIProvider("claude-haiku-4.5"),
    "Claude 3.5 Sonnet (Reason)": claudeTalkAIProvider(
      "claude-3-5-sonnet-reasoning",
    ),
    "Claude 3 Opus (P1)": claudeTalkAIProvider("claude-3-opus-20240229"),
    "Claude 4.5 Opus (P2)": n33AIProvider("claude-opus-4.5"),
    "Claude 3 Sonnet": claudeTalkAIProvider("claude-3-sonnet-20240229"),
    "Claude 3 Haiku": claudeTalkAIProvider("claude-3-haiku-20240307"),
    "Claude 2": claudeTalkAIProvider("claude-2"),
    "Claude Instant": claudeTalkAIProvider("claude-instant"),
    "Claude 3.5 Sonnet (Proxy)": nvidiaModels["meta-llama-3.1-405b-instruct"],
  },

  // --- OpenAI Models ---
  OpenAI: {
    "GPT-4o (P1)": claudeTalkAIProvider("gpt-4o"),
    "GPT-4o (P2)": grokFreeProvider("gpt-4o"),
    "GPT-4o Mini (P1)": claudeTalkAIProvider("gpt-4o-mini"),
    "GPT-4o Mini (P2)": grokFreeProvider("gpt-4o-mini"),
    "ChatGPT-4o (Latest)": claudeTalkAIProvider("chatgpt-4o-latest"),
    "GPT-5.2": n33AIProvider("gpt-5.2"),
    "GPT-4 Turbo (P1)": claudeTalkAIProvider("gpt-4-turbo"),
    "GPT-4 Turbo (P2)": chatbotAIProvider("gpt-4-turbo-preview"),
    "GPT-4 (P1)": claudeTalkAIProvider("gpt-4"),
    "GPT-4 (P2)": chatbotAIProvider("gpt-4"),
    "GPT-4 (1106)": chatbotAIProvider("gpt-4-1106-preview"),
    "GPT-4 (0125)": chatbotAIProvider("gpt-4-0125-preview"),
    "GPT-3.5 Turbo (P1)": chatbotAIProvider("gpt-3.5-turbo"),
    "GPT-3.5 Turbo (16K)": chatbotAIProvider("gpt-3.5-turbo-16k"),
    o1: claudeTalkAIProvider("o1"),
    "o1-mini": claudeTalkAIProvider("o1-mini"),
    "o1-preview": claudeTalkAIProvider("o1-preview"),
    "o3-mini": claudeTalkAIProvider("o3-mini"),
    "openai-gpt-oss-20b": nvidiaModels["openai-gpt-oss-20b"],
    "openai-gpt-oss-120b": nvidiaModels["openai-gpt-oss-120b"],
    "gpt-4.1": aiHubMixProvider("gpt-4.1-free"),
    "gpt-4.1-mini": aiHubMixProvider("gpt-4.1-mini-free"),
    "gpt-4.1-nano": aiHubMixProvider("gpt-4.1-nano-free"),
    "gpt-4o": aiHubMixProvider("gpt-4o-free"),
    "GPT-5.4 mini": aiHubMixProvider("gpt-4.1-mini-free"),
    "GPT-5.4 nano": aiHubMixProvider("gpt-4.1-nano-free"),
    "GPT-4o search preview": aiHubMixProvider("gpt-4o-search-preview-free"),
  },

  // --- DeepSeek Models ---
  DeepSeek: {
    "DeepSeek V3.2 (P1)": deepseekProvider("deepseek-v3.2-exp"),
    "DeepSeek V3.2 (Base)": deepseekProvider("deepseek-v3.2"),
    "DeepSeek V3": deepseekProvider("deepseek-v3"),
    "DeepSeek VL": deepseekProvider("deepseek-vl"),
    "DeepSeek V2": deepseekProvider("deepseek-v2"),
    "DeepSeek Math": deepseekProvider("deepseek-math"),
    "DeepSeek Coder": deepseekProvider("deepseek-coder"),
    "DeepSeek R1 (P1)": deepseekProvider("deepseek-r1"),
    "DeepSeek R1 (P2)": claudeTalkAIProvider("deepseek-r1"),
    "DeepSeek Reasoner (P1)": deepseekProvider("deepseek-reasoner"),
    "DeepSeek Reasoner (P2)": claudeTalkAIProvider("deepseek-reasoner"),
    "DeepSeek Chat": deepseekProvider("deepseek-chat"),
    "DeepSeek R1 Distill Llama 8B":
      nvidiaModels["deepseek-ai-deepseek-r1-distill-llama-8b"],
  },

  // --- Google Gemini Models ---
  Google: {
    "Gemini 3 Pro": n33AIProvider("gemini-3-pro"),
    "Gemini 3.1 Flash Image Preview": aiHubMixProvider(
      "gemini-3.1-flash-image-preview-free",
    ),
    "Gemini 3 Flash Preview": aiHubMixProvider("gemini-3-flash-preview-free"),
    "Gemini 2.0 Flash": aiHubMixProvider("gemini-2.0-flash-free"),
  },

  // --- xAI (Grok) Models ---
  xAI: {
    "Grok 4.1 Fast": n33AIProvider("grok-4.1-fast"),
    "Grok 4": grokFreeProvider("grok-4"),
    "Grok 3": grokFreeProvider("grok-3"),
    "Grok 3 Mini": grokFreeProvider("grok-3-mini"),
  },

  // --- Qwen Models ---
  Qwen: {
    "qwen3-coder-plus": qwenProvider("qwen3-coder-plus"),
    "qwen3-coder-flash": qwenProvider("qwen3-coder-flash"),
    "Qwen Vision (VL)": qwenProvider("vision-model"),
    "Qwen 2 7B": nvidiaModels["qwen-qwen2-7b-instruct"],
    "Qwen 2.5 7B": nvidiaModels["qwen-qwen2.5-7b-instruct"],
    "Qwen 2.5 Coder 7B": nvidiaModels["qwen-qwen2.5-coder-7b-instruct"],
    "Qwen 2.5 Coder 32B": nvidiaModels["qwen-qwen2.5-coder-32b-instruct"],
    "Qwen 3 Coder 480B": nvidiaModels["qwen-qwen3-coder-480b-a35b-instruct"],
    "Qwen 3 Next 80B": nvidiaModels["qwen-qwen3-next-80b-a3b-instruct"],
    "QwQ 32B": nvidiaModels["qwen-qwq-32b"],
  },

  // --- Meta (Llama) Models ---
  Meta: {
    "Llama 3.1 8B": nvidiaModels["meta-llama-3.1-8b-instruct"],
    "Llama 3.1 70B": nvidiaModels["meta-llama-3.1-70b-instruct"],
    "Llama 3.1 405B": nvidiaModels["meta-llama-3.1-405b-instruct"],
    "Llama 3.2 1B": nvidiaModels["meta-llama-3.2-1b-instruct"],
    "Llama 3.2 3B": nvidiaModels["meta-llama-3.2-3b-instruct"],
    "Llama 3.2 11B Vision": nvidiaModels["meta-llama-3.2-11b-vision-instruct"],
    "Llama 3.2 90B Vision": nvidiaModels["meta-llama-3.2-90b-vision-instruct"],
    "Llama 3.3 70B": nvidiaModels["meta-llama-3.3-70b-instruct"],
    "Llama 4 Maverick 17B":
      nvidiaModels["meta-llama-4-maverick-17b-128e-instruct"],
    "Llama Guard 4 12B": nvidiaModels["meta-llama-guard-4-12b"],
    "Llama 3 8B": nvidiaModels["meta-llama3-8b-instruct"],
    "Llama 3 70B": nvidiaModels["meta-llama3-70b-instruct"],
  },

  // --- Microsoft (Phi) Models ---
  Microsoft: {
    "Phi-3 Mini 4K": nvidiaModels["microsoft-phi-3-mini-4k-instruct"],
    "Phi-3 Mini 128K": nvidiaModels["microsoft-phi-3-mini-128k-instruct"],
    "Phi-3 Small 8K": nvidiaModels["microsoft-phi-3-small-8k-instruct"],
    "Phi-3 Small 128K": nvidiaModels["microsoft-phi-3-small-128k-instruct"],
    "Phi-3 Medium 4K": nvidiaModels["microsoft-phi-3-medium-4k-instruct"],
    "Phi-3 Medium 128K": nvidiaModels["microsoft-phi-3-medium-128k-instruct"],
    "Phi-3.5 Mini": nvidiaModels["microsoft-phi-3.5-mini-instruct"],
    "Phi-3.5 Vision": nvidiaModels["microsoft-phi-3.5-vision-instruct"],
    "Phi-4 Mini Reasoning":
      nvidiaModels["microsoft-phi-4-mini-flash-reasoning"],
    "Phi-4 Mini": nvidiaModels["microsoft-phi-4-mini-instruct"],
    "Phi-4 Multimodal": nvidiaModels["microsoft-phi-4-multimodal-instruct"],
  },

  // --- Mistral AI Models ---
  Mistral: {
    "Mistral 7B v0.2": nvidiaModels["mistralai-mistral-7b-instruct-v0.2"],
    "Mistral 7B v0.3": nvidiaModels["mistralai-mistral-7b-instruct-v0.3"],
    "Mistral Small 24B": nvidiaModels["mistralai-mistral-small-24b-instruct"],
    "Mistral Small 3.1 24B":
      nvidiaModels["mistralai-mistral-small-3.1-24b-instruct-2503"],
    "Mistral Large 3 675B":
      nvidiaModels["mistralai-mistral-large-3-675b-instruct-2512"],
    "Mistral Medium 3": nvidiaModels["mistralai-mistral-medium-3-instruct"],
    "Mixtral 8x7B v0.1": nvidiaModels["mistralai-mixtral-8x7b-instruct-v0.1"],
    "Mixtral 8x22B v0.1": nvidiaModels["mistralai-mixtral-8x22b-instruct-v0.1"],
    "Mathstral 7B": nvidiaModels["mistralai-mathstral-7b-v0.1"],
    "Ministral 14B": nvidiaModels["mistralai-ministral-14b-instruct-2512"],
    "Mistral Devstral 123B":
      nvidiaModels["mistralai-devstral-2-123b-instruct-2512"],
    "Mistral Magistral Small": nvidiaModels["mistralai-magistral-small-2506"],
    "Mistral Mamba Codestral":
      nvidiaModels["mistralai-mamba-codestral-7b-v0.1"],
  },

  // --- Moonshot (Kimi) Models ---
  Moonshot: {
    "Kimi K2.5": kimiProvider("kimi-k2.5"),
    "Kimi K2-0905 (P1)": kimiProvider("kimi-k2-0905"),
    "Kimi K2-Thinking": kimiProvider("kimi-k2-thinking"),
    "Kimi K2-0905 (P2)": nvidiaModels["moonshotai-kimi-k2-instruct-0905"],
    "Kimi K2": nvidiaModels["moonshotai-kimi-k2-instruct"],
    "Kimi for Coding": aiHubMixProvider("kimi-for-coding-free"),
  },

  // --- MiniMax Models ---
  MiniMax: {
    "MiniMax-01 (P1)": miniMaxM1Provider("minimax-01"),
    "MiniMax-01 (P2)": miniMaxM2Provider("minimax-01"),
    "Coding MiniMax M2.7": aiHubMixProvider("coding-minimax-m2.7-free"),
    "MiniMax M2.5": aiHubMixProvider("minimax-m2.5-free"),
    "Coding MiniMax M2.5": aiHubMixProvider("coding-minimax-m2.5-free"),
    "Coding MiniMax M2.1": aiHubMixProvider("coding-minimax-m2.1-free"),
    "Coding MiniMax M2": aiHubMixProvider("coding-minimax-m2-free"),
  },

  // --- Perplexity Models ---
  Perplexity: {
    "Sonar (P1)": n33AIProvider("sonar"),
    "Sonar Pro (P2)": n33AIProvider("sonar-pro"),
  },

  // --- NVIDIA Models ---
  NVIDIA: {
    "Nemotron Mini 4B": nvidiaModels["nvidia-nemotron-mini-4b-instruct"],
    "Llama 3.1 Nemotron Nano 8B":
      nvidiaModels["nvidia-llama-3.1-bonafide-nano-8b-v1"] ||
      nvidiaModels["nvidia-llama-3.1-nemotron-nano-8b-v1"],
    "Llama 3.3 Nemotron Super 49B":
      nvidiaModels["nvidia-llama-3.3-nemotron-super-49b-v1"],
    "Llama 3.3 Nemotron Super 49B v1.5":
      nvidiaModels["nvidia-llama-3.3-nemotron-super-49b-v1.5"],
    "Nemotron Ultra 253B":
      nvidiaModels["nvidia-llama-3.1-nemotron-ultra-253b-v1"],
    "Nemotron Nano 4B": nvidiaModels["nvidia-llama-3.1-nemotron-nano-4b-v1.1"],
    "Nemotron Nano VL 8B":
      nvidiaModels["nvidia-llama-3.1-nemotron-nano-vl-8b-v1"],
  },

  // --- IBM (Granite) Models ---
  IBM: {
    "Granite (Native Placeholder)": nvidiaModels["meta-llama-3.1-8b-instruct"],
  },

  // --- Z-AI (GLM) Models ---
  "Z-AI": {
    "GLM 5": nvidiaModels["z-ai-glm5"],
    "ChatGLM3 6B (Worker)": nvidiaModels["thudm-chatglm3-6b"],
    "Coding GLM 5": aiHubMixProvider("coding-glm-5-free"),
    "Coding GLM 5 Turbo": aiHubMixProvider("coding-glm-5-turbo-free"),
    "Coding GLM 4.7": aiHubMixProvider("coding-glm-4.7-free"),
    "Coding GLM 4.6": aiHubMixProvider("coding-glm-4.6-free"),
    "GLM 4.7 Flash": aiHubMixProvider("glm-4.7-flash-free"),
    "GLM 4.7 (NIM)": nvidiaModels["z-ai-glm4.7"],
  },

  // --- StepFun Models ---
  StepFun: {
    "Step 3.5 Flash": aiHubMixProvider("step-3.5-flash-free"),
  },

  // --- Xiaomi Models ---
  Xiaomi: {
    "Mimo v2 Flash": aiHubMixProvider("mimo-v2-flash-free"),
  },

  // --- Other Quality Models ---
  Other: {
    "Jamba 1.5 Mini": nvidiaModels["ai21labs-jamba-1.5-mini-instruct"],
    "Mimo v2 pro": aiHubMixProvider("mimo-v2-pro-free"),
    "Mimo v2 omni": aiHubMixProvider("mimo-v2-omni-free"),
    "Baichuan 2 13B": nvidiaModels["baichuan-inc-baichuan2-13b-chat"],
    "IBM Granite 3.3": nvidiaModels["ibm-granite-3.3-8b-instruct"],
    "Zamba 2 7B": nvidiaModels["zyphra-zamba2-7b-instruct"],
  },
};

const staticUnsupportedModels = new Set<LanguageModel>([]);

const staticSupportImageInputModels: Record<string, LanguageModel> = {
  // Vision models support image input
  "Llama 3.2 11B Vision": staticModels.Meta["Llama 3.2 11B Vision"],
  "Llama 3.2 90B Vision": staticModels.Meta["Llama 3.2 90B Vision"],
  "Phi-4 Multimodal": staticModels.Microsoft["Phi-4 Multimodal"],
  "Qwen Vision (VL)": staticModels.Qwen["Qwen Vision (VL)"],
  "Gemini 3.1 Flash Image Preview":
    staticModels.Google["Gemini 3.1 Flash Image Preview"],
  "Gemini 3 Flash Preview": staticModels.Google["Gemini 3 Flash Preview"],
  "Gemini 2.0 Flash": staticModels.Google["Gemini 2.0 Flash"],
};

export const allModels: Record<string, Record<string, LanguageModel>> = {
  ...staticModels,
};

const allUnsupportedModels = new Set([...staticUnsupportedModels]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

export const isImageInputUnsupportedModel = (model: LanguageModel) => {
  return !Object.values(staticSupportImageInputModels).includes(model);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  // Check if it's an OpenAI model
  if (Object.values(staticModels.OpenAI).includes(model)) {
    return Array.from(OPENAI_FILE_MIME_TYPES);
  }
  // Check if it's an Anthropic model
  if (Object.values(staticModels.Anthropic).includes(model)) {
    return Array.from(ANTHROPIC_FILE_MIME_TYPES);
  }
  // Fallback to empty
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
          supportedFileMimeTypes: getFilePartSupportedMimeTypes(model),
          tier,
        };
      }),
    hasAPIKey: checkProviderAPIKey(provider as keyof typeof staticModels),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) {
      throw new Error("No model specified");
    }

    // Find provider key case-insensitively
    const providerKey = Object.keys(allModels).find(
      (k) => k.toLowerCase() === model.provider.toLowerCase(),
    );

    // Find model key case-insensitively
    let selectedModel: LanguageModel | undefined;
    if (providerKey && allModels[providerKey]) {
      const modelKey = Object.keys(allModels[providerKey]).find(
        (k) => k.toLowerCase() === model.model.toLowerCase(),
      );
      if (modelKey) {
        selectedModel = allModels[providerKey][modelKey];
      }
    }

    if (!selectedModel) {
      console.warn(
        `⚠️  Model not found: ${model.provider}/${model.model}. Using fallback: Meta/Llama 3.3 70B`,
      );
      // Fallback to a reliable model
      const fallbackModel = staticModels.Meta["Llama 3.3 70B"];
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
