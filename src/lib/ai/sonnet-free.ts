import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import logger from "logger";

/**
 * Sonnet Free Provider (sonnet3-5.free.nf)
 * Specialized endpoints for different tasks
 *
 * Models:
 * - reasoning: For reasoning, math, and analytical questions
 * - chat: For general conversation (DeepSeek-like)
 * - coder: For programming problems and code solutions
 * - math: For mathematical equations and calculations
 *
 * Features:
 * - Free to use
 * - No authentication required
 * - Supports Arabic and English
 * - Specialized endpoints for different tasks
 */

interface SonnetResponse {
  response?: string;
  result?: string;
  text?: string;
  [key: string]: any;
}

const SONNET_ENDPOINTS = {
  reasoning: "https://sonnet3-5.free.nf/api/reasoning.php",
  chat: "https://sonnet3-5.free.nf/api/at.php",
  coder: "https://sonnet3-5.free.nf/api/coder.php",
  math: "https://sonnet3-5.free.nf/api/math.php",
};

export function createSonnetFreeModels() {
  const models: Record<string, LanguageModel> = {};

  // Create a custom fetch function that transforms Sonnet API to OpenAI-compatible format
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

      // Check if streaming is requested
      const isStreaming = body.stream === true;

      // Determine which endpoint to use based on model name
      let endpoint = SONNET_ENDPOINTS.chat;
      const modelName = body.model || "sonnet-chat";

      if (modelName.includes("reasoning")) {
        endpoint = SONNET_ENDPOINTS.reasoning;
      } else if (modelName.includes("coder")) {
        endpoint = SONNET_ENDPOINTS.coder;
      } else if (modelName.includes("math")) {
        endpoint = SONNET_ENDPOINTS.math;
      }

      logger.info(
        `Sonnet Free API called: model=${modelName}, streaming=${isStreaming}, text="${userText.substring(0, 50)}..."`,
      );

      // Call Sonnet API using GET with query parameter
      const url = new URL(endpoint);
      url.searchParams.append("text", userText);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Sonnet API error: ${response.status}`);
      }

      const data: SonnetResponse = await response.json();
      const responseText =
        data.response || data.result || data.text || JSON.stringify(data);

      if (isStreaming) {
        // Simulate streaming by creating a ReadableStream
        const encoder = new TextEncoder();

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
          id: "sonnet-" + Date.now(),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: responseText,
              },
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

        return new Response(JSON.stringify(openaiResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      logger.error(`Sonnet Free API error: ${error}`);
      return new Response(
        JSON.stringify({
          error: {
            message: `Sonnet Free API error: ${error}`,
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
    name: "sonnet-free",
    apiKey: "free", // Sonnet Free doesn't require authentication
    baseURL: "https://sonnet3-5.free.nf", // Dummy URL, we use custom fetch
    fetch: customFetch,
  });

  // Create model instances for different Sonnet endpoints
  models["sonnet-reasoning"] = provider("sonnet-reasoning");
  models["sonnet-chat"] = provider("sonnet-chat");
  models["sonnet-coder"] = provider("sonnet-coder");
  models["sonnet-math"] = provider("sonnet-math");

  return models;
}

export const sonnetFreeProvider = {
  models: createSonnetFreeModels(),
  unsupportedToolModels: new Set<LanguageModel>([
    // Sonnet Free models don't support tool calls
  ]),
};
