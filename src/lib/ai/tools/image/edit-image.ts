import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { serverFileStorage } from "lib/file-storage";
import { safe, watchError } from "ts-safe";
import {
  removeImageBackground,
  convertImageToAnime,
  removeImageWatermark,
  removeImageObject,
  applySuperResolution,
  restoreOldPhoto,
  blurBackground,
} from "lib/ai/image/edit-image";
import { enhanceImageTool } from "./enhance-image";

export type EditImageToolResult = {
  image: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
};

// --- Helper for uploading result ---
async function uploadToStorage(
  image: { url: string; mimeType: string },
  errorMsg: string,
) {
  const uploadedImage = await safe(image)
    .map(async (img) => {
      const uploadedResult = await serverFileStorage.upload(
        Buffer.from(img.url, "base64"),
        { contentType: img.mimeType || "image/png" },
      );
      return {
        url: uploadedResult.sourceUrl,
        mimeType: img.mimeType || "image/png",
      };
    })
    .watch(watchError((e) => logger.error(`API success but upload failed:`, e)))
    .ifFail(() => {
      throw new Error(errorMsg);
    })
    .unwrap();
  return uploadedImage;
}

/**
 * Remove background tool
 */
export const removeBackgroundTool = createTool({
  name: "remove-background",
  description:
    "Remove the background from an image. When the user uploads an image or references an image in the conversation, extract its URL from the file attachment and call this tool immediately. Do NOT ask the user to provide a URL — use the URL from the uploaded file attachment directly.",
  inputSchema: z.object({
    imageUrl: z
      .string()
      .describe(
        "The URL of the image. Extract this from the file attachment URL in the conversation (e.g. https://www.waspai.in/api/storage/file/... or any image URL visible in the context).",
      ),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Remove Background tool called with imageUrl: "${imageUrl}"`);
    try {
      const processedImage = await removeImageBackground({
        prompt: "remove background",
        imageUrl,
        abortSignal,
      });
      const uploadedImage = await uploadToStorage(
        processedImage.image,
        "Background removal successful but upload failed.",
      );
      return {
        image: uploadedImage,
        guide: "The background has been successfully removed from your image.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

/**
 * Convert image to anime style tool (AI Style Transfer)
 */
export const animeConversionTool = createTool({
  name: "anime-conversion",
  description: "Convert an image to anime style. Extract the image URL from file attachments in the conversation and call this tool immediately.",
  inputSchema: z.object({
    imageUrl: z
      .string()
      .describe("The URL of the image. Extract from the uploaded file attachment in the conversation."),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Anime Conversion tool called with imageUrl: "${imageUrl}"`);
    try {
      const processedImage = await convertImageToAnime({
        prompt: "convert to anime",
        imageUrl,
        abortSignal,
      });
      const uploadedImage = await uploadToStorage(
        processedImage.image,
        "Conversion successful but upload failed.",
      );
      return {
        image: uploadedImage,
        guide: "Your image has been successfully converted to anime style!",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// 1. Watermark Removal
export const removeWatermarkTool = createTool({
  name: "remove-watermark",
  description: "Remove watermarks from an image. Extract the image URL from file attachments in the conversation and call this tool immediately.",
  inputSchema: z.object({
    imageUrl: z
      .string()
      .describe("The URL of the image. Extract from the uploaded file attachment in the conversation."),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Remove Watermark tool called with imageUrl: "${imageUrl}"`);
    try {
      const processed = await removeImageWatermark({ imageUrl, abortSignal });
      const uploaded = await uploadToStorage(
        processed.image,
        "Watermark removal successful but upload failed.",
      );
      return {
        image: uploaded,
        guide: "The watermark has been successfully removed from your image.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// 2. Object Removal
export const removeObjectTool = createTool({
  name: "remove-object",
  description: "Remove unwanted objects or people from an image.",
  inputSchema: z.object({
    imageUrl: z
      .string()
      .url()
      .describe("The URL of the image to remove an object from"),
    maskUrl: z
      .string()
      .url()
      .optional()
      .describe(
        "Optional URL of a black-and-white mask image indicating the object to remove",
      ),
  }),
  execute: async ({ imageUrl, maskUrl }, { abortSignal }) => {
    logger.info(`Remove Object tool called with imageUrl: "${imageUrl}"`);
    try {
      const processed = await removeImageObject({
        imageUrl,
        maskUrl,
        abortSignal,
      });
      const uploaded = await uploadToStorage(
        processed.image,
        "Object removal successful but upload failed.",
      );
      return {
        image: uploaded,
        guide:
          "The targeted object has been successfully removed from your image.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// 3. Super Resolution
export const superResolutionTool = createTool({
  name: "super-resolution",
  description: "Upscale and increase the resolution of an image. Extract the image URL from file attachments in the conversation and call this tool immediately.",
  inputSchema: z.object({
    imageUrl: z.string().describe("The URL of the image. Extract from the uploaded file attachment in the conversation."),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Super Resolution tool called with imageUrl: "${imageUrl}"`);
    try {
      const processed = await applySuperResolution({ imageUrl, abortSignal });
      const uploaded = await uploadToStorage(
        processed.image,
        "Super resolution successful but upload failed.",
      );
      return {
        image: uploaded,
        guide:
          "The image resolution and quality have been significantly increased.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// 4. Restore Old Photo
export const restoreOldPhotoTool = createTool({
  name: "restore-old-photo",
  description: "Fix and colorize old, damaged, or blurry vintage photos.",
  inputSchema: z.object({
    imageUrl: z.string().url().describe("The URL of the old or damaged photo"),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Restore Old Photo tool called with imageUrl: "${imageUrl}"`);
    try {
      const processed = await restoreOldPhoto({ imageUrl, abortSignal });
      const uploaded = await uploadToStorage(
        processed.image,
        "Restoration successful but upload failed.",
      );
      return {
        image: uploaded,
        guide: "The old photo has been successfully restored and repaired.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// 5. Blur Background
export const blurBackgroundTool = createTool({
  name: "blur-background",
  description:
    "Blur the background of an image while keeping the main subject in focus (bokeh effect).",
  inputSchema: z.object({
    imageUrl: z
      .string()
      .url()
      .describe("The URL of the image to apply background blur to"),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Blur Background tool called with imageUrl: "${imageUrl}"`);
    try {
      const processed = await blurBackground({ imageUrl, abortSignal });
      const uploaded = await uploadToStorage(
        processed.image,
        "Background blur successful but upload failed.",
      );
      return {
        image: uploaded,
        guide: "The background of the image has been professionally blurred.",
      };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  },
});

// Export enhance image tool
export { enhanceImageTool };
