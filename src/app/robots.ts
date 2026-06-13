import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.BETTER_AUTH_URL || "https://waspai.in";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/private/",
        "/chat/",
        "/projects/",
        "/skills/",
        "/mcp/",
        "/music-gen/",
        "/sites/",
        "/checkout/",
        "/store/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
