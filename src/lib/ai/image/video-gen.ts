import logger from "logger";

export interface VideoGenOptions {
  prompt: string;
  model?: string;
  abortSignal?: AbortSignal;
}

export interface VideoGenResult {
  video: {
    url: string;
    mimeType?: string;
  };
}

const VIDEO_ENDPOINT =
  "https://swift-sora-video.revai.workers.dev/api/generate";

/**
 * Dynamic fetch wrapper with exponential backoff retries.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000,
): Promise<Response> {
  let currentDelay = delay;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // If server error, retry
      if (response.status >= 500 && i < retries - 1) {
        console.warn(
          `[API Retry] HTTP ${response.status} on attempt ${i + 1}. Retrying in ${currentDelay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= 2; // exponential backoff
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(
        `[API Retry] Fetch failed on attempt ${i + 1}. Retrying in ${currentDelay}ms... Error:`,
        err,
      );
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= 2; // exponential backoff
    }
  }
  throw new Error(`Fetch failed after ${retries} attempts`);
}

/**
 * Generate video using the unified AI worker (Swift Sora).
 */
export async function generateVideoWithMeta(
  options: VideoGenOptions,
): Promise<VideoGenResult> {
  logger.info(
    `Video Gen: Starting — prompt: "${options.prompt}", model: "${options.model || "default"}"`,
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 85000);

  try {
    const response = await fetchWithRetry(
      VIDEO_ENDPOINT,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: options.prompt,
          aspect_ratio: "16:9",
          style: options.model?.includes("cinematic")
            ? "cinematic"
            : options.model?.includes("anime")
              ? "anime"
              : "none",
          type: "txt",
        }),
        signal: controller.signal,
      },
      3,
      1000,
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const videoUrl =
      data.url ||
      data.video_url ||
      data.video ||
      data.video_urls?.[0] ||
      data.data?.[0]?.url;

    if (!videoUrl) {
      throw new Error(`No video URL in response: ${JSON.stringify(data)}`);
    }

    logger.info(`Video Gen: Success — ${videoUrl}`);
    return { video: { url: videoUrl, mimeType: "video/mp4" } };
  } catch (error) {
    clearTimeout(timeoutId);
    logger.error("Video Gen failed:", error);
    throw new Error(
      `Failed to generate video: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
