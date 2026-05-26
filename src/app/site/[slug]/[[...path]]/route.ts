import type { NextRequest } from "next/server";
import { siteRepository } from "lib/db/repository";

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
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

// Common headers for all asset responses
function assetHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    "Access-Control-Allow-Origin": "*",
  };
}

function notFoundHtml(message: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Not Found</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b0f19; color: #f3f4f6; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #9ca3af; margin-top: 0; }
  </style>
</head>
<body>
  <h1>404</h1>
  <p>${message}</p>
</body>
</html>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; path?: string[] }> },
) {
  const { slug, path } = await params;

  try {
    const site = await siteRepository.getSiteBySlug(slug);

    if (!site) {
      return new Response(notFoundHtml("Site not found or has been deleted."), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Resolve file path — root request → index.html
    const cleanPath = path ? path.filter(Boolean) : [];
    const filePath = cleanPath.length > 0 ? cleanPath.join("/") : "index.html";

    const isRootRequest = filePath === "index.html" || filePath === "index.htm";

    // Only increment view count on the root HTML page, not for every asset
    if (isRootRequest) {
      siteRepository.incrementViewCount(slug).catch(() => {});
    }

    // 1. Try finding exact file in deployed_site_file
    let file = await siteRepository.getSiteFileByPath(site.id, filePath);

    // 2. Clean URL fallback: /about → /about.html
    if (!file && !filePath.includes(".")) {
      file = await siteRepository.getSiteFileByPath(
        site.id,
        `${filePath}.html`,
      );
    }

    // 3. For root requests, fall back to html_content (backward compat with old single-file deployments)
    if (!file && isRootRequest && site.htmlContent) {
      return new Response(site.htmlContent, {
        status: 200,
        headers: assetHeaders("text/html; charset=utf-8"),
      });
    }

    // 4. File not found
    if (!file) {
      return new Response(
        notFoundHtml(`File &quot;${filePath}&quot; not found on this site.`),
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    // 5. Serve file with correct MIME type
    const mimeType = file.mimeType || getMimeType(filePath);
    return new Response(file.content, {
      status: 200,
      headers: assetHeaders(mimeType),
    });
  } catch (error) {
    console.error("[site route] Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
