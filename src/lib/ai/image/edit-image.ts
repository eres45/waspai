import logger from "logger";
import { CREATIVE_WORKER_URL } from "../models";

export interface EditImageOptions {
  prompt?: string;
  imageUrl: string;
  maskUrl?: string;
  abortSignal?: AbortSignal;
}

export interface EditedImage {
  url: string;
  mimeType: string;
}

const EDIT_ENDPOINT = `${CREATIVE_WORKER_URL}/v1/images/edits`;

/**
 * Resolves internal storage paths to publicly accessible URLs via the
 * Cloudflare Worker's /serve endpoint (auth-free Telegram proxy).
 */
function resolveImageUrl(url: string): string {
  const bridgePath = "/api/storage/file/";
  if (url.includes(bridgePath)) {
    const filePath = url.split(bridgePath).pop();
    const workerUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL;
    if (filePath && workerUrl) {
      return `${workerUrl}/serve?path=${encodeURIComponent(filePath)}`;
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (filePath && botToken) {
      return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    }
  }
  return url;
}

/**
 * Core image editing function — routes through the unified worker.
 * The worker uses P-Image Playground for edits.
 */
async function callEditEndpoint(
  operation: string,
  options: EditImageOptions,
): Promise<{ image: EditedImage }> {
  const resolvedUrl = resolveImageUrl(options.imageUrl);

  logger.info(`Image Edit [${operation}]: ${resolvedUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const body: Record<string, string> = {
      image_url: resolvedUrl,
      operation,
    };
    if (options.prompt) body.prompt = options.prompt;
    if (options.maskUrl) body.mask_url = options.maskUrl;

    const response = await fetch(EDIT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("image/")) {
      const buffer = await response.arrayBuffer();
      return {
        image: {
          url: Buffer.from(buffer).toString("base64"),
          mimeType: contentType.split(";")[0].trim(),
        },
      };
    }

    const data = await response.json();
    const outputStr =
      data.url ||
      data.image_url ||
      data.image?.url || // worker returns { image: { url, mimeType } }
      (typeof data.image === "string" ? data.image : null) ||
      data.result ||
      data.proxied_url ||
      data.data?.[0]?.url ||
      data.data?.[0]?.b64_json;

    // If the worker already returned a nested image object with mimeType, use it directly
    if (
      data.image?.url &&
      data.image?.mimeType &&
      !data.image.url.startsWith("http")
    ) {
      return {
        image: {
          url: data.image.url.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: data.image.mimeType || "image/png",
        },
      };
    }

    if (!outputStr) {
      throw new Error(`No image in response: ${JSON.stringify(data)}`);
    }

    if (outputStr.startsWith("http")) {
      const imgRes = await fetch(outputStr);
      if (!imgRes.ok) throw new Error("Failed to fetch result image URL");
      const buf = await imgRes.arrayBuffer();
      return {
        image: {
          url: Buffer.from(buf).toString("base64"),
          mimeType: imgRes.headers.get("content-type") ?? "image/png",
        },
      };
    }

    return {
      image: {
        url: outputStr.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/png",
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    logger.error(`Image Edit [${operation}] failed:`, error);
    throw new Error(
      `Failed to edit image (${operation}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ─── Feature exports ─────────────────────────────────────────────────────────

export const removeImageBackground = (o: EditImageOptions) =>
  callEditEndpoint("remove-background", o);

export const removeImageWatermark = (o: EditImageOptions) =>
  callEditEndpoint("remove-watermark", o);

export const removeImageObject = (o: EditImageOptions) =>
  callEditEndpoint("remove-object", o);

export const enhanceImageQuality = (o: EditImageOptions) =>
  callEditEndpoint("enhance-quality", o);

export const applyAiStyleTransfer = (o: EditImageOptions) =>
  callEditEndpoint("style-transfer", o);

export const applySuperResolution = (o: EditImageOptions) =>
  callEditEndpoint("super-resolution", o);

export const restoreOldPhoto = (o: EditImageOptions) =>
  callEditEndpoint("restore-photo", o);

export const blurBackground = (o: EditImageOptions) =>
  callEditEndpoint("blur-background", o);

export const convertImageToAnime = (o: EditImageOptions) =>
  callEditEndpoint("style-transfer", o);

export const editImage = (o: EditImageOptions) =>
  callEditEndpoint("edit-image", o);
