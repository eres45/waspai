import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * LLMChat Models Integration
 * API: https://llmchat.in/inference/stream
 * This provider uses header spoofing and custom request/response mapping
 * to access models without an API key.
 */
export function createLLMChatModels() {
  const provider = createOpenAICompatible({
    name: "llmchat",
    apiKey: "none",
    baseURL: "https://llmchat.in/inference",
    fetch: async (_url, options) => {
      const body = JSON.parse(options?.body as string);
      const model = body.model;
      const messages = body.messages;

      // Transform to LLMChat format
      // The API uses a POST request with model as a query parameter
      // We explicitly check for the base URL to avoid double appending paths if the SDK adds /chat/completions
      const llmchatUrl = `https://llmchat.in/inference/stream?model=${encodeURIComponent(
        model,
      )}`;
      const llmchatBody = JSON.stringify({ messages });

      const response = await fetch(llmchatUrl, {
        ...options,
        method: "POST",
        body: llmchatBody,
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        return response;
      }

      // If non-streaming, LLMChat returns a custom JSON structure
      if (!body.stream) {
        const data = await response.json();
        const openaiResponse = {
          id: `llmchat-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: data?.result?.response || "",
              },
              finish_reason: "stop",
            },
          ],
        };
        return new Response(JSON.stringify(openaiResponse), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // If streaming, interpret the custom JSON stream and convert to SSE
      const reader = response.body?.getReader();
      if (!reader) {
        return response;
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          let buffer = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              // Process buffer to find complete JSON objects
              let braceCount = 0;
              let startIndex = 0;
              let inString = false;
              let escaped = false;

              for (let i = 0; i < buffer.length; i++) {
                const char = buffer[i];

                if (!escaped && char === '"') {
                  inString = !inString;
                }

                if (!escaped) {
                  if (!inString) {
                    if (char === "{") {
                      braceCount++;
                    } else if (char === "}") {
                      braceCount--;

                      // Found a complete JSON object
                      if (braceCount === 0) {
                        const jsonStr = buffer.substring(startIndex, i + 1);
                        try {
                          const json = JSON.parse(jsonStr);

                          // Convert to OpenAI SSE format
                          if (json.result?.response) {
                            const sseChunk = {
                              id: `chatcmpl-${Date.now()}`,
                              object: "chat.completion.chunk",
                              created: Math.floor(Date.now() / 1000),
                              model: model,
                              choices: [
                                {
                                  index: 0,
                                  delta: { content: json.result.response },
                                  finish_reason: null,
                                },
                              ],
                            };
                            controller.enqueue(
                              encoder.encode(
                                `data: ${JSON.stringify(sseChunk)}\n\n`,
                              ),
                            );
                          }
                        } catch (e) {
                          console.error(
                            "Error parsing JSON chunk from LLMChat",
                            e,
                          );
                        }

                        // Move start index to next char
                        startIndex = i + 1;
                      }
                    }
                  }
                }

                if (char === "\\" && !escaped) {
                  escaped = true;
                } else {
                  escaped = false;
                }
              }

              // Remove processed part from buffer
              if (startIndex > 0) {
                buffer = buffer.substring(startIndex);
              }
            }
          } catch (error) {
            controller.error(error);
          } finally {
            // Send DONE message
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },
  });

  const modelIds = [
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    "@cf/meta/llama-3-8b-instruct",
    "@cf/google/gemma-7b-it",
    "@cf/mistralai/mistral-7b-instruct-v0.1",
    "@cf/tiiuae/falcon-7b-instruct",
    "@cf/meta/llama-2-7b-chat-fp16",
    "@cf/qwen/qwen1.5-7b-chat-awq",
    "@cf/defog/sqlcoder-7b-2",
    "@cf/microsoft/phi-2",
    "@cf/meta/llama-3.1-8b-instruct",
    "@cf/meta/llama-3-8b-instruct-awq",
    "@cf/google/gemma-2b-it-lora",
    "@cf/deepseek-ai/deepseek-coder-6.7b-base",
    "@cf/mistralai/openhermes-2.5-mistral-7b",
    "@cf/deepseek-ai/deepseek-coder-6.7b-instruct",
    "@cf/huggingfacegi/zephyr-7b-beta",
    "@cf/meta/llama-2-13b-chat",
    "@cf/intel/neural-chat-7b-v3-1",
    "@cf/meta/llama-guard-7b",
    "@cf/deepseek-ai/deepseek-math-7b-instruct",
    "@cf/nexusflow/starling-lm-7b-beta",
    "@cf/qwen/qwen1.5-0.5b-chat",
    "@cf/qwen/qwen1.5-1.8b-chat",
    "@cf/openchat/openchat-3.5",
    "@cf/una-cybertron/una-cybertron-7b-v2-bf16",
    "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
    "@cf/qwen/qwen1.5-14b-chat-awq",
    "@cf/mistralai/mistral-7b-instruct-v0.2",
  ];

  const models: Record<string, LanguageModel> = {};

  modelIds.forEach((id) => {
    // Standardize key name
    const key = id.replace(/[@/]/g, "-").replace(/^-/, "");
    models[key] = provider(id);
  });

  return models;
}
