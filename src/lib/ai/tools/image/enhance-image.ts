import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { serverFileStorage } from "lib/file-storage";
import { safe, watchError } from "ts-safe";

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
 * Image enhancement tool using Image Enhance API
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
      const enhanceApiUrl = "https://arimagex.netlify.app/api/enhance";
      
      logger.info(`Calling enhance API: ${enhanceApiUrl}`);

      const apiResponse = await fetch(enhanceApiUrl, {
        method: "POST",
        signal: abortSignal,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "better-chatbot/1.0",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!apiResponse.ok) {
        logger.error(`Enhance API failed with status: ${apiResponse.status} ${apiResponse.statusText}`);
        throw new Error(`Enhance API failed: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      // Check content type to see if we got an image directly or JSON
      const contentType = apiResponse.headers.get("content-type") || "";
      logger.info(`API Response Content-Type: ${contentType}`);

      let enhancedImageBuffer: Buffer;
      let enhancedMimeType: string;

      if (contentType.includes("image")) {
        // API returned the enhanced image directly
        logger.info(`✅ Enhanced image received directly from API`);
        const arrayBuffer = await apiResponse.arrayBuffer();
        enhancedImageBuffer = Buffer.from(arrayBuffer);
        enhancedMimeType = contentType;
      } else {
        // API returned JSON with image URL or blob
        const apiData = await apiResponse.json();
        logger.info(`API Response: ${JSON.stringify(apiData)}`);

        let enhancedUrl: string | null = null;
        if (apiData.url) enhancedUrl = apiData.url;
        else if (apiData.imageUrl) enhancedUrl = apiData.imageUrl;
        else if (apiData.download_url) enhancedUrl = apiData.download_url;

        if (enhancedUrl) {
          logger.info(`Fetching enhanced image from URL: ${enhancedUrl}`);
          const imageResponse = await fetch(enhancedUrl, { signal: abortSignal });
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch enhanced image: ${imageResponse.status}`);
          }
          const arrayBuffer = await imageResponse.arrayBuffer();
          enhancedImageBuffer = Buffer.from(arrayBuffer);
          enhancedMimeType = imageResponse.headers.get("content-type") || "image/jpeg";
        } else {
          throw new Error("API response doesn't contain an image or image URL");
        }
      }

      logger.info(`Image enhanced successfully, size: ${enhancedImageBuffer.length} bytes`);

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
          const originalMimeType = originalResponse.headers.get("content-type") || "image/jpeg";

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
                logger.info(`upload original image failed, using original URL`);
              }),
            )
            .ifFail(() => {
              logger.warn("Failed to upload original image, using original URL");
              return uploadedOriginal;
            })
            .unwrap();
        }
      } catch (e) {
        logger.warn("Could not fetch original image, using original URL", e);
      }

      // Upload enhanced image to storage
      const uploadedEnhanced = await safe(enhancedImageBuffer)
        .map(async (buffer) => {
          const uploadedResult = await serverFileStorage.upload(buffer, {
            contentType: enhancedMimeType,
          });
          return {
            url: uploadedResult.sourceUrl,
            mimeType: enhancedMimeType,
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
