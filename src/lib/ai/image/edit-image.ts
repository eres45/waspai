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

      const params = new URLSearchParams();
      params.append("url", options.imageUrl);

      logger.info(`Remove BG: Image URL: ${options.imageUrl}`);
      logger.info(`Remove BG: Sending request with timeout of 60 seconds...`);

      // Use AbortController with 60 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(
          `https://sii3.top/api/remove-bg.php?${params.toString()}`,
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

        const data = await response.json();
        const imageUrl = data.response || data.image || data.url;

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

export async function editImageWithNanoBanana(
  options: EditImageOptions,
  retries: number = 3,
): Promise<{ image: EditedImage }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(
        `Nano-Banana Edit: Starting image edit with prompt: "${options.prompt}" (attempt ${attempt}/${retries})`,
      );

      const payload = {
        prompt: options.prompt,
        imageUrl: options.imageUrl,
      };

      logger.info(`Nano-Banana Edit: Image URL: ${options.imageUrl}`);
      logger.info(
        `Nano-Banana Edit: Sending request with timeout of 60 seconds...`,
      );

      // Use AbortController with 60 second timeout (Edit is faster than generation)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds

      try {
        const response = await fetch(
          "https://vetrex.x10.mx/api/nano_banana.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
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

        const data = await response.json();

        if (!data.url) {
          throw new Error("No image URL in response");
        }

        logger.info(
          `Nano-Banana Edit: Image edited successfully, downloading from ${data.url}...`,
        );

        // Fetch the edited image and convert to base64
        const imageResponse = await fetch(data.url);
        const buffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        logger.info(`Nano-Banana Edit: Image successfully converted to base64`);

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
      logger.warn(
        `Nano-Banana Edit attempt ${attempt} failed: ${lastError.message}`,
      );

      // If it's a 502/503 error and we have retries left, wait and retry
      if (
        (attempt < retries && lastError.message.includes("HTTP 502")) ||
        lastError.message.includes("HTTP 503")
      ) {
        const waitTime = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
        logger.info(`Nano-Banana Edit: Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's the last attempt or a non-retryable error, throw
      if (attempt === retries) {
        break;
      }
    }
  }

  logger.error("Nano-Banana Edit failed after all retries:", lastError);
  throw new Error(
    `Failed to edit image with Nano-Banana after ${retries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}

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
