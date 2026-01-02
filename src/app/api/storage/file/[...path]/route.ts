import { colorize } from "consola/utils";
import globalLogger from "logger";

const logger = globalLogger.withDefaults({
  message: colorize("cyan", "Storage Proxy: "),
});

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } },
) {
  try {
    const { path } = await params;
    const filePath = path.join("/");
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      logger.error("Missing TELEGRAM_BOT_TOKEN");
      return new Response("Storage configuration error", { status: 500 });
    }

    const telegramUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    logger.info(`Proxying file request: ${filePath}`);

    const response = await fetch(telegramUrl);

    if (!response.ok) {
      logger.error(
        `Failed to fetch from Telegram: ${response.status} url: ${telegramUrl}`,
      );
      return new Response("File not found", { status: 404 });
    }

    // Proxy the response with original headers
    const blob = await response.blob();
    const headers = new Headers();

    // Copy relevant headers
    const contentType = response.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);

    const contentLength = response.headers.get("Content-Length");
    if (contentLength) headers.set("Content-Length", contentLength);

    // Set cache control for performance
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // If it's a document/pdf, suggest a filename if possible
    const filename = filePath.split("/").pop();
    if (filename) {
      headers.set("Content-Disposition", `inline; filename="${filename}"`);
    }

    return new Response(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error("Proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
