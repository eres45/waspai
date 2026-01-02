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

export async function generateImageWithChalkAPI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const payload = {
      text: options.prompt,
    };

    logger.info(`Chalk: Sending request with text: "${options.prompt}"...`);

    const response = await fetch("https://vetrex.x10.mx/api/chalk.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.image || data.url;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    logger.info(`Chalk: Image generated, downloading from ${imageUrl}...`);

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    logger.info(`Chalk: Image successfully converted to base64`);

    return {
      images: [
        {
          base64,
          mimeType: "image/png",
        },
      ],
    };
  } catch (error) {
    logger.error("Chalk generation failed:", error);
    throw new Error(
      `Failed to generate image with Chalk: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate images using Infip (GhostAPI)
 * Supports: img3, img4, qwen, nano-banana, flux-schnell, lucid-origin, phoenix, sdxl, sdxl-lite
 */
export async function generateImageWithInfip(
  options: GenerateImageOptions & { model: string },
): Promise<GeneratedImageResult> {
  const apiKey = process.env.INFIP_API_KEY;
  if (!apiKey) {
    throw new Error("INFIP_API_KEY is not set");
  }

  try {
    logger.info(`Infip: Generating image with model ${options.model}...`);

    const response = await fetch(
      "https://api.infip.pro/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options.model,
          prompt: options.prompt,
          n: 1,
          size: "1024x1024",
        }),
        signal: options.abortSignal,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Check for b64_json (OpenAI format)
    if (data.data && data.data.length > 0 && data.data[0].b64_json) {
      return {
        images: data.data.map((item: any) => ({
          base64: item.b64_json,
          mimeType: "image/png", // Assuming PNG, or check if API returns format
        })),
      };
    }
    // Fallback if API returns 'url' despite 'b64_json' request (some APIs behave oddly)
    else if (data.data && data.data.length > 0 && data.data[0].url) {
      logger.info(`Infip: API returned URL, downloading...`);
      const imageUrl = data.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return {
        images: [
          {
            base64,
            mimeType: "image/png",
          },
        ],
      };
    }

    throw new Error("Invalid response format from Infip API");
  } catch (error) {
    logger.error(`Infip generation failed (${options.model}):`, error);
    throw new Error(
      `Failed to generate image with ${options.model}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
