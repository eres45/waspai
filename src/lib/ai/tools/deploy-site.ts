import { tool as createTool } from "ai";
import { z } from "zod";
import { getSession } from "auth/server";
import { siteRepository } from "lib/db/repository";
import { nanoid } from "nanoid";

const RESERVED_SLUGS = new Set([
  "www",
  "admin",
  "api",
  "site",
  "status",
  "landing",
  "auth",
  "main",
  "dev",
  "prod",
  "staging",
  "test",
  "mail",
  "blog",
  "ping",
]);

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || "site"}-${randomSuffix}`;
}

export const deploySiteTool = createTool({
  description: `Deploy a generated HTML website/app to a live public URL at *.waspai.in.
Use this whenever you finish building a website, landing page, app, or any HTML content.
The site will be instantly live and shareable. Always use self-contained HTML with all
CSS and JS inline — no external frameworks or CDN dependencies that might break.`,
  inputSchema: z.object({
    title: z.string().describe("Human-readable site title"),
    html: z
      .string()
      .describe(
        "Complete self-contained HTML document (inline all CSS and JS)",
      ),
    description: z.string().optional().describe("Brief site description"),
    slug: z
      .string()
      .optional()
      .describe(
        "Custom URL slug (lowercase, hyphens only). Auto-generated if omitted.",
      ),
  }),
  execute: async ({ title, html, description, slug }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to deploy sites.",
      };
    }

    try {
      // Check size limit (2MB)
      if (Buffer.byteLength(html, "utf-8") > 2 * 1024 * 1024) {
        return { success: false, error: "Payload exceeds 2MB limit." };
      }

      let finalSlug = slug;
      if (finalSlug) {
        finalSlug = finalSlug.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
        if (RESERVED_SLUGS.has(finalSlug)) {
          return {
            success: false,
            error: `The subdomain "${finalSlug}" is reserved.`,
          };
        }
        const existing = await siteRepository.getSiteBySlug(finalSlug);
        if (existing && existing.authorId !== session.user.id) {
          return {
            success: false,
            error: `The subdomain "${finalSlug}" is already taken.`,
          };
        }
      } else {
        // Auto-generate slug
        let attempts = 0;
        while (attempts < 5) {
          finalSlug = generateSlug(title);
          const existing = await siteRepository.getSiteBySlug(finalSlug);
          if (!existing) break;
          attempts++;
        }
        if (!finalSlug) {
          finalSlug = `site-${nanoid(6).toLowerCase()}`;
        }
      }

      if (RESERVED_SLUGS.has(finalSlug)) {
        finalSlug = `${finalSlug}-${nanoid(4).toLowerCase()}`;
      }

      const deployedSite = await siteRepository.createSite({
        slug: finalSlug,
        title,
        description,
        htmlContent: html,
        authorId: session.user.id,
      });

      const isDev = process.env.NODE_ENV === "development";
      const baseDomain = isDev ? "localhost:3000" : "waspai.in";
      const liveUrl = `https://${finalSlug}.${baseDomain}`;

      return {
        success: true,
        id: deployedSite.id,
        slug: deployedSite.slug,
        url: liveUrl,
        message: `Successfully deployed "${title}"! It is now live at ${liveUrl}`,
      };
    } catch (err: any) {
      console.error("[deploySiteTool] Error:", err);
      return { success: false, error: err.message || "Failed to deploy site" };
    }
  },
});
