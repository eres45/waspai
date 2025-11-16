import { tool as createTool } from "ai";
import z from "zod";
import { ImageToolName } from "..";
import {
  generateImageWithImgCV,
  generateImageWithFluxMax,
  generateImageWithGPTImager,
  generateImageWithImagen3,
  generateImageWithNanoBananaAPI,
} from "lib/ai/image/generate-image";
import { serverFileStorage } from "lib/file-storage";
import { safe, watchError } from "ts-safe";
import logger from "logger";

export type ImageToolResult = {
  images: {
    url: string;
    mimeType?: string;
  }[];
  mode?: "create" | "edit" | "composite";
  guide?: string;
  model: string;
};

// Base tool configuration
const baseToolConfig = {
  name: ImageToolName,
  description: `Generate images based on the user's request. Select from multiple high-quality image generation models.`,
  inputSchema: z.object({
    prompt: z.string().describe("The image generation prompt"),
    model: z
      .enum(["img-cv", "flux-max", "gpt-imager", "imagen-3", "nano-banana"])
      .default("img-cv")
      .describe(
        "Image generation model: 'img-cv' (fastest, ultra-realistic), 'flux-max' (fast, high quality), 'gpt-imager' (good quality), 'imagen-3' (Google model), 'nano-banana' (detailed)"
      ),
  }),
};

// Create tool factory
export function createImageGenerationTool(modelName: string) {
  return createTool({
    ...baseToolConfig,
    execute: async ({ prompt, model }, { abortSignal }) => {
      try {
        let generatedImages;

        // Select the appropriate image generation function
        switch (model) {
          case "img-cv":
            generatedImages = await generateImageWithImgCV({
              prompt,
              abortSignal,
            });
            break;
          case "flux-max":
            generatedImages = await generateImageWithFluxMax({
              prompt,
              abortSignal,
            });
            break;
          case "gpt-imager":
            generatedImages = await generateImageWithGPTImager({
              prompt,
              abortSignal,
            });
            break;
          case "imagen-3":
            generatedImages = await generateImageWithImagen3({
              prompt,
              abortSignal,
            });
            break;
          case "nano-banana":
            generatedImages = await generateImageWithNanoBananaAPI({
              prompt,
              abortSignal,
            });
            break;
          default:
            throw new Error(`Unknown model: ${model}`);
        }

        // Upload generated images to storage
        const resultImages = await safe(generatedImages.images)
          .map((images) => {
            return Promise.all(
              images.map(async (image) => {
                const uploadedImage = await serverFileStorage.upload(
                  Buffer.from(image.base64, "base64"),
                  {
                    contentType: image.mimeType,
                  }
                );
                return {
                  url: uploadedImage.sourceUrl,
                  mimeType: image.mimeType,
                };
              })
            );
          })
          .watch(
            watchError((e) => {
              logger.error(e);
              logger.info(`upload image failed. using base64`);
            })
          )
          .ifFail(() => {
            throw new Error(
              "Image generation was successful, but file upload failed. Please check your file upload configuration and try again."
            );
          })
          .unwrap();

        return {
          images: resultImages,
          model,
          mode: "create",
        } as ImageToolResult;
      } catch (error) {
        logger.error(`Image generation failed with model ${model}:`, error);
        throw error;
      }
    },
  });
}

// Export individual tools for each model
export const imgCVTool = createImageGenerationTool("img-cv");
export const fluxMaxTool = createImageGenerationTool("flux-max");
export const gptImagerTool = createImageGenerationTool("gpt-imager");
export const imagen3Tool = createImageGenerationTool("imagen-3");
export const nanoBananaTool = createImageGenerationTool("nano-banana");

// Export all tools as a map
export const imageGenerationTools = {
  "img-cv": imgCVTool,
  "flux-max": fluxMaxTool,
  "gpt-imager": gptImagerTool,
  "imagen-3": imagen3Tool,
  "nano-banana": nanoBananaTool,
};

// Model metadata for UI
export const imageModelMetadata = {
  "img-cv": {
    name: "IMG-CV",
    description: "Ultra-realistic, fastest (1.4s)",
    icon: "⚡",
  },
  "flux-max": {
    name: "Flux-Max",
    description: "Fast, high quality (5.9s)",
    icon: "🚀",
  },
  "gpt-imager": {
    name: "GPT-Imager",
    description: "Good quality (8.9s)",
    icon: "🎨",
  },
  "imagen-3": {
    name: "Imagen-3",
    description: "Google model (11.5s)",
    icon: "🌟",
  },
  "nano-banana": {
    name: "Nano-Banana",
    description: "Detailed output (20.6s)",
    icon: "🍌",
  },
};
