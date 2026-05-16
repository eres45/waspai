"use server";

import logger from "logger";
import { UNIFIED_WORKER_URL } from "../models";

type GenerateImageOptions = {
  prompt: string;
  model?: string;
  abortSignal?: AbortSignal;
};

type GeneratedImage = {
  base64: string;
  mimeType?: string;
};

export type GeneratedImageResult = {
  images: GeneratedImage[];
};

const IMAGE_ENDPOINT = `${UNIFIED_WORKER_URL}/v1/images/generations`;

/**
 * Helper to download an image URL and convert to base64
 */
async function downloadAndEncodeImage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to download image: ${response.status}`);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/**
 * Core image generation function — routes through the unified worker.
 * The worker supports 10 providers. Pass `model` to select one, or omit for default.
 */
async function generateImageViaUnifiedWorker(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  const body: Record<string, unknown> = {
    prompt: options.prompt,
    n: 1,
  };
  if (options.model) body.model = options.model;

  const response = await fetch(IMAGE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.abortSignal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Unified Worker image gen failed: HTTP ${response.status} — ${errText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  // If worker returns raw image bytes
  if (contentType.includes("image/")) {
    const buffer = await response.arrayBuffer();
    return {
      images: [
        {
          base64: Buffer.from(buffer).toString("base64"),
          mimeType: contentType.split(";")[0].trim(),
        },
      ],
    };
  }

  // Standard OpenAI-compatible JSON response
  const data = await response.json();

  // Handle OpenAI-style { data: [{ url, b64_json }] }
  if (data.data && Array.isArray(data.data)) {
    const images = await Promise.all(
      data.data.map(async (item: { url?: string; b64_json?: string }) => {
        if (item.b64_json) {
          return { base64: item.b64_json, mimeType: "image/png" };
        }
        if (item.url) {
          const base64 = await downloadAndEncodeImage(item.url);
          return { base64, mimeType: "image/png" };
        }
        throw new Error("No image data in response item");
      }),
    );
    return { images };
  }

  // Fallback: flat url/image field
  const imageUrl =
    data.url ||
    data.image ||
    data.imageUrl ||
    data.image_url;
  if (imageUrl) {
    const base64 = await downloadAndEncodeImage(imageUrl);
    return { images: [{ base64, mimeType: "image/png" }] };
  }

  throw new Error("Unified Worker: No image in response");
}

// ─── Named exports kept for backward compatibility with tool files ────────────

export async function generateImageWithStableDiffusionXL(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  logger.info("Image Gen: sdxl via unified worker");
  return generateImageViaUnifiedWorker({ ...options, model: "sdxl-1.0" });
}

export async function generateImageWithFlux1Schnell(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  logger.info("Image Gen: flux-schnell via unified worker");
  return generateImageViaUnifiedWorker({
    ...options,
    model: "flux-1-schnell",
  });
}

export async function generateImageWithJuggernautXL(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  logger.info("Image Gen: juggernaut-xl via unified worker");
  return generateImageViaUnifiedWorker({
    ...options,
    model: "juggernaut-xl",
  });
}

export async function generateImageWithFlux1Dev(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  logger.info("Image Gen: flux-1-dev via unified worker");
  return generateImageViaUnifiedWorker({ ...options, model: "flux-1-dev" });
}

export async function generateImageWithRealVisXL(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  logger.info("Image Gen: realvisxl via unified worker");
  return generateImageViaUnifiedWorker({ ...options, model: "realvisxl" });
}

export async function generateImageWithSD35(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  logger.info("Image Gen: sd-3.5 via unified worker");
  return generateImageViaUnifiedWorker({ ...options, model: "sd-3.5" });
}

export async function generateImageWithSeedream45(
  options: GenerateImageOptions & { style?: string },
): Promise<GeneratedImageResult> {
  logger.info("Image Gen: seedream-4.5 via unified worker");
  return generateImageViaUnifiedWorker({ ...options, model: "seedream-4.5" });
}

/**
 * Generic entry point — picks whatever default the worker provides
 */
export async function generateImage(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  return generateImageViaUnifiedWorker(options);
}
