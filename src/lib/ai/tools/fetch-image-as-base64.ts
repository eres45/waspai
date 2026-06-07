import { tool as createTool } from "ai";
import { z } from "zod";
import logger from "logger";

/**
 * fetch_image_as_base64
 *
 * Fetches an image from a URL (e.g. a CDN URL returned by image-manager)
 * and converts it into a base64 data URI string.
 *
 * This is essential for embedding AI-generated images directly inside a
 * single self-contained HTML file (used by html_preview), since sandboxed
 * iframes cannot load cross-origin resources.
 *
 * Usage flow:
 *   1. Call image-manager → get CDN URL
 *   2. Call fetch_image_as_base64(url) → get "data:image/png;base64,..."
 *   3. Embed the data URI directly in <img src="..."> or Canvas drawImage()
 *   4. Call html_preview with the complete self-contained HTML
 */
export const fetchImageAsBase64Tool = createTool({
  name: "fetch_image_as_base64",
  description:
    "Fetches an image from a URL and converts it to a base64 data URI (e.g. 'data:image/png;base64,...'). " +
    "Use this AFTER calling image-manager to get the CDN URL of a generated image. " +
    "The returned data URI can be embedded directly inside HTML/CSS/JS code so it works " +
    "in a self-contained html_preview without any external network requests. " +
    "Always call this for every image you want to use inside an html_preview game or web app.",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe(
        "The image URL to fetch and convert to base64. This should be the CDN URL " +
          "returned by the image-manager tool.",
      ),
    label: z
      .string()
      .optional()
      .describe(
        "Optional label for this image (e.g. 'player_sprite', 'background', 'obstacle'). " +
          "Used for logging only.",
      ),
  }),
  execute: async ({ url, label }) => {
    const tag = label ? `[${label}]` : "[image]";
    logger.info(`[fetch_image_as_base64] Fetching ${tag}: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          // Some CDNs require a user-agent
          "User-Agent": "WaspAI/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText} when fetching ${url}`,
        );
      }

      const contentType = response.headers.get("content-type") || "image/png";

      // Normalise MIME type — strip any charset suffixes
      const mimeType = contentType.split(";")[0].trim();

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");

      const dataUri = `data:${mimeType};base64,${base64}`;

      logger.info(
        `[fetch_image_as_base64] ${tag} converted — ` +
          `${(buffer.length / 1024).toFixed(1)} KB → data URI (${mimeType})`,
      );

      return {
        success: true,
        dataUri,
        mimeType,
        sizeKb: Math.round(buffer.length / 1024),
        label: label ?? null,
        guide:
          `SUCCESS: The image has been converted to a base64 data URI. ` +
          `Use the 'dataUri' value directly as the src attribute of an <img> tag ` +
          `or as the source for a Canvas Image object inside your HTML. ` +
          `Example: <img src="${dataUri.slice(0, 40)}..." /> ` +
          `or: const img = new Image(); img.src = dataUri;`,
      };
    } catch (err: any) {
      logger.error(`[fetch_image_as_base64] Failed to fetch ${url}:`, err);
      return {
        success: false,
        dataUri: null,
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
