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
      onFinish: (ctx) => {
        chatRepository
          .upsertThread({
            id: threadId,
            title: ctx.text,
            userId: session.user.id,
          })
          .catch((err) => logger.error(err));
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    return new Response(handleError(err), { status: 500 });
  }
}
