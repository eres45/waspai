import logger from "logger";
import { UNIFIED_WORKER_URL } from "../models";

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

const VIDEO_ENDPOINT = `${UNIFIED_WORKER_URL}/v1/video/generations`;

/**
 * Generate video using the unified AI worker (Swift Sora).
 */
export async function generateVideoWithMeta(
  options: VideoGenOptions,
): Promise<VideoGenResult> {
  logger.info(`Video Gen: Starting — prompt: "${options.prompt}"`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 85000);

  try {
    const response = await fetch(VIDEO_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: options.prompt }),
      signal: controller.signal,
    });

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
      data.video_urls?.[0];

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
