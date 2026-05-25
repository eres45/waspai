import { smoothStream, streamText } from "ai";

import { customModelProvider } from "lib/ai/models";
import { CREATE_THREAD_TITLE_PROMPT } from "lib/ai/prompts";
import globalLogger from "logger";
import { ChatModel } from "app-types/chat";
import { chatRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { handleError } from "../shared.chat";
import { createReverseModelMapping } from "lib/ai/model-display-names";

import { isLeakyReasoningModel } from "lib/ai/reasoning-detector";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Title API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const {
      chatModel,
      message = "hello",
      threadId,
    } = json as {
      chatModel?: ChatModel;
      message: string;
      threadId: string;
    };

    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    logger.info(
      `Generating title for thread: ${threadId} using Model: ${chatModel?.provider}/${chatModel?.model}`,
    );

    // Convert display names back to backend names
    const { models: modelReverseMapping, providers: providerReverseMapping } =
      createReverseModelMapping();
    let modelToUse = chatModel;
    if (modelToUse) {
      const backendProvider =
        providerReverseMapping[modelToUse.provider] || modelToUse.provider;
      const backendModel =
        modelReverseMapping[modelToUse.model] || modelToUse.model;
      modelToUse = {
        provider: backendProvider,
        model: backendModel,
      };
    }

    // Override reasoning models to avoid slow execution and leaked <think> blocks
    const isReasoningModel =
      modelToUse &&
      (isLeakyReasoningModel(modelToUse.model) ||
        /r1/i.test(modelToUse.model) ||
        /thinking/i.test(modelToUse.model) ||
        /reasoning/i.test(modelToUse.model) ||
        /grok-3/i.test(modelToUse.model) ||
        /\bo[1-3]/i.test(modelToUse.model));

    if (isReasoningModel) {
      logger.info(
        `Reasoning model detected for title generation. Overriding to google-gemma-2-9b-it.`,
      );
      modelToUse = {
        provider: "google",
        model: "google-gemma-2-9b-it",
      };
    }

    let model;
    try {
      model = customModelProvider.getModel(modelToUse);
    } catch (_e) {
      logger.warn("Title Model not found, falling back to gemma-2-9b-it");
      model = customModelProvider.getModel({
        provider: "google",
        model: "google-gemma-2-9b-it",
      });
    }

    const result = streamText({
      model: model,
      system: CREATE_THREAD_TITLE_PROMPT,
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: message,
      abortSignal: request.signal,
      maxTokens: 60,
      onFinish: (ctx) => {
        // Strip any <think>...</think> block or think tags that might have slipped through
        let cleanTitle = ctx.text;
        if (cleanTitle.includes("<think>")) {
          cleanTitle = cleanTitle.replace(/<think>[\s\S]*?<\/think>/gi, "");
          cleanTitle = cleanTitle.replace(/<think>[\s\S]*/gi, ""); // Handle unclosed tag
        }
        cleanTitle = cleanTitle.replace(/<\/think>/gi, "");
        cleanTitle = cleanTitle.trim();

        chatRepository
          .upsertThread({
            id: threadId,
            title: cleanTitle || "New Chat",
            userId: session.user.id,
          })
          .catch((err) => logger.error(err));
      },
    } as any);

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    logger.error("Title API Error:", err?.message || err);
    if (err?.statusCode === 403) {
      logger.warn("Forbidden error in Title API, likely DeepInfra blocked us.");
    }
    return new Response(handleError(err), { status: 500 });
  }
}
