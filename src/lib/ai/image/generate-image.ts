"use server";

import { CREATIVE_WORKER_URL } from "../models";

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

const IMAGE_ENDPOINT = `${CREATIVE_WORKER_URL}/v1/images/generations`;

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

  let modelId = options.model;

  if (
    modelId &&
    (modelId.toLowerCase() === "magic-studio" ||
      modelId.toLowerCase() === "magicstudio")
  ) {
    const url = `https://magic-studio.ziddi-beatz.workers.dev/?prompt=${encodeURIComponent(options.prompt)}`;
    const response = await fetchWithRetry(url, {
      method: "GET",
      signal: options.abortSignal,
    });
    if (!response.ok) {
      throw new Error(`Magic Studio image gen failed: HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return {
      images: [
        {
          base64: Buffer.from(buffer).toString("base64"),
          mimeType: "image/png",
        },
      ],
    };
  }
  if (modelId) {
    const rawModelLower = modelId.toLowerCase();

    // Direct mappings
    const legacyMapping: Record<string, string> = {
      // Flux variants
      "flux-1-schnell": "flux-schnell",
      "flux-1-dev": "flux",
      "flux-1-pro": "flux-pro",
      "flux-pro": "flux-pro",
      // Other models mapping proxy name to real worker ID
      "sd-3-5": "sd-3.5",
      "realvisxl-v4": "realvisxl-v4",
      "juggernaut-xl": "juggernaut-xl",
      "seedream-4-5": "seedream-4.5",
      "sdxl-v1-0": "sdxl-1.0",
    };

    // Robust normalized mappings (lowercase, alphanumeric characters only)
    const normalizedMapping: Record<string, string> = {
      flux1schnell: "flux-schnell",
      fluxschnell: "flux-schnell",
      flux1dev: "flux",
      fluxdev: "flux",
      flux1pro: "flux-pro",
      fluxpro: "flux-pro",
      sd35: "sd-3.5",
      stablediffusion35: "sd-3.5",
      realvisxlv4: "realvisxl-v4",
      realvisxl: "realvisxl-v4",
      juggernautxl: "juggernaut-xl",
      juggernaut: "juggernaut-xl",
      seedream45: "seedream-4.5",
      seedream: "seedream-4.5",
      sdxlv10: "sdxl-1.0",
      sdxl: "sdxl-1.0",
    };

    const normKey = rawModelLower.replace(/[^a-z0-9]/g, "");

    if (legacyMapping[modelId]) {
      modelId = legacyMapping[modelId];
    } else if (legacyMapping[rawModelLower]) {
      modelId = legacyMapping[rawModelLower];
    } else if (normalizedMapping[normKey]) {
      modelId = normalizedMapping[normKey];
    }

    body.model = modelId;
  }

  const response = await fetchWithRetry(IMAGE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.abortSignal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(
      `Unified Worker image gen failed: HTTP ${response.status} — ${errText}`,
    );
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
  const imageUrl = data.url || data.image || data.imageUrl || data.image_url;
  if (imageUrl) {
    const base64 = await downloadAndEncodeImage(imageUrl);
    return { images: [{ base64, mimeType: "image/png" }] };
  }

  throw new Error("Unified Worker: No image in response");
}

/**
 * Generic entry point — routes through the unified worker
 */
export async function generateImage(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  return generateImageViaUnifiedWorker(options);
}
