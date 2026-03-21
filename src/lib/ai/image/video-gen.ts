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

    // Use AbortController with 85 second timeout for video generation
    // (Vercel max is 120s, background queue wait is 5s max before returning to UI)
    // We use 85s to leave 35s of safety buffer for DB/routing overhead AND the secondary LLM text response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 85000);

    try {
      const renderBaseUrl =
        process.env.RENDER_URL || "https://metaai-1xpj.onrender.com";
      const url = new URL(`${renderBaseUrl}/generate/video/v2`);
      url.searchParams.set("prompt", options.prompt);
      const apiUrl = url.toString();

      logger.info(`Video Gen (Meta): Attempting fetch to ${apiUrl}`);
      console.log(`[VIDEO GEN RENDER API] Fetching: ${apiUrl}`);

      // We use the native Node.js 'https' module to absolutely guarantee that
      // Next.js' aggressive monkeypatched fetch doesn't prematurely abort the stream
      // if the client UI drops the connection or re-renders.
      const responseBody = await new Promise<string>(
        async (resolve, reject) => {
          const https = await import("https");
          const req = https.request(
            apiUrl,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-log-request": "true",
              },
              signal: controller.signal, // native support for our strict 85s abort signal
            },
            (res: any) => {
              let data = "";
              res.on("data", (chunk: Buffer) => {
                data += chunk.toString();
              });
              res.on("end", () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                  reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                } else {
                  resolve(data);
                }
              });
            },
          );

          req.on("error", (err: any) => reject(err));
          req.end();
        },
      );

      clearTimeout(timeoutId);

      const data = JSON.parse(responseBody);
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
