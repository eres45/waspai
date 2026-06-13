import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.BETTER_AUTH_URL || "https://waspai.in";

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/features", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/workflows", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/ai-agents", priority: 0.9, changeFrequency: "weekly" as const },
    {
      path: "/subscription",
      priority: 0.8,
      changeFrequency: "weekly" as const,
    },
    { path: "/changelog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/status", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/refund", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/shipping", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/sign-in", priority: 0.8, changeFrequency: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
