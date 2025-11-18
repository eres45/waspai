import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import logger from "logger";

/**
 * QWEN API Provider
 * API: https://sii3.top/api/qwen.php
 *
 * Available Models: Top 10 best QWEN models:
 * - QWEN3 Coder Plus (best for coding)
 * - QWEN3 72B Chat (best general chat)
 * - QWEN3 72B Coder (best for coding)
 * - QWEN3 72B Math (best for math)
 * - QWEN2.5 72B Chat (excellent general chat)
 * - QWEN2.5 72B Coder (excellent for coding)
 * - QWEN2.5 72B Math (excellent for math)
 * - QWEN2.5 72B Instruct (excellent instruction following)
 * - QWEN2.5 72B Coder Chat (excellent for coding conversations)
 * - QWEN2.5 72B Math Chat (excellent for math conversations)
 *
 * Features:
 * - Free to use
 * - No authentication required
 * - Simple JSON API
 * - Fast responses
 * - Only the best quality models
 */

interface QWENResponse {
  date?: string;
  response: string;
  dev?: string;
}

// List of top 10 best QWEN models
const QWEN_MODELS = [
  // QWEN3 Best Models
  "qwen3-coder-plus", // Best for coding
  "qwen3-72b-chat", // Best general chat
  "qwen3-72b-coder", // Best for coding
  "qwen3-72b-math", // Best for math

  // QWEN2.5 Best Models
  "qwen2.5-72b-chat", // Excellent general chat
  "qwen2.5-72b-coder", // Excellent for coding
  "qwen2.5-72b-math", // Excellent for math
  "qwen2.5-72b-instruct", // Excellent instruction following
  "qwen2.5-72b-coder-chat", // Excellent for coding conversations
  "qwen2.5-72b-math-chat", // Excellent for math conversations
];

export function createQWENModels() {
  const models: Record<string, LanguageModel> = {};

  // Create a custom fetch function that transforms QWEN API to OpenAI-compatible format
  const customFetch = async (
    _input: URL | RequestInfo,
    init?: RequestInit,
  ): Promise<Response> => {
    try {
      // Parse the incoming OpenAI-compatible request
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const messages = body.messages || [];
      const lastMessage = messages[messages.length - 1];
      const userText =
        typeof lastMessage?.content === "string"
          ? lastMessage.content
          : lastMessage?.content?.[0]?.text || "";

      // Get the model name from the request
      const modelName = body.model || "qwen2.5-72b-chat";

      // Check if streaming is requested
      const isStreaming = body.stream === true;

      logger.info(
        `QWEN API called: model=${modelName}, streaming=${isStreaming}, text="${userText.substring(0, 50)}..."`,
      );

      // Call QWEN API using POST with model parameter
      const response = await fetch("https://sii3.top/api/qwen.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          prompt: userText,
          model: modelName,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`QWEN API error: ${response.status}`);
      }

      const data: QWENResponse = await response.json();

      if (isStreaming) {
        // Simulate streaming by creating a ReadableStream
        const encoder = new TextEncoder();
        const responseText = data.response;

        // Create SSE stream format
        const stream = new ReadableStream({
          async start(controller) {
            try {
              // Send delta chunks
              const words = responseText.split(" ");
              for (const word of words) {
                const chunk = {
                  choices: [
                    {
                      index: 0,
                      delta: {
                        content: word + " ",
                      },
                      finish_reason: null,
                    },
                  ],
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
                );
                // Small delay to simulate streaming
                await new Promise((resolve) => setTimeout(resolve, 10));
              }

              // Send finish message
              const finishChunk = {
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: "stop",
                  },
                ],
                usage: {
                  prompt_tokens: Math.ceil(userText.length / 4),
                  completion_tokens: Math.ceil(responseText.length / 4),
                  total_tokens:
                    Math.ceil(userText.length / 4) +
                    Math.ceil(responseText.length / 4),
                },
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`),
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } else {
        // Non-streaming response
        const openaiResponse = {
          id: "qwen-" + Date.now(),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: data.response,
              },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: Math.ceil(userText.length / 4),
            completion_tokens: Math.ceil(data.response.length / 4),
            total_tokens:
              Math.ceil(userText.length / 4) +
              Math.ceil(data.response.length / 4),
          },
        };

        return new Response(JSON.stringify(openaiResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            message: `QWEN API error: ${error}`,
            type: "api_error",
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  };

  // Create OpenAI-compatible provider with custom fetch
  const provider = createOpenAICompatible({
    name: "qwen",
    apiKey: "free", // QWEN doesn't require authentication
    baseURL: "https://sii3.top/api", // Dummy URL, we use custom fetch
    fetch: customFetch,
  });

  // Create model instances for all QWEN models
  for (const modelName of QWEN_MODELS) {
    models[modelName] = provider(modelName);
  }

  return models;
}

export const qwenProvider = {
  models: createQWENModels(),
  unsupportedToolModels: new Set<LanguageModel>([
    // QWEN models don't support tool calls
  ]),
};
