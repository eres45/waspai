import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { serverFileStorage } from "lib/file-storage";
import { safe, watchError } from "ts-safe";
import { enhanceImageQuality } from "lib/ai/image/edit-image";

export type EnhanceImageToolResult = {
  originalImage: {
    url: string;
    mimeType?: string;
  };
  enhancedImage: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
};

/**
 * Image enhancement tool using Image Enhance API via PhotoGrid proxy
 */
export const enhanceImageTool = createTool({
  name: "enhance-image",
  description:
    "Enhance and improve image quality. Provide an image URL and the tool will enhance it, removing noise, improving clarity, and overall image quality. Returns both the original and enhanced images for comparison.",
  inputSchema: z.object({
    imageUrl: z.string().url().describe("The URL of the image to enhance"),
  }),
  execute: async ({ imageUrl }, { abortSignal }) => {
    logger.info(`Enhance Image tool called with imageUrl: "${imageUrl}"`);

    try {
      // Call the new enhancement API that returns the enhanced image directly
      const processedImage = await enhanceImageQuality({
        imageUrl,
        abortSignal,
      });

      logger.info(`✅ Enhanced image received`);

      // Upload enhanced image to storage
      const uploadedEnhanced = await safe(processedImage.image)
        .map(async (image) => {
          const uploadedResult = await serverFileStorage.upload(
            Buffer.from(image.url, "base64"),
            { contentType: image.mimeType || "image/jpeg" },
          );
          return {
            url: uploadedResult.sourceUrl,
            mimeType: image.mimeType || "image/jpeg",
          };
        })
        .watch(
          watchError((e) => {
            logger.error(e);
            logger.info(`upload enhanced image failed`);
          }),
        )
        .ifFail(() => {
          throw new Error("Failed to upload enhanced image");
        })
        .unwrap();

      // Fetch original image for comparison
      let uploadedOriginal = {
        url: imageUrl,
        mimeType: "image/jpeg",
      };

      try {
        const originalResponse = await fetch(imageUrl, { signal: abortSignal });
        if (originalResponse.ok) {
          const originalArrayBuffer = await originalResponse.arrayBuffer();
          const originalBuffer = Buffer.from(originalArrayBuffer);
          const originalMimeType =
            originalResponse.headers.get("content-type") || "image/jpeg";

          uploadedOriginal = await safe(originalBuffer)
            .map(async (buffer) => {
              const uploadedResult = await serverFileStorage.upload(buffer, {
                contentType: originalMimeType,
              });
              return {
                url: uploadedResult.sourceUrl,
                mimeType: originalMimeType,
              };
            })
            .watch(
              watchError((e) => {
                logger.error(e);
                logger.warn(`upload original image failed, using original URL`);
              }),
            )
            .ifFail(() => {
              return uploadedOriginal;
            })
            .unwrap();
        }
      } catch (e) {
        logger.warn("Could not fetch original image, using original URL", e);
      }

      return {
        originalImage: uploadedOriginal,
        enhancedImage: uploadedEnhanced,
        guide:
          "The image has been successfully enhanced! On the left is your original image, and on the right is the enhanced version with improved quality, clarity, and reduced noise. You can compare both versions to see the improvements.",
      };
    } catch (e) {
      logger.error("Enhance Image Error:", e);
      throw e;
    }
  },
});
