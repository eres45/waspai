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
): Promise<VideoGenResult> {
  try {
    logger.info(`Video Gen (Meta): Starting video generation`);
    logger.info(`Video Gen (Meta): Prompt: ${options.prompt}`);

    // Use AbortController with 115 second timeout for video generation
    // (Vercel max is 120s, background queue wait is 5s max before returning to UI)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 115000);

    try {
      const renderBaseUrl =
        process.env.RENDER_URL || "https://metaai-1xpj.onrender.com";
      const url = new URL(`${renderBaseUrl}/generate/video/v2`);
      url.searchParams.set("prompt", options.prompt);
      const apiUrl = url.toString();

      logger.info(`Video Gen (Meta): Attempting fetch to ${apiUrl}`);
      console.log(`[VIDEO GEN RENDER API] Fetching: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-log-request": "true",
        },
        cache: "no-store", // Bypass Next.js fetch patching/deduplication
        signal: controller.signal, // strictly use our 65s timeout, ignoring AI SDK's premature aborts
      });

      logger.info(
        `Video Gen (Meta): Received response status: ${response.status}`,
      );

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
    } catch (error: any) {
      clearTimeout(timeoutId);
      logger.error("FATAL FETCH ERROR in Video Gen Tool:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
      throw error;
    }
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    logger.error("Video Gen failed:", lastError);
    throw new Error(
      `Failed to generate video: ${lastError?.message || "Unknown error"}`,
    );
  }
}
