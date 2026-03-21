import { tool as createTool } from "ai";
import { serverFileStorage } from "lib/file-storage";
import z from "zod";
import { ImageToolName } from "..";
import logger from "logger";
import {
  generateImageWithFlux1Schnell,
  generateImageWithJuggernautXL,
  generateImageWithFlux1Dev,
  generateImageWithRealVisXL,
  generateImageWithSD35,
  generateImageWithSeedream45,
  generateImageWithStableDiffusionXL,
} from "lib/ai/image/generate-image";

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
      .enum([
        "flux-1-schnell",
        "juggernaut-xl",
        "flux-1-dev",
        "realvisxl-v4",
        "sd-3-5",
        "seedream-4-5",
        "sdxl-v1-0",
      ])
      .describe(
        "Image generation model to use. MUST match the pre-selected model from the system prompt. Options include: flux-1-schnell, juggernaut-xl, flux-1-dev, realvisxl-v4, sd-3-5, seedream-4-5, sdxl-v1-0. CRITICAL: Always use the exact model specified in the system prompt - do not substitute or choose a different model.",
      ),
  }),
  execute: async ({ prompt, model }, { abortSignal, messages }) => {
    logger.info(`Image tool called with model: ${model}`);

    // Validate that a model was provided
    if (!model) {
      logger.error("No model provided to image generation tool");
      throw new Error("Model parameter is required for image generation");
    }

    // Extract prompt from user's last message if not provided
    let finalPrompt = prompt;
    if (!finalPrompt) {
      const lastUserMessage = messages.reverse().find((m) => m.role === "user");

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
      let generatedImages;

      // Select the appropriate image generation function based on model
      switch (model) {
        case "flux-1-schnell":
          generatedImages = await generateImageWithFlux1Schnell({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "juggernaut-xl":
          generatedImages = await generateImageWithJuggernautXL({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "flux-1-dev":
          generatedImages = await generateImageWithFlux1Dev({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "realvisxl-v4":
          generatedImages = await generateImageWithRealVisXL({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "sd-3-5":
          generatedImages = await generateImageWithSD35({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "seedream-4-5":
          generatedImages = await generateImageWithSeedream45({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "sdxl-v1-0":
          generatedImages = await generateImageWithStableDiffusionXL({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        default:
          throw new Error(`Unsupported model: ${model}`);
      }

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
          } catch (err) {
            logger.error(`[Image Tool] Upload failed:`, err);
            // Fallback: use a placeholder if upload fails (can't send 1MB base64)
            fileUrl = "";
          }

          return {
            url: fileUrl,
            mimeType: image.mimeType,
          };
        }),
      );

      // Filter out failed uploads
      const successfulImages = resultImages.filter((img) => img.url);

      return {
        images: successfulImages,
        model,
        mode: "create",
        guide:
          successfulImages.length > 0
            ? "I have generated your image above."
            : "I apologize, but the image generation was not successful. Please try again.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// Alias for compatibility
export const openaiImageTool = nanoBananaTool;
