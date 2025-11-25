import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { serverFileStorage } from "lib/file-storage";
import { safe, watchError } from "ts-safe";
import {
  editImageWithNanoBanana,
  removeImageBackground,
  convertImageToAnime,
} from "lib/ai/image/edit-image";
import { enhanceImageTool } from "./enhance-image";

export type EditImageToolResult = {
  image: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
};

/**
 * Image editing tool using Nano-Banana Edit API
 */
export const editImageTool = createTool({
  name: "edit-image",
  description:
    "Edit an existing image based on a text prompt. Provide the image URL and a description of how you want to edit it (e.g., 'make it more colorful', 'add more contrast', 'make it brighter').",
  inputSchema: z.object({
    imageUrl: z.string().url().describe("The URL of the image to edit"),
    prompt: z
      .string()
      .describe(
        "Description of how to edit the image (e.g., 'make it more colorful', 'add more contrast', 'make it brighter')",
      ),
  }),
  execute: async ({ imageUrl, prompt }, { abortSignal }) => {
    logger.info(`Edit Image tool called with prompt: "${prompt}"`);
    logger.info(`Edit Image tool called with imageUrl: "${imageUrl}"`);

    try {
      // Call the edit image API
      const editedImage = await editImageWithNanoBanana({
        prompt,
        imageUrl,
        abortSignal,
      });

      logger.info(`Edit Image: Image edited successfully`);

      // Upload edited image to storage
      const uploadedImage = await safe(editedImage.image)
        .map(async (image) => {
          const uploadedResult = await serverFileStorage.upload(
            Buffer.from(image.url, "base64"),
            {
              contentType: image.mimeType || "image/png",
            },
          );
          return {
            url: uploadedResult.sourceUrl,
            mimeType: image.mimeType || "image/png",
          };
        })
        .watch(
          watchError((e) => {
            logger.error(e);
            logger.info(`upload edited image failed. using base64`);
          }),
        )
        .ifFail(() => {
          throw new Error(
            "Image editing was successful, but file upload failed. Please check your file upload configuration and try again.",
          );
        })
        .unwrap();

      return {
        image: uploadedImage,
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

/**
 * Remove background tool using Remove BG API
 */
export const removeBackgroundTool = createTool({
  name: "remove-background",
  description:
    "Remove the background from an image, leaving only the subject. The image will have a transparent background.",
  inputSchema: z.object({
    imageUrl: z
      .string()
      .url()
      .describe("The URL of the image to remove background from"),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Remove Background tool called with imageUrl: "${imageUrl}"`);

    try {
      // Call the remove background API
      const processedImage = await removeImageBackground({
        prompt: "remove background",
        imageUrl,
        abortSignal,
      });

      logger.info(`Remove Background: Background removed successfully`);

      // Upload processed image to storage
      const uploadedImage = await safe(processedImage.image)
        .map(async (image) => {
          const uploadedResult = await serverFileStorage.upload(
            Buffer.from(image.url, "base64"),
            {
              contentType: image.mimeType || "image/png",
            },
          );
          return {
            url: uploadedResult.sourceUrl,
            mimeType: image.mimeType || "image/png",
          };
        })
        .watch(
          watchError((e) => {
            logger.error(e);
            logger.info(`upload processed image failed. using base64`);
          }),
        )
        .ifFail(() => {
          throw new Error(
            "Background removal was successful, but file upload failed. Please check your file upload configuration and try again.",
          );
        })
        .unwrap();

      return {
        image: uploadedImage,
        guide:
          uploadedImage.url.length > 0
            ? "The background has been successfully removed from your image. The image now has a transparent background."
            : "I apologize, but the background removal was not successful. Please try again with a different image.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

/**
 * Convert image to anime style tool
 */
export const animeConversionTool = createTool({
  name: "anime-conversion",
  description:
    "Convert an image to anime style. Works best with person images. The image will be transformed into an anime-style illustration.",
  inputSchema: z.object({
    imageUrl: z
      .string()
      .url()
      .describe("The URL of the image to convert to anime"),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Anime Conversion tool called with imageUrl: "${imageUrl}"`);

    try {
      // Call the anime conversion API
      const processedImage = await convertImageToAnime({
        prompt: "convert to anime",
        imageUrl,
        abortSignal,
      });

      logger.info(`Anime Conversion: Image converted successfully`);

      // Upload converted image to storage
      const uploadedImage = await safe(processedImage.image)
        .map(async (image) => {
          const uploadedResult = await serverFileStorage.upload(
            Buffer.from(image.url, "base64"),
            {
              contentType: image.mimeType || "image/jpeg",
            },
          );
          return {
            url: uploadedResult.sourceUrl,
            mimeType: image.mimeType || "image/jpeg",
          };
        })
        .watch(
          watchError((e) => {
            logger.error(e);
            logger.info(`upload converted image failed. using base64`);
          }),
        )
        .ifFail(() => {
          throw new Error(
            "Image conversion was successful, but file upload failed. Please check your file upload configuration and try again.",
          );
        })
        .unwrap();

      return {
        image: uploadedImage,
        guide:
          uploadedImage.url.length > 0
            ? "Your image has been successfully converted to anime style! The anime version is now displayed above. Note: This works best with person images."
            : "I apologize, but the anime conversion was not successful. Please try again with a different image, preferably a person image.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// Export enhance image tool
export { enhanceImageTool };
