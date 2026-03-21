"use server";

import logger from "logger";

type GenerateImageOptions = {
  // messages?: ModelMessage[]; // Unused in kept functions
  prompt: string;
  abortSignal?: AbortSignal;
};

type GeneratedImage = {
  base64: string;
  mimeType?: string;
};

export type GeneratedImageResult = {
  images: GeneratedImage[];
};

/**
 * Generate images using Stable Diffusion XL API
 */
export async function generateImageWithStableDiffusionXL(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const apiKey = process.env.STABLE_DIFFUSION_API_KEY || "At41rv-API-Image";

    const response = await fetch(
      "https://image-api.at41rvplayzz.workers.dev/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sdxl-1.0",
          prompt: options.prompt,
          size: "1024x1024",
        }),
        signal: options.abortSignal,
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // API returns raw image data directly (PNG)
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      images: [
        {
          base64,
          mimeType: "image/png",
        },
      ],
    };
  } catch (error) {
    logger.error("Stable Diffusion XL generation failed:", error);
    throw new Error(
      `Failed to generate image with Stable Diffusion XL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Helper to download image from URL and convert to base64
 */
async function downloadAndEncodeImage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to download image: ${response.status}`);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/**
 * Generate images using FLUX.1 Schnell
 */
export async function generateImageWithFlux1Schnell(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const url = `https://ai-images-proxy.llamai.workers.dev/?prompt=${encodeURIComponent(options.prompt)}`;
    logger.info(`FLUX.1 Schnell: Sending request...`);

    // The worker might respond with JSON containing the URL or just the image
    const response = await fetch(url, {
      method: "POST",
      signal: options.abortSignal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Check Content-Type to see if it's already an image or JSON
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("image")) {
      const buffer = await response.arrayBuffer();
      return {
        images: [
          {
            base64: Buffer.from(buffer).toString("base64"),
            mimeType: contentType,
          },
        ],
      };
    }

    const data = await response.json();
    const imageUrl = data.url || data.image || data.imageUrl;
    if (!imageUrl) throw new Error("No image URL in response");

    const base64 = await downloadAndEncodeImage(imageUrl);
    return { images: [{ base64, mimeType: "image/png" }] };
  } catch (error) {
    logger.error("FLUX.1 Schnell failed:", error);
    throw new Error(
      `Failed to generate image with FLUX.1 Schnell: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate images using Juggernaut XL
 */
export async function generateImageWithJuggernautXL(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const url = `https://image-world-king-proxy.llamai.workers.dev/?prompt=${encodeURIComponent(options.prompt)}`;
    const response = await fetch(url, {
      method: "POST",
      signal: options.abortSignal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("image")) {
      const buffer = await response.arrayBuffer();
      return {
        images: [
          {
            base64: Buffer.from(buffer).toString("base64"),
            mimeType: contentType,
          },
        ],
      };
    }

    const data = await response.json();
    const imageUrl = data.url || data.image;
    if (!imageUrl) throw new Error("No image URL in response");

    const base64 = await downloadAndEncodeImage(imageUrl);
    return { images: [{ base64, mimeType: "image/png" }] };
  } catch (error) {
    logger.error("Juggernaut XL failed:", error);
    throw new Error(
      `Failed to generate image with Juggernaut XL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate images using FLUX.1 Dev
 */
export async function generateImageWithFlux1Dev(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const response = await fetch(
      "https://runware-image-worker.llamai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: options.prompt,
          outputType: "URL",
        }),
        signal: options.abortSignal,
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const imageUrl = data.url || data.image || (data.data && data.data[0]?.url);
    if (!imageUrl) throw new Error("No image URL in response");

    const base64 = await downloadAndEncodeImage(imageUrl);
    return { images: [{ base64, mimeType: "image/png" }] };
  } catch (error) {
    logger.error("FLUX.1 Dev failed:", error);
    throw new Error(
      `Failed to generate image with FLUX.1 Dev: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate images using RealVisXL v4
 */
export async function generateImageWithRealVisXL(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const response = await fetch(
      "https://mu-devs-image-worker.llamai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: options.prompt }),
        signal: options.abortSignal,
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const imageUrl = data.url || data.image;
    if (!imageUrl) throw new Error("No image URL in response");

    const base64 = await downloadAndEncodeImage(imageUrl);
    return { images: [{ base64, mimeType: "image/png" }] };
  } catch (error) {
    logger.error("RealVisXL failed:", error);
    throw new Error(
      `Failed to generate image with RealVisXL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate images using Stable Diffusion 3.5
 */
export async function generateImageWithSD35(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const response = await fetch("https://aitubo.llamai.workers.dev/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: options.prompt, count: 1 }),
      signal: options.abortSignal,
    });

    if (!response.ok)
      throw new Error(`Initial request failed: HTTP ${response.status}`);
    const initData = await response.json();
    const id = initData.id;
    if (!id) throw new Error("No generation ID returned");

    // Polling
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `https://aitubo.llamai.workers.dev/status?id=${id}`,
      );
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (
          statusData.status === "completed" ||
          statusData.state === "completed"
        ) {
          const imageUrl =
            statusData.url || (statusData.images && statusData.images[0]?.url);
          if (imageUrl) {
            const base64 = await downloadAndEncodeImage(imageUrl);
            return { images: [{ base64, mimeType: "image/png" }] };
          }
        } else if (statusData.status === "failed") {
          throw new Error("Generation failed on server");
        }
      }
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error("Generation timed out");
  } catch (error) {
    logger.error("SD 3.5 failed:", error);
    throw new Error(
      `Failed to generate image with Stable Diffusion 3.5: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate images using Seedream 4.5
 */
export async function generateImageWithSeedream45(
  options: GenerateImageOptions & { style?: string },
): Promise<GeneratedImageResult> {
  try {
    const response = await fetch(
      "https://raphaelai.llamai.workers.dev/v1/images/generations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: options.prompt,
          style: options.style || "None",
        }),
        signal: options.abortSignal,
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const imageUrl = data.url || data.image || (data.data && data.data[0]?.url);
    if (!imageUrl) throw new Error("No image URL in response");

    const base64 = await downloadAndEncodeImage(imageUrl);
    return { images: [{ base64, mimeType: "image/png" }] };
  } catch (error) {
    logger.error("Seedream 4.5 failed:", error);
    throw new Error(
      `Failed to generate image with Seedream 4.5: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
