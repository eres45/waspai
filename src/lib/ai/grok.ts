import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import logger from "logger";

/**
 * Grok-4 API Provider
 * API: https://sii3.top/api/grok4.php
 * 
 * Available Models:
 * - grok-4: Grok-4 model
 * 
 * Features:
 * - Free to use
 * - No authentication required
 * - Simple JSON API
 * - Fast responses
 */

interface GrokResponse {
  date?: string;
  response: string;
  dev?: string;
}

export function createGrokModels() {
  const models: Record<string, LanguageModel> = {};

  // Create a custom fetch function that transforms Grok API to OpenAI-compatible format
  const customFetch = async (
    input: URL | RequestInfo,
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

      logger.info(
        `Grok API called: model=${body.model}, streaming=${isStreaming}, text="${userText.substring(0, 50)}..."`
      );

      // Call Grok API (uses query parameter for text)
      const encodedText = encodeURIComponent(userText);
      const response = await fetch(
        `https://sii3.top/api/grok4.php?text=${encodedText}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data: GrokResponse = await response.json();

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
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
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
                encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`)
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
          id: "grok-" + Date.now(),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: body.model || "grok-4",
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
            message: `Grok API error: ${error}`,
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
    name: "grok",
    apiKey: "free", // Grok doesn't require authentication
    baseURL: "https://sii3.top/api", // Dummy URL, we use custom fetch
    fetch: customFetch,
  });

  // Create model instance
  models["grok-4"] = provider("grok-4");

  return models;
}

export const grokProvider = {
  models: createGrokModels(),
  unsupportedToolModels: new Set<LanguageModel>([
    // Grok models don't support tool calls
  ]),
};
