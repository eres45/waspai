import type { NextRequest } from "next/server";
import { siteRepository } from "lib/db/repository";

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
      return "text/html; charset=utf-8";
    case "css":
      return "text/css; charset=utf-8";
    case "js":
    case "mjs":
      return "application/javascript; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "text/plain; charset=utf-8";
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; path?: string[] }> },
) {
  const { slug, path } = await params;

  try {
    const site = await siteRepository.getSiteBySlug(slug);

    if (!site) {
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <title>Site Not Found</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b0f19; color: #f3f4f6; }
    h1 { color: #f3f4f6; font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #9ca3af; margin-top: 0; }
  </style>
</head>
<body>
  <h1>404 - Site Not Found</h1>
  <p>The site you are looking for does not exist or has been deleted.</p>
</body>
</html>`,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        },
      );
    }

    // Fire-and-forget increment view count
    siteRepository.incrementViewCount(slug).catch((err) => {
      console.error("Failed to increment view count:", err);
    });

    // Resolve file path
    const filePath = path && path.length > 0 ? path.join("/") : "index.html";

    // Try finding exact file in DB
    let file = await siteRepository.getSiteFileByPath(site.id, filePath);

    // Clean URL fallback: e.g. /about -> /about.html
    if (!file && !filePath.includes(".") && !filePath.endsWith(".html")) {
      file = await siteRepository.getSiteFileByPath(
        site.id,
        `${filePath}.html`,
      );
    }

    // If still not found and path resolves to index.html, serve the main site content (backward compatibility)
    if (!file && (filePath === "index.html" || filePath === "index.htm")) {
      return new Response(site.htmlContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    }

    // If still not found, return 404
    if (!file) {
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <title>File Not Found</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b0f19; color: #f3f4f6; }
    h1 { color: #f3f4f6; font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #9ca3af; margin-top: 0; }
  </style>
</head>
<body>
  <h1>404 - File Not Found</h1>
  <p>The file "${filePath}" could not be found on this site.</p>
</body>
</html>`,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        },
      );
    }

    // Serve the file
    return new Response(file.content, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || getMimeType(filePath),
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error serving site file:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
