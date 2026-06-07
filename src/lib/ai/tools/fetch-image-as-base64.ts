import { tool as createTool } from "ai";
import { z } from "zod";
import logger from "logger";
import { storeImage } from "./image-cache";

/**
 * fetch_image_as_base64
 *
 * Fetches an image from a URL (e.g. a CDN URL returned by image-manager)
 * and stores it in the server-side image cache.
 *
 * IMPORTANT: This tool does NOT return the base64 string in the tool result.
 * Instead it stores the data server-side and returns a short ref token like
 * "wsp-img://abc123". The AI must use this token as-is in HTML src attributes.
 * The html_preview tool automatically resolves these tokens to real base64
 * before rendering.
 *
 * Why: Returning 350KB+ of base64 in the tool result adds it to the model's
 * message history. On the next turn, the full history (including the giant
 * base64) is sent to the model, blowing past the context window and causing:
 * "max_tokens must be at least 1, got -XXXXXX"
 */
export const fetchImageAsBase64Tool = createTool({
  name: "fetch_image_as_base64",
  description:
    "Fetches an image from a URL and stores it in a server-side cache, " +
    "returning a short reference token (e.g. 'wsp-img://abc123'). " +
    "Use this AFTER calling image-manager to get the CDN URL of a generated image. " +
    "Place the returned imageRef token directly as the src of an <img> tag " +
    "or as a JS variable value — the preview system will automatically " +
    "replace it with the real base64 data URI before rendering. " +
    "NEVER try to read or copy the base64 data yourself — just use the token.",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe(
        "The image URL to fetch and cache. Should be the CDN URL " +
          "returned by the image-manager tool.",
      ),
    label: z
      .string()
      .optional()
      .describe(
        "Short label for this image (e.g. 'player_sprite', 'background', 'obstacle'). " +
          "Used as a hint when writing HTML — name your JS variable after this label.",
      ),
  }),
  execute: async ({ url, label }) => {
    const tag = label ? `[${label}]` : "[image]";
    logger.info(`[fetch_image_as_base64] Fetching ${tag}: ${url}`);

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "WaspAI/1.0" },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} fetching ${url}`,
        );
      }

      const contentType = response.headers.get("content-type") || "image/png";
      const mimeType = contentType.split(";")[0].trim();

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64}`;
      const sizeKb = Math.round(buffer.length / 1024);

      // Store in server-side cache — returns a short token, NOT the base64 itself
      const imageRef = storeImage(dataUri, mimeType, sizeKb, label ?? null);

      logger.info(
        `[fetch_image_as_base64] ${tag} cached — ${sizeKb} KB → ${imageRef}`,
      );

      return {
        success: true,
        imageRef,
        mimeType,
        sizeKb,
        label: label ?? null,
        guide:
          `SUCCESS: Image cached as ${imageRef}. ` +
          `Use this token directly in your HTML — do NOT copy the base64 data. ` +
          `Example: <img src="${imageRef}" /> ` +
          `or in JS: const img = new Image(); img.src = "${imageRef}"; ` +
          `The preview system will automatically swap the token for the real image.`,
      };
    } catch (err: any) {
      logger.error(`[fetch_image_as_base64] Failed to fetch ${url}:`, err);
      return {
        success: false,
        imageRef: null,
        mimeType: null,
        sizeKb: null,
        label: label ?? null,
        guide:
          `FAILED to fetch the image: ${err.message || String(err)}. ` +
          `Draw the asset programmatically using SVG or HTML5 Canvas instead.`,
      };
    }
  },
});
