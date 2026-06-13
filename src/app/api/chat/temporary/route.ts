import { getSession } from "auth/server";
import {
  UIMessage,
  convertToModelMessages,
  smoothStream,
  streamText,
} from "ai";
import {
  customModelProvider,
  sanitizeMessageToolCalls,
  getModelTier,
} from "lib/ai/models";
import globalLogger from "logger";
import {
  buildUserSystemPrompt,
  buildWaspModelSystemPrompt,
} from "lib/ai/prompts";
import { getUserPreferences } from "lib/user/server";

import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Temporary Chat API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, chatModel, instructions } = json as {
      messages: UIMessage[];
      chatModel?: {
        provider: string;
        model: string;
      };
      instructions?: string;
    };
    logger.info(`model: ${chatModel?.provider}/${chatModel?.model}`);
    const userTier = (session.user as any).tier ?? "free";
    const modelTier = getModelTier(chatModel?.model || "");
    const isRestricted =
      (modelTier === "Pro" && userTier === "free") ||
      (modelTier === "Ultra" && (userTier === "free" || userTier === "pro"));

    if (isRestricted) {
      return new Response(
        JSON.stringify({
          error: "Upgrade Required",
          message: `You are on the ${userTier.toUpperCase()} tier. Please upgrade your plan to use ${modelTier} models.`,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    const model = customModelProvider.getModel(chatModel);
    const userPreferences =
      (await getUserPreferences(session.user.id)) || undefined;

    const systemPromptParts = [
      buildUserSystemPrompt(
        session.user,
        userPreferences,
        undefined,
        undefined,
        chatModel?.model,
      ),
      chatModel?.model === "waspai-model" && buildWaspModelSystemPrompt,
      instructions ? instructions : undefined,
    ].filter(Boolean);

    return streamText({
      model,
      system: systemPromptParts.join("\n\n").trim(),
      messages: convertToModelMessages(sanitizeMessageToolCalls(messages)),
      experimental_transform: smoothStream({ chunking: "word" }),
      experimental_continueOnLimit: true,
      maxTokens: 8192,
    } as any).toUIMessageStreamResponse();
  } catch (error: any) {
    logger.error(error);
    return new Response(error.message || "Oops, an error occured!", {
      status: 500,
    });
  }
}
