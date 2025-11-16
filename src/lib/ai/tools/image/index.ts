import {
  FilePart,
  ImagePart,
  ModelMessage,
  ToolResultPart,
  tool as createTool,
} from "ai";
import { serverFileStorage } from "lib/file-storage";
import { safe, watchError } from "ts-safe";
import z from "zod";
import { ImageToolName } from "..";
import logger from "logger";
import { toAny } from "lib/utils";
import {
  generateImageWithImgCV,
  generateImageWithFluxMax,
  generateImageWithGPTImager,
  generateImageWithImagen3,
  generateImageWithNanoBananaAPI,
  generateImageWithStableDiffusionXL,
  generateImageWithChalkAPI,
  generateImageWithMemeAPI,
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
    prompt: z.string().optional().describe("The image generation prompt (optional, will use user's message if not provided)"),
    model: z
      .enum(["img-cv", "flux-max", "gpt-imager", "imagen-3", "nano-banana", "sdxl", "chalk", "meme"])
      .describe(
        "Image generation model to use. MUST match the pre-selected model from the system prompt. Options: 'img-cv' (fastest, ultra-realistic), 'flux-max' (fast, high quality), 'gpt-imager' (good quality), 'imagen-3' (Google model), 'nano-banana' (detailed), 'sdxl' (Stable Diffusion XL, high quality), 'chalk' (chalk name style text), 'meme' (meme generator). CRITICAL: Always use the exact model specified in the system prompt - do not substitute or choose a different model."
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
      const lastUserMessage = messages
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
      let generatedImages;

      // Select the appropriate image generation function based on model
      switch (model) {
        case "img-cv":
          generatedImages = await generateImageWithImgCV({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "flux-max":
          generatedImages = await generateImageWithFluxMax({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "gpt-imager":
          generatedImages = await generateImageWithGPTImager({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "imagen-3":
          generatedImages = await generateImageWithImagen3({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "nano-banana":
          generatedImages = await generateImageWithNanoBananaAPI({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "sdxl":
          generatedImages = await generateImageWithStableDiffusionXL({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "chalk":
          generatedImages = await generateImageWithChalkAPI({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        case "meme":
          generatedImages = await generateImageWithMemeAPI({
            prompt: finalPrompt,
            abortSignal,
          });
          break;
        default:
          throw new Error(`Unknown model: ${model}`);
      }

      // CRITICAL: Only keep the first image - limit to 1 image per generation
      const imagesToUpload = generatedImages.images.slice(0, 1);
      
      if (generatedImages.images.length > 1) {
        logger.info(`Generated ${generatedImages.images.length} images, keeping only 1 as per policy`);
      }

      // Upload generated images to storage
      const resultImages = await safe(imagesToUpload)
        .map((images) => {
          return Promise.all(
            images.map(async (image) => {
              const uploadedImage = await serverFileStorage.upload(
                Buffer.from(image.base64, "base64"),
                {
                  contentType: image.mimeType,
                },
              );
              return {
                url: uploadedImage.sourceUrl,
                mimeType: image.mimeType,
              };
            }),
          );
        })
        .watch(
          watchError((e) => {
            logger.error(e);
            logger.info(`upload image failed. using base64`);
          }),
        )
        .ifFail(() => {
          throw new Error(
            "Image generation was successful, but file upload failed. Please check your file upload configuration and try again.",
          );
        })
        .unwrap();

      return {
        images: resultImages,
        model,
        mode: "create",
        guide:
          resultImages.length > 0
            ? "The image has been successfully generated and is now displayed above. If you need any edits, modifications, or adjustments to the image, please let me know."
            : "I apologize, but the image generation was not successful. Please try again with a more specific description.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// Alias for compatibility
export const openaiImageTool = nanoBananaTool;

function convertToImageToolPartToImagePart(part: ToolResultPart): ImagePart[] {
  if (part.toolName !== ImageToolName) return [];
  if (!toAny(part).output?.value?.images?.length) return [];
  const result = part.output.value as ImageToolResult;
  return result.images.map((image) => ({
    type: "image",
    image: image.url,
    mediaType: image.mimeType,
  }));
}

function convertToImageToolPartToFilePart(part: ToolResultPart): FilePart[] {
  if (part.toolName !== ImageToolName) return [];
  if (!toAny(part).output?.value?.images?.length) return [];
  const result = part.output.value as ImageToolResult;
  return result.images.map((image) => ({
    type: "file",
    mediaType: image.mimeType!,
    data: image.url,
  }));
}
