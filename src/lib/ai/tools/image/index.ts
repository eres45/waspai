import { tool as createTool } from "ai";
import { serverFileStorage } from "lib/file-storage";
import z from "zod";
import { ImageToolName } from "..";
import logger from "logger";
import { generateImage } from "lib/ai/image/generate-image";
import { getSession } from "auth/server";
import { checkDailyUsageLimit, recordDailyUsage } from "lib/usage-limiter";

export type ImageToolResult = {
  images: {
    url: string;
    mimeType?: string;
  }[];
  mode?: "create" | "edit" | "composite";
  guide?: string;
  model: string;
};

// Universal image generation tool that uses the new models
export const nanoBananaTool = createTool({
  name: ImageToolName,
  description: `Generate images based on the user's request. This tool automatically extracts the image description from the user's message and generates an image using the pre-selected model. Do NOT ask the user to choose a model - use the model that was pre-selected. Always call this tool immediately when the user asks to generate an image.`,
  inputSchema: z.object({
    prompt: z
      .string()
      .optional()
      .describe(
        "The image generation prompt (optional, will use user's message if not provided)",
      ),
    model: z
      .string()
      .describe(
        "Image generation model to use. MUST match the pre-selected model from the system prompt. CRITICAL: Always use the exact model specified in the system prompt.",
      ),
  }),
  execute: async ({ prompt, model }, { abortSignal, messages }) => {
    logger.info(`Image tool called with model: ${model}`);

    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error(
        "Unauthorized: You must be logged in to generate images.",
      );
    }

    const userId = session.user.id;
    const userTier = (session.user as any).tier ?? "free";

    // Enforce daily limit of 10 for Free tier users
    if (userTier === "free") {
      const usageCheck = await checkDailyUsageLimit(userId, "image_gen", 10);
      if (!usageCheck.allowed) {
        logger.info(`Daily image generation limit reached for user ${userId}`);
        return {
          images: [],
          model,
          mode: "create",
          guide:
            "LIMIT_EXCEEDED: You have reached your daily limit of 10 image generations on the Free plan. To generate more images, please upgrade your subscription or wait until tomorrow.",
        };
      }
    }

    // Validate that a model was provided
    if (!model) {
      logger.error("No model provided to image generation tool");
      throw new Error("Model parameter is required for image generation");
    }

    // Extract prompt from user's last message if not provided
    let finalPrompt = prompt;
    if (!finalPrompt) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

      if (lastUserMessage && lastUserMessage.content) {
        if (typeof lastUserMessage.content === "string") {
          finalPrompt = lastUserMessage.content;
        } else if (Array.isArray(lastUserMessage.content)) {
          const textContent = lastUserMessage.content
            .filter((c) => c.type === "text")
            .map((c) => (c as any).text)
            .join(" ");
          finalPrompt = textContent;
        }
      }
    }

    if (!finalPrompt) {
      throw new Error("No prompt provided for image generation");
    }
    try {
      const generatedImages = await generateImage({
        prompt: finalPrompt,
        model,
        abortSignal,
      });

      // CRITICAL: Only keep the first image - limit to 1 image per generation
      const imagesToUpload = generatedImages.images.slice(0, 1);

      if (generatedImages.images.length > 1) {
        logger.info(
          `Generated ${generatedImages.images.length} images, keeping only 1 as per policy`,
        );
      }

      // Upload generated images to storage
      // Use the storage URL for the tool response to keep the context size small
      const resultImages = await Promise.all(
        imagesToUpload.map(async (image, index) => {
          // Generate a proper filename based on mime type
          const extension = image.mimeType === "image/png" ? "png" : "jpg";
          const filename = `generated-image-${Date.now()}-${index}.${extension}`;

          let fileUrl: string;
          try {
            // Upload to Telegram (blocking, need the URL)
            const uploadResult = await serverFileStorage.upload(
              Buffer.from(image.base64, "base64"),
              {
                filename,
                contentType: image.mimeType,
              },
            );
            fileUrl = uploadResult.sourceUrl;
            logger.info(`[Image Tool] Uploaded to: ${fileUrl}`);
          } catch (err: any) {
            logger.error(`[Image Tool] Upload failed:`, err);
            throw new Error(`Upload failed: ${err.message || String(err)}`);
          }

          return {
            url: fileUrl,
            mimeType: image.mimeType,
          };
        }),
      );

      // Filter out failed uploads
      const successfulImages = resultImages.filter((img) => img.url);

      if (successfulImages.length > 0) {
        await recordDailyUsage(userId, "image_gen");
      }

      return {
        images: successfulImages,
        model,
        mode: "create",
        guide:
          successfulImages.length > 0
            ? "SUCCESS: I have generated your image and shown it to the user in the tool result UI. DO NOT include the image URL or any markdown image links (![...](...)) in your text response. The user already sees the image. Just provide a brief, descriptive summary or caption."
            : "I apologize, but the image generation was not successful. Please try again.",
      };
    } catch (e: any) {
      logger.error(`[Image Tool] Fatal error:`, e);
      return {
        images: [],
        model,
        mode: "create",
        guide: `I apologize, but I encountered an error while generating the image with ${model}: ${e.message || String(e)}. Please try another model or rephrase your prompt.`,
      };
    }
  },
});

// Alias for compatibility
export const openaiImageTool = nanoBananaTool;

export * from "./analyze-image";
