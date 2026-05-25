import type { NextRequest } from "next/server";
import { siteRepository } from "lib/db/repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

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

    return new Response(site.htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error serving site:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
