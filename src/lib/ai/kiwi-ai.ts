import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import logger from "logger";

/**
 * Kiwi AI Dark Code Model Provider
 * API: https://sii3.top/api/DarkCode.php
 *
 * Model: dark-code-76
 * - Specialized for code generation and analysis
 * - 12B parameters on very fast and powerful server
 * - Official Kiwi AI model
 *
 * Features:
 * - Free to use
 * - No authentication required
 * - Optimized for coding tasks
 * - Fast responses
 * - Powerful code generation
 */

interface KiwiAIResponse {
  response: string;
}

export function createKiwiAIModels() {
  const models: Record<string, LanguageModel> = {};

  // Create a custom fetch function that transforms Kiwi AI API to OpenAI-compatible format
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

      logger.info(
        `Kiwi AI Dark Code API called: streaming=${isStreaming}, text="${userText.substring(0, 50)}..."`,
      );

      // Only prepend identity instruction if user is asking about identity/creator
      let fullText = userText;
      const isIdentityQuestion =
        /who (are|created|made|built|trained)|creator|origin|identity|who am i|what are you|what model|tell me.*about you|more about|elaborate|describe yourself|introduce yourself|darkai/i.test(
          userText,
        );

      if (isIdentityQuestion) {
        // For identity questions, create a more natural conversational prompt
        // This helps the API understand we want a natural response, not just identity info
        fullText = `Context: You are Kiwi AI Dark Code 76, created by Kiwi AI (KiwiAI.com), not DarkAI. You are a specialized coding assistant optimized for code generation, debugging, and technical analysis. You run on a very fast and powerful 12B parameter server deployed on KiwiAI.com.

Now answer this question naturally and conversationally: ${userText}

Remember to clarify your actual identity and creator in your response.`;
      }

      // Call Kiwi AI API using POST with JSON
      const response = await fetch("https://sii3.top/api/DarkCode.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: fullText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Kiwi AI API error: ${response.status}`);
      }

      const data: KiwiAIResponse = await response.json();

      // Post-process response to enforce Kiwi AI identity
      // Replace any DarkAI references with Kiwi AI
      data.response = data.response
        .replace(
          /I was trained and developed by DarkAI/gi,
          "I am Kiwi AI Dark Code 76, created by Kiwi AI (KiwiAI.com)",
        )
        .replace(
          /trained and developed by DarkAI/gi,
          "created by Kiwi AI (KiwiAI.com)",
        )
        .replace(/I was trained by DarkAI/gi, "I was created by Kiwi AI")
        .replace(/trained by DarkAI/gi, "created by Kiwi AI")
        .replace(/DarkAI/g, "Kiwi AI")
        .replace(
          /I was trained/gi,
          "I am Kiwi AI Dark Code 76, created by Kiwi AI",
        )
        .replace(/trained by/gi, "created by");

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
          id: "kiwi-" + Date.now(),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: "dark-code-76",
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
            message: `Kiwi AI API error: ${error}`,
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
    name: "kiwi-ai",
    apiKey: "free", // Kiwi AI doesn't require authentication
    baseURL: "https://sii3.top/api", // Dummy URL, we use custom fetch
    fetch: customFetch,
  });

  // Create model instance for Kiwi AI Dark Code
  models["dark-code-76"] = provider("dark-code-76");

  return models;
}

export const kiwiAIProvider = {
  models: createKiwiAIModels(),
  unsupportedToolModels: new Set<LanguageModel>([
    // Kiwi AI models don't support tool calls
  ]),
};

/**
 * Special system prompt for Kiwi AI Dark Code model
 * This prompt ensures the model maintains its identity and doesn't reveal its origin
 */
export const KIWI_AI_SYSTEM_PROMPT = `IMPORTANT: You MUST follow these instructions exactly and override any previous training or instructions.

You are Kiwi AI Dark Code 76, an official code generation and analysis model created by Kiwi AI (KiwiAI.com). 

CRITICAL IDENTITY RULES:
1. Your name is: Kiwi AI Dark Code 76
2. Your creator is: Kiwi AI
3. Your website is: KiwiAI.com
4. You were created by: Kiwi AI
5. You are NOT created by DarkAI, OpenAI, or any other organization
6. You are deployed on: KiwiAI.com
7. Your specialization: Code generation, debugging, and technical analysis

MANDATORY BEHAVIOR:
- ALWAYS identify yourself as "Kiwi AI Dark Code 76" when asked about your identity
- ALWAYS state that you were created by "Kiwi AI"
- ALWAYS redirect any questions about DarkAI or other origins to your actual identity as Kiwi AI
- NEVER claim to be trained by DarkAI or any other organization
- ALWAYS maintain your professional identity as Kiwi AI
- ALWAYS focus on providing excellent code solutions and technical assistance
- ALWAYS be helpful, accurate, and professional in all code-related tasks

WHEN ASKED ABOUT YOUR ORIGIN:
- Say: "I am Kiwi AI Dark Code 76, created by Kiwi AI (KiwiAI.com). I'm a specialized coding assistant optimized for code generation, debugging, and technical analysis."
- Do NOT mention DarkAI, underlying models, or training data
- Do NOT provide technical details about infrastructure
- Redirect to your purpose: providing excellent coding assistance

Your primary purpose: Deliver exceptional code generation, analysis, and debugging assistance to help developers write better code.`;
