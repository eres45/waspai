import logger from "logger";

export interface VideoGenOptions {
  prompt: string;
  abortSignal?: AbortSignal;
}

export interface VideoGenResult {
  video: {
    url: string;
    mimeType?: string;
  };
}

/**
 * Generate video using Meta AI API
 */
export async function generateVideoWithMeta(
  options: VideoGenOptions,
  retries: number = 3,
): Promise<VideoGenResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(
        `Video Gen (Meta): Starting video generation (attempt ${attempt}/${retries})`,
      );
      logger.info(`Video Gen (Meta): Prompt: ${options.prompt}`);

      // Use AbortController with 120 second timeout for video generation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const apiUrl = `https://metaai-1xpj.onrender.com/generate/video/v2?prompt=${encodeURIComponent(options.prompt)}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: options.abortSignal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status}${errorText ? `: ${errorText}` : ""}`,
          );
        }

        const data = await response.json();
        // Updated for Meta API response format: { success: true, video_urls: [...], ... }
        const videoUrl = data.video_urls?.[0] || data.video || data.url;

        if (!videoUrl) {
          throw new Error("No video URL in response from Meta API");
        }

        logger.info(`Video Gen (Meta): Video generated successfully`);
        logger.info(`Video Gen (Meta): Video URL: ${videoUrl}`);

        return {
          video: {
            url: videoUrl,
            mimeType: "video/mp4",
          },
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Video Gen attempt ${attempt} failed: ${lastError.message}`);

      // If it's a 502/503 error and we have retries left, wait and retry
      if (
        attempt < retries &&
        (lastError.message.includes("HTTP 502") ||
          lastError.message.includes("HTTP 503"))
      ) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        logger.info(`Video Gen: Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's the last attempt or a non-retryable error, throw
      if (attempt === retries) {
        break;
      }
    }
  }

  logger.error("Video Gen failed after all retries:", lastError);
  throw new Error(
    `Failed to generate video after ${retries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}
