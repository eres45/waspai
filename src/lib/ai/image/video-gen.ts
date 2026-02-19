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
 * Generate video using SORA API
 */
export async function generateVideoWithSora(
  options: VideoGenOptions,
  retries: number = 3,
): Promise<VideoGenResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(
        `Video Gen (SORA): Starting video generation (attempt ${attempt}/${retries})`,
      );
      logger.info(`Video Gen (SORA): Prompt: ${options.prompt}`);

      // Use AbortController with 120 second timeout for video generation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const response = await fetch("https://vetrex.x10.mx/api/sora.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: options.prompt,
          }),
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
        const videoUrl = data.video || data.url || data.result;

        if (!videoUrl) {
          throw new Error("No video URL in response");
        }

        logger.info(`Video Gen (SORA): Video generated successfully`);
        logger.info(`Video Gen (SORA): Video URL: ${videoUrl}`);

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
