import logger from "logger";

export interface EditImageOptions {
  prompt?: string;
  imageUrl: string;
  maskUrl?: string; // For object removal
  abortSignal?: AbortSignal;
}

export interface EditedImage {
  url: string;
  mimeType: string;
}

const WORKER_BASE_URL = "https://photogrid-proxy.llamai.workers.dev";

/**
 * Resolves a relative storage bridge URL to an absolute, publicly reachable URL.
 */
function resolveImageUrl(url: string): string {
  const bridgePath = "/api/storage/file/";
  if (url.includes(bridgePath)) {
    const parts = url.split(bridgePath);
    const filePath = parts[parts.length - 1];
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (filePath && botToken) {
      const resolved = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
      logger.info(`Resolved storage URL: ${url} -> ${resolved}`);
      return resolved;
    }
  }
  return url;
}

/**
 * Core function to call the PhotoGrid Worker proxy
 */
async function callPhotoGridWorker(
  endpoint: string,
  options: EditImageOptions,
  retries: number = 1, // Reduced for Hobby tier (10s limit)
): Promise<{ image: EditedImage }> {
  // Resolve the URL first so the external worker can fetch it
  options.imageUrl = resolveImageUrl(options.imageUrl);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(
        `PhotoGrid [${endpoint}]: Starting attempt ${attempt}/${retries}`,
      );

      const body: Record<string, string> = {
        image_url: options.imageUrl,
      };

      if (options.maskUrl) {
        body.mask_url = options.maskUrl;
      }

      const controller = new AbortController();
      // Use shorter timeout to stay within Vercel 10s limit (6.5s for the fetch)
      const timeoutId = setTimeout(() => controller.abort(), 6500); 

      try {
        const response = await fetch(`${WORKER_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status}${errorText ? `: ${errorText}` : ""}`,
          );
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("image")) {
          // Direct image buffer returned
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          return {
            image: {
              url: base64,
              mimeType: contentType || "image/png",
            },
          };
        } else if (contentType.includes("json")) {
          // Sometimes it returns JSON with a URL or base64
          const data = await response.json();
          const outputStr =
            data.url || data.image_url || data.image || data.result;

          if (!outputStr) {
            throw new Error(
              `No image data in JSON response: ${JSON.stringify(data)}`,
            );
          }

          if (outputStr.startsWith("http")) {
            // Fetch the image from the URL returned
            const imgRes = await fetch(outputStr);
            if (!imgRes.ok)
              throw new Error("Failed to fetch generated image URL");
            const buf = await imgRes.arrayBuffer();
            return {
              image: {
                url: Buffer.from(buf).toString("base64"),
                mimeType: imgRes.headers.get("content-type") || "image/png",
              },
            };
          } else {
            // Assume it's base64
            const cleanBase64 = outputStr.replace(
              /^data:image\/\w+;base64,/,
              "",
            );
            return {
              image: {
                url: cleanBase64,
                mimeType: "image/png",
              },
            };
          }
        } else {
          throw new Error(`Unexpected content type: ${contentType}`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `PhotoGrid [${endpoint}] attempt ${attempt} failed: ${lastError.message}`,
      );

      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt - 1) * 2000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  logger.error(`PhotoGrid [${endpoint}] failed completely:`, lastError);
  throw new Error(
    `Failed to process image after ${retries} attempts: ${lastError?.message || "Unknown error"}`,
  );
}

// ----------------------------------------------------------------------
// FEATURE EXPORTS
// ----------------------------------------------------------------------

export async function removeImageBackground(options: EditImageOptions) {
  return callPhotoGridWorker("/api/ai/remove/background", options);
}

export const removeImageWatermark = async (options: EditImageOptions) => {
  return callPhotoGridWorker("/api/ai/remove/watermark", options);
};

export const removeImageObject = async (options: EditImageOptions) => {
  return callPhotoGridWorker("/api/ai/remove/object", options);
};

export const enhanceImageQuality = async (options: EditImageOptions) => {
  return callPhotoGridWorker("/api/ai/enhance/quality", options);
};

export const applyAiStyleTransfer = async (options: EditImageOptions) => {
  return callPhotoGridWorker("/api/ai/style/transfer", options);
};

export const applySuperResolution = async (options: EditImageOptions) => {
  return callPhotoGridWorker("/api/ai/enhance/resolution", options);
};

export const restoreOldPhoto = async (options: EditImageOptions) => {
  return callPhotoGridWorker("/api/ai/restore/old-photo", options);
};

export const blurBackground = async (options: EditImageOptions) => {
  return callPhotoGridWorker("/api/ai/blur/background", options);
};

// Aliased for legacy compatibility with anime-conversion tool
export async function convertImageToAnime(options: EditImageOptions) {
  // Use AI style transfer as a drop-in replacement
  return callPhotoGridWorker("/api/ai/style/transfer", options);
}
