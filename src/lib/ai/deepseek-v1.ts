import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import logger from "logger";

/**
 * DeepSeek v1 Provider (chat-deep.ai)
 * API: https://chat-deep.ai/wp-admin/admin-ajax.php
 * 
 * Model: deepseek-chat
 * - Free to use
 * - No authentication required
 * - Powered by DeepSeek Chat
 */

interface DeepSeekResponse {
  success: boolean;
  data?: {
    response: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export function createDeepSeekV1Models() {
  const models: Record<string, LanguageModel> = {};

  // Create a custom fetch function that transforms DeepSeek API to OpenAI-compatible format
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
        `DeepSeek v1 API called: streaming=${isStreaming}, text="${userText.substring(0, 50)}..."`
      );

      // Step 1: Get nonce from chat-deep.ai
      let nonce: string | null = null;
      try {
        const nonceResponse = await fetch("https://chat-deep.ai/", {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (nonceResponse.ok) {
          const html = await nonceResponse.text();
          // Try multiple patterns to find nonce
          const patterns = [
            /"nonce":"([a-f0-9]+)"/,
            /nonce["\']?\s*:\s*["\']([a-f0-9]+)["\']?/,
          ];

          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
              nonce = match[1];
              break;
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to get nonce: ${error}`);
      }

      if (!nonce) {
        throw new Error("Failed to get nonce from chat-deep.ai");
      }

      // Step 2: Send message to DeepSeek API
      const apiUrl = "https://chat-deep.ai/wp-admin/admin-ajax.php";
      const params = new URLSearchParams({
        action: "deepseek_chat",
        message: userText,
        model: "deepseek-chat",
        nonce: nonce,
        save_conversation: "0",
        session_only: "1",
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Origin": "https://chat-deep.ai",
          "Referer": "https://chat-deep.ai/",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data: DeepSeekResponse = await response.json();

      if (!data.success || !data.data?.response) {
        throw new Error("Invalid response from DeepSeek API");
      }

      const responseText = data.data.response;

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
          id: "deepseek-v1-" + Date.now(),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: "deepseek-chat",
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
      logger.error(`DeepSeek v1 API error: ${error}`);
      return new Response(
        JSON.stringify({
          error: {
            message: `DeepSeek v1 API error: ${error}`,
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
    name: "deepseek-v1",
    apiKey: "free", // DeepSeek v1 doesn't require authentication
    baseURL: "https://chat-deep.ai", // Dummy URL, we use custom fetch
    fetch: customFetch,
  });

  // Create model instance for DeepSeek Chat
  models["deepseek-chat"] = provider("deepseek-chat");

  return models;
}

export const deepseekV1Provider = {
  models: createDeepSeekV1Models(),
  unsupportedToolModels: new Set<LanguageModel>([
    // DeepSeek v1 models don't support tool calls
  ]),
};
