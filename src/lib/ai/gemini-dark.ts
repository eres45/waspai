import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import logger from "logger";

/**
 * Gemini Dark API Provider
 * APIs:
 * - https://sii3.top/api/gemini-dark.php (for gemini-pro, gemini-deep)
 * - https://sii3.top/DARK/gemini.php (for gemini-2.5-flash)
 * 
 * Available Models: 3 top Gemini models:
 * - gemini-2.5-pro (most powerful)
 * - gemini-2.5-deep-search (advanced reasoning)
 * - gemini-2.5-flash (fast and efficient)
 * 
 * Features:
 * - Free to use
 * - No authentication required
 * - Simple JSON API
 * - Latest Gemini 2.5 models
 * - Fast responses
 */

interface GeminiResponse {
  response: string;
}

// List of Gemini models
const GEMINI_MODELS = [
  "gemini-2.5-pro", // Most powerful
  "gemini-2.5-deep-search", // Advanced reasoning
  "gemini-2.5-flash", // Fast and efficient
];

export function createGeminiDarkModels() {
  const models: Record<string, LanguageModel> = {};

  // Create a custom fetch function that transforms Gemini API to OpenAI-compatible format
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

      // Get the model name from the request
      const modelName = body.model || "gemini-2.5-pro";

      // Check if streaming is requested
      const isStreaming = body.stream === true;

      logger.info(
        `Gemini API called: model=${modelName}, streaming=${isStreaming}, text="${userText.substring(0, 50)}..."`
      );

      let response: Response;

      // Route to appropriate API based on model
      if (modelName === "gemini-2.5-flash") {
        // Use DARK/gemini.php for flash model
        response = await fetch("https://sii3.top/DARK/gemini.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: userText,
          }),
        });
      } else if (modelName === "gemini-2.5-deep-search") {
        // Use gemini-dark.php with gemini-deep parameter
        response = await fetch("https://sii3.top/api/gemini-dark.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "gemini-deep": userText,
          }),
        });
      } else {
        // Use gemini-dark.php with gemini-pro parameter (default for gemini-2.5-pro)
        response = await fetch("https://sii3.top/api/gemini-dark.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "gemini-pro": userText,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

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
          id: "gemini-" + Date.now(),
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
            message: `Gemini API error: ${error}`,
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
    name: "gemini-dark",
    apiKey: "free", // Gemini doesn't require authentication
    baseURL: "https://sii3.top/api", // Dummy URL, we use custom fetch
    fetch: customFetch,
  });

  // Create model instances for Gemini models
  for (const modelName of GEMINI_MODELS) {
    models[modelName] = provider(modelName);
  }

  return models;
}

export const geminiDarkProvider = {
  models: createGeminiDarkModels(),
  unsupportedToolModels: new Set<LanguageModel>([
    // Gemini models don't support tool calls
  ]),
};
