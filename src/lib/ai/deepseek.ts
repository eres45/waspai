import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import logger from "logger";

/**
 * DeepSeek API Provider
 * API: https://sii3.top/api/deepseek.php
 *
 * Available Models: 2 top DeepSeek models:
 * - deepseek-v3.3 (most powerful, best for general tasks)
 * - deepseek-r1 (advanced reasoning, best for complex problems)
 *
 * Features:
 * - Free to use
 * - No authentication required
 * - Simple JSON API
 * - Ultra-intelligent models
 * - Advanced reasoning capabilities
 */

interface DeepSeekResponse {
  response: string;
}

// List of top DeepSeek models
const DEEPSEEK_MODELS = [
  "deepseek-v3.3", // Most powerful model
  "deepseek-r1", // Advanced reasoning model
];

export function createDeepSeekModels() {
  const models: Record<string, LanguageModel> = {};

  // Create a custom fetch function that transforms DeepSeek API to OpenAI-compatible format
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
      const modelName = body.model || "deepseek-v3.3";

      // Check if streaming is requested
      const isStreaming = body.stream === true;

      logger.info(
        `DeepSeek API called: model=${modelName}, streaming=${isStreaming}, text="${userText.substring(0, 50)}..."`,
      );

      // Call DeepSeek API using POST with model parameter
      const response = await fetch("https://sii3.top/api/deepseek.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          [modelName === "deepseek-r1" ? "r1" : "v3"]: userText,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data: DeepSeekResponse = await response.json();

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
          id: "deepseek-" + Date.now(),
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
            message: `DeepSeek API error: ${error}`,
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
    name: "deepseek",
    apiKey: "free", // DeepSeek doesn't require authentication
    baseURL: "https://sii3.top/api", // Dummy URL, we use custom fetch
    fetch: customFetch,
  });

  // Create model instances for DeepSeek models
  for (const modelName of DEEPSEEK_MODELS) {
    models[modelName] = provider(modelName);
  }

  return models;
}

export const deepseekProvider = {
  models: createDeepSeekModels(),
  unsupportedToolModels: new Set<LanguageModel>([
    // DeepSeek models don't support tool calls
  ]),
};
