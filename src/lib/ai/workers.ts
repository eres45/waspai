import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";

/**
 * Workers Models Integration
 * Handles various free worker endpoints (GET-based, OpenAI-compatible Proxy, etc.)
 */
export function createWorkersModels() {
  // 1. Claude Proxy (Standard OpenAI Compatible)
  const claudeProxyProvider = (modelId: string) =>
    createOpenAICompatible({
      name: "claude-proxy",
      apiKey: "sk_qwhdoq8d3qreop3hropezy",
      baseURL: "https://real-slim-shady.riderdeath700.workers.dev/v1",
    })(modelId);

  // 2. GLM Provider (Custom GET-based SSE adapter)
  const glmProvider = (baseUrl: string) => (modelId: string) =>
    createOpenAICompatible({
      name: "glm-worker",
      apiKey: "none",
      baseURL: baseUrl,
      fetch: async (url, options) => {
        try {
          const body = JSON.parse(options?.body as string);
          const prompt = body.messages[body.messages.length - 1].content;
          const workerUrl = `${baseUrl}/prompt=${encodeURIComponent(prompt)}`;

          const response = await fetch(workerUrl);
          if (!response.ok) return response;

          // Transform GLM SSE to OpenAI SSE
          let buffer = "";
          const transformer = new TransformStream({
            transform(chunk, controller) {
              buffer += new TextDecoder().decode(chunk, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep partial line in buffer
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("data: ")) {
                  try {
                    const json = JSON.parse(trimmedLine.slice(6));
                    if (
                      json.type === "chat:completion" &&
                      json.data?.delta_content
                    ) {
                      const openaiChunk = {
                        choices: [
                          {
                            delta: { content: json.data.delta_content },
                            index: 0,
                            finish_reason: null,
                          },
                        ],
                      };
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify(openaiChunk)}\n\n`,
                        ),
                      );
                    }
                  } catch (_e) {}
                }
              }
            },
            flush(controller) {
              // Handle last bits if any
              if (buffer.trim().startsWith("data: ")) {
                try {
                  const json = JSON.parse(buffer.trim().slice(6));
                  if (
                    json.type === "chat:completion" &&
                    json.data?.delta_content
                  ) {
                    const openaiChunk = {
                      choices: [
                        {
                          delta: { content: json.data.delta_content },
                          index: 0,
                          finish_reason: null,
                        },
                      ],
                    };
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify(openaiChunk)}\n\n`,
                      ),
                    );
                  }
                } catch (_e) {}
              }
            },
          });

          return new Response(response.body?.pipeThrough(transformer), {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (_e) {
          return fetch(url, options);
        }
      },
    })(modelId);

  // 3. WormGPT Provider
  const wormGPTProvider = (modelId: string) =>
    createOpenAICompatible({
      name: "wormgpt",
      apiKey: "none",
      baseURL: "https://wormgpt.hello-kaiiddo.workers.dev",
      fetch: async (url, options) => {
        try {
          const body = JSON.parse(options?.body as string);
          const prompt = body.messages[body.messages.length - 1].content;
          const workerUrl = `https://wormgpt.hello-kaiiddo.workers.dev/ask?ask=${encodeURIComponent(prompt)}&model=1`;

          const response = await fetch(workerUrl);
          if (!response.ok) return response;

          const text = await response.text();
          let reply = text;
          try {
            const json = JSON.parse(text);
            reply = json.reply || json.response || text;
          } catch (_e) {}

          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: { role: "assistant", content: reply },
                  finish_reason: "stop",
                },
              ],
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (_e) {
          return fetch(url, options);
        }
      },
    })(modelId);

  // 4. FeatherLabs Provider (OpenAI-compatible)
  const featherLabsProvider = (modelId: string) =>
    createOpenAICompatible({
      name: "featherlabs",
      apiKey: "sk-mWdmd2RtRTNm2ndAtceylQ",
      baseURL: "https://api.featherlabs.online/v1",
    })(modelId);

  const models: Record<string, LanguageModel> = {
    "claude-sonnet-4.5-proxy": claudeProxyProvider(
      "anthropic/claude-sonnet-4.5",
    ),
    "glm-4.7": glmProvider("https://glm-4-7.chutperplexity.workers.dev")(
      "glm-4.7",
    ),
    "glm-4.5-air": glmProvider(
      "https://glm-4-5-air.chutperplexity.workers.dev",
    )("glm-4.5-air"),
    wormgpt: wormGPTProvider("wormgpt"),
    // FeatherLabs models
    "glm-5": featherLabsProvider("GLM-5"),
    "kimi-k2-instruct": featherLabsProvider("kimi-k2-instruct"),
  };

  return models;
}
