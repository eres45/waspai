import logger from "logger";

export interface EditImageOptions {
  prompt: string;
  imageUrl: string;
  abortSignal?: AbortSignal;
}

export interface EditedImage {
  url: string;
  mimeType: string;
}

/**
 * Edit images using Nano-Banana Edit API
 * Supports editing existing images with text prompts
 * Includes retry logic for temporary failures
 */
export async function removeImageBackground(
  options: EditImageOptions,
  retries: number = 3,
): Promise<{ image: EditedImage }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(
        `Remove BG: Starting background removal (attempt ${attempt}/${retries})`,
      );

      const body = {
        imageUrl: options.imageUrl,
      };

      logger.info(`Remove BG: Image URL: ${options.imageUrl}`);
      logger.info(`Remove BG: Sending request with timeout of 60 seconds...`);

      // Use AbortController with 60 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch("https://vetrex.x10.mx/api/removebg.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status}${errorText ? `: ${errorText}` : ""}`,
          );
        }

        const data = await response.json();
        const imageUrl = data.url;

        if (!imageUrl) {
          throw new Error("No image URL in response");
        }

        logger.info(
          `Remove BG: Background removed, downloading from ${imageUrl}...`,
        );

        // Fetch the image and convert to base64
        const imageResponse = await fetch(imageUrl);
        const buffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        logger.info(`Remove BG: Image successfully converted to base64`);

        return {
          image: {
            url: base64,
            mimeType: "image/png",
          },
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Remove BG attempt ${attempt} failed: ${lastError.message}`);

      // If it's a 502/503 error and we have retries left, wait and retry
      if (
        attempt < retries &&
        (lastError.message.includes("HTTP 502") ||
          lastError.message.includes("HTTP 503"))
      ) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        logger.info(`Remove BG: Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's the last attempt or a non-retryable error, throw
      if (attempt === retries) {
        break;
      }
    }
  }

  logger.error("Remove BG failed after all retries:", lastError);
  throw new Error(
    `Failed to remove background after ${retries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}

/**
 * Edit images using Infip (GhostAPI)
 * Supports editing existing images with text prompts via /v1/images/edits
 */
export async function editImageWithInfip(
  options: EditImageOptions,
): Promise<{ image: EditedImage }> {
  const apiKey = process.env.INFIP_API_KEY;
  if (!apiKey) {
    throw new Error("INFIP_API_KEY is not set");
  }

  try {
    logger.info(
      `Infip Edit: Fetching source image from ${options.imageUrl}...`,
    );

    // Fetch source image
    const sourceImageResponse = await fetch(options.imageUrl);
    if (!sourceImageResponse.ok) {
      throw new Error(
        `Failed to fetch source image: ${sourceImageResponse.status}`,
      );
    }

    // Determine MIME type
    let contentType =
      sourceImageResponse.headers.get("content-type") ||
      "application/octet-stream";
    logger.info(`Infip Edit: Source content-type: ${contentType}`);

    // If generic, try to infer from URL
    if (
      contentType === "application/octet-stream" ||
      !contentType.includes("image/")
    ) {
      const url = options.imageUrl.toLowerCase();
      if (url.endsWith(".png")) contentType = "image/png";
      else if (url.endsWith(".jpg") || url.endsWith(".jpeg"))
        contentType = "image/jpeg";
      else if (url.endsWith(".webp")) contentType = "image/webp";
      else if (url.endsWith(".gif")) contentType = "image/gif";
      else contentType = "image/jpeg"; // Default fallback
      logger.info(`Infip Edit: Inferred content-type: ${contentType}`);
    }

    const sourceImageBuffer = await sourceImageResponse.arrayBuffer();
    const sourceImageBlob = new Blob([sourceImageBuffer], {
      type: contentType,
    });

    const formData = new FormData();
    const filename = options.imageUrl.split("/").pop() || "image.png";
    formData.append("image", sourceImageBlob, filename);
    formData.append("prompt", options.prompt);
    formData.append("model", "nano-banana"); // User specified model
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("response_format", "url");

    logger.info(`Infip Edit: Sending edit request...`);

    const response = await fetch("https://api.infip.pro/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // Content-Type header is set automatically with FormData
      },
      body: formData,
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Check for b64_json
    if (data.data && data.data.length > 0 && data.data[0].b64_json) {
      return {
        image: {
          url: data.data[0].b64_json,
          mimeType: "image/png",
        },
      };
    } else if (data.data && data.data.length > 0 && data.data[0].url) {
      // Fetch URL if returned
      const imgRes = await fetch(data.data[0].url);
      const buf = await imgRes.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      return {
        image: {
          url: b64,
          mimeType: "image/png",
        },
      };
    }

    throw new Error("Invalid response format from Infip Edit API");
  } catch (error) {
    logger.error("Infip Edit failed:", error);
    throw new Error(
      `Failed to edit image with Infip: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Alias for compatibility if needed, but better to update calls
export const editImageWithNanoBanana = editImageWithInfip;

/**
 * Convert image to anime style using sii3.top API
 * Works best with person images
 * Note: API can be slow, may take 30-120 seconds
 */
export async function convertImageToAnime(
  options: EditImageOptions,
  retries: number = 2,
): Promise<{ image: EditedImage }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(
        `Anime Conversion: Starting anime conversion (attempt ${attempt}/${retries})`,
      );

      const params = new URLSearchParams();
      params.append("img", options.imageUrl);

      logger.info(`Anime Conversion: Image URL: ${options.imageUrl}`);
      logger.info(
        `Anime Conversion: Sending request with timeout of 180 seconds (API can be slow)...`,
      );

      // Use AbortController with 180 second timeout (API is slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        const response = await fetch(
          `https://sii3.top/api/anime.php?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status}${errorText ? `: ${errorText}` : ""}`,
          );
        }

        const contentType = response.headers.get("content-type") || "";

        logger.info(`Anime Conversion: Response content-type: ${contentType}`);

        if (contentType.includes("image")) {
          // API returned image directly
          logger.info(`Anime Conversion: API returned image directly`);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          logger.info(
            `Anime Conversion: Image successfully converted to anime`,
          );

          return {
            image: {
              url: base64,
              mimeType: contentType || "image/jpeg",
            },
          };
        } else if (contentType.includes("json")) {
          // Try to parse as JSON
          logger.info(`Anime Conversion: Parsing JSON response...`);
          const data = await response.json();
          logger.info(`Anime Conversion: JSON response:`, JSON.stringify(data));

          if (data.url) {
            logger.info(
              `Anime Conversion: Fetching anime image from ${data.url}...`,
            );
            const imageResponse = await fetch(data.url);
            if (!imageResponse.ok) {
              throw new Error(
                `Failed to fetch anime image: ${imageResponse.status}`,
              );
            }
            const buffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");

            logger.info(
              `Anime Conversion: Image successfully converted to anime`,
            );

            return {
              image: {
                url: base64,
                mimeType: "image/jpeg",
              },
            };
          } else if (data.image_url) {
            logger.info(
              `Anime Conversion: Fetching anime image from ${data.image_url}...`,
            );
            const imageResponse = await fetch(data.image_url);
            if (!imageResponse.ok) {
              throw new Error(
                `Failed to fetch anime image: ${imageResponse.status}`,
              );
            }
            const buffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");

            logger.info(
              `Anime Conversion: Image successfully converted to anime`,
            );

            return {
              image: {
                url: base64,
                mimeType: "image/jpeg",
              },
            };
          } else {
            throw new Error(
              `No image URL in JSON response. Available keys: ${Object.keys(data).join(", ")}`,
            );
          }
        } else {
          // Unknown response type
          const text = await response.text();
          logger.warn(
            `Anime Conversion: Unexpected response type: ${contentType}`,
          );
          logger.warn(
            `Anime Conversion: Response text (first 500 chars): ${text.substring(0, 500)}`,
          );
          throw new Error(`Unexpected response type: ${contentType}`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Anime Conversion attempt ${attempt} failed: ${lastError.message}`,
      );

      // If it's a timeout/abort error and we have retries left, wait and retry
      if (
        attempt < retries &&
        (lastError.message.includes("abort") ||
          lastError.message.includes("timeout") ||
          lastError.message.includes("HTTP 502") ||
          lastError.message.includes("HTTP 503") ||
          lastError.message.includes("HTTP 504"))
      ) {
        const waitTime = Math.pow(2, attempt - 1) * 2000; // Exponential backoff: 2s, 4s
        logger.info(`Anime Conversion: Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's the last attempt or a non-retryable error, throw
      if (attempt === retries) {
        break;
      }
    }
  }

  logger.error("Anime Conversion failed after all retries:", lastError);
  throw new Error(
    `Failed to convert image to anime after ${retries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}
