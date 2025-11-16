"use server";
import {
  GoogleGenAI,
  Part as GeminiPart,
  Content as GeminiMessage,
} from "@google/genai";
import { safe, watchError } from "ts-safe";
import { getBase64Data } from "lib/file-storage/storage-utils";
import { serverFileStorage } from "lib/file-storage";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";

import {
  FilePart,
  ImagePart,
  ModelMessage,
  TextPart,
  experimental_generateImage,
} from "ai";
import { isString } from "lib/utils";
import logger from "logger";

type GenerateImageOptions = {
  messages?: ModelMessage[];
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

export async function generateImageWithOpenAI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  return experimental_generateImage({
    model: openai.image("gpt-image-1-mini"),
    abortSignal: options.abortSignal,
    prompt: options.prompt,
  }).then((res) => {
    return {
      images: res.images.map((v) => {
        const item: GeneratedImage = {
          base64: Buffer.from(v.uint8Array).toString("base64"),
          mimeType: v.mediaType,
        };
        return item;
      }),
    };
  });
}

export async function generateImageWithXAI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  return experimental_generateImage({
    model: xai.image("grok-2-image"),
    abortSignal: options.abortSignal,
    prompt: options.prompt,
  }).then((res) => {
    return {
      images: res.images.map((v) => ({
        base64: Buffer.from(v.uint8Array).toString("base64"),
        mimeType: v.mediaType,
      })),
    };
  });
}

export const generateImageWithNanoBanana = async (
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const geminiMessages: GeminiMessage[] = await safe(options.messages || [])
    .map((messages) => Promise.all(messages.map(convertToGeminiMessage)))
    .watch(watchError(logger.error))
    .unwrap();
  if (options.prompt) {
    geminiMessages.push({
      role: "user",
      parts: [{ text: options.prompt }],
    });
  }
  const response = await ai.models
    .generateContent({
      model: "gemini-2.5-flash-image",
      config: {
        abortSignal: options.abortSignal,
        responseModalities: ["IMAGE"],
      },
      contents: geminiMessages,
    })
    .catch((err) => {
      logger.error(err);
      throw err;
    });
  return (
    response.candidates?.reduce(
      (acc, candidate) => {
        const images =
          candidate.content?.parts
            ?.filter((part) => part.inlineData)
            .map((p) => ({
              base64: p.inlineData!.data!,
              mimeType: p.inlineData!.mimeType,
            })) ?? [];
        acc.images.push(...images);
        return acc;
      },
      { images: [] as GeneratedImage[] },
    ) || { images: [] as GeneratedImage[] }
  );
};

async function convertToGeminiMessage(
  message: ModelMessage,
): Promise<GeminiMessage> {
  const getBase64DataSmart = async (input: {
    data: string | Uint8Array | ArrayBuffer | Buffer | URL;
    mimeType: string;
  }): Promise<{ data: string; mimeType: string }> => {
    if (
      typeof input.data === "string" &&
      (input.data.startsWith("http://") || input.data.startsWith("https://"))
    ) {
      // Try fetching directly (public URLs)
      try {
        const resp = await fetch(input.data);
        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer());
          return { data: buf.toString("base64"), mimeType: input.mimeType };
        }
      } catch {
        // fall through to storage fallback
      }

      // Fallback: derive key and download via storage backend (works for private buckets)
      try {
        const u = new URL(input.data as string);
        const key = decodeURIComponent(u.pathname.replace(/^\//, ""));
        const buf = await serverFileStorage.download(key);
        return { data: buf.toString("base64"), mimeType: input.mimeType };
      } catch {
        // Ignore and fall back to generic helper below
      }
    }

    // Default fallback: use generic helper (handles base64, buffers, blobs, etc.)
    return getBase64Data(input);
  };
  const parts = isString(message.content)
    ? ([{ text: message.content }] as GeminiPart[])
    : await Promise.all(
        message.content.map(async (content) => {
          if (content.type == "file") {
            const part = content as FilePart;
            const data = await getBase64DataSmart({
              data: part.data,
              mimeType: part.mediaType!,
            });
            return {
              inlineData: data,
            } as GeminiPart;
          }
          if (content.type == "text") {
            const part = content as TextPart;
            return {
              text: part.text,
            };
          }
          if (content.type == "image") {
            const part = content as ImagePart;
            const data = await getBase64DataSmart({
              data: part.image,
              mimeType: part.mediaType!,
            });
            return {
              inlineData: data,
            };
          }
          return null;
        }),
      )
        .then((parts) => parts.filter(Boolean) as GeminiPart[])
        .catch((err) => {
          logger.withTag("convertToGeminiMessage").error(err);
          throw err;
        });

  return {
    role: message.role == "user" ? "user" : "model",
    parts,
  };
}

/**
 * Generate images using IMG-CV API (Ultra-realistic, fastest)
 */
export async function generateImageWithImgCV(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const formData = new URLSearchParams();
    formData.append("text", options.prompt);

    const response = await fetch("https://sii3.top/api/img-cv.php", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.url;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    // Fetch the image and convert to base64
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
  } catch (error) {
    logger.error("IMG-CV generation failed:", error);
    throw new Error(`Failed to generate image with IMG-CV: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate images using Flux-Max API
 */
export async function generateImageWithFluxMax(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const formData = new URLSearchParams();
    formData.append("prompt", options.prompt);

    const response = await fetch("https://sii3.top/api/flux-max.php", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.response;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      images: [
        {
          base64,
          mimeType: "image/jpeg",
        },
      ],
    };
  } catch (error) {
    logger.error("Flux-Max generation failed:", error);
    throw new Error(`Failed to generate image with Flux-Max: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate images using GPT-Imager API
 */
export async function generateImageWithGPTImager(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const formData = new URLSearchParams();
    formData.append("text", options.prompt);

    const response = await fetch("https://sii3.top/api/gpt-img.php", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.url;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    // Fetch the image and convert to base64
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
  } catch (error) {
    logger.error("GPT-Imager generation failed:", error);
    throw new Error(`Failed to generate image with GPT-Imager: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate images using Imagen-3 API
 */
export async function generateImageWithImagen3(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const formData = new URLSearchParams();
    formData.append("text", options.prompt);
    formData.append("aspect_ratio", "1:1");
    formData.append("style", "Auto");

    const response = await fetch("https://sii3.top/api/imagen-3.php", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.image;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      images: [
        {
          base64,
          mimeType: "image/webp",
        },
      ],
    };
  } catch (error) {
    logger.error("Imagen-3 generation failed:", error);
    throw new Error(`Failed to generate image with Imagen-3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate images using Nano-Banana API
 */
export async function generateImageWithNanoBananaAPI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const formData = new URLSearchParams();
    formData.append("text", options.prompt);

    logger.info(`Nano-Banana: Sending request with timeout of 180 seconds...`);

    // Use AbortController with 180 second timeout (Nano-Banana is slow, ~115s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds

    try {
      const response = await fetch("https://sii3.top/api/nano-banana.php", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.image;

      if (!imageUrl) {
        throw new Error("No image URL in response");
      }

      logger.info(`Nano-Banana: Image generated, downloading from ${imageUrl}...`);

      // Fetch the image and convert to base64
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      logger.info(`Nano-Banana: Image successfully converted to base64`);

      return {
        images: [
          {
            base64,
            mimeType: "image/jpeg",
          },
        ],
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    logger.error("Nano-Banana generation failed:", error);
    throw new Error(`Failed to generate image with Nano-Banana: ${error instanceof Error ? error.message : String(error)}`);
  }
}

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
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sdxl-1.0",
          prompt: options.prompt,
          size: "1024x1024",
        }),
        signal: options.abortSignal,
      }
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
    throw new Error(`Failed to generate image with Stable Diffusion XL: ${error instanceof Error ? error.message : String(error)}`);
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
    throw new Error(`Failed to generate image with Chalk: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateImageWithMemeAPI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  try {
    const payload = new URLSearchParams();
    payload.append("text", options.prompt);

    logger.info(`Meme: Sending request with text: "${options.prompt}"...`);

    const response = await fetch("https://sii3.top/api/meme.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.response || data.image || data.url;

    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    logger.info(`Meme: Image generated, downloading from ${imageUrl}...`);

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    logger.info(`Meme: Image successfully converted to base64`);

    return {
      images: [
        {
          base64,
          mimeType: "image/png",
        },
      ],
    };
  } catch (error) {
    logger.error("Meme generation failed:", error);
    throw new Error(`Failed to generate image with Meme: ${error instanceof Error ? error.message : String(error)}`);
  }
}
