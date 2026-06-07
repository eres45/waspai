import { tool as createTool } from "ai";
import { z } from "zod";
import { getSession } from "auth/server";
import { siteRepository, archiveRepository } from "lib/db/repository";
import { nanoid } from "nanoid";
import { resolveImageRefs } from "./image-cache";

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
  description: `Deploy a website/app (single-file or multi-file project) to a live public URL at *.waspai.in.
Use this whenever you finish building a website, landing page, app, or any HTML/CSS/JS content.
For multi-file sites, pass the optional "files" parameter with relative file paths (e.g. index.html, css/style.css) and their code contents.
Ensure that the entrypoint HTML page is located at "index.html".`,
  inputSchema: z.object({
    title: z.string().describe("Human-readable site title"),
    html: z
      .string()
      .optional()
      .describe(
        "Complete HTML content (only required for single-file deployments)",
      ),
    description: z.string().optional().describe("Brief site description"),
    slug: z
      .string()
      .optional()
      .describe(
        "Custom URL slug (lowercase, hyphens only). Auto-generated if omitted.",
      ),
    projectId: z
      .string()
      .uuid()
      .optional()
      .describe("Optional project folder UUID to link this deployment to."),
    threadId: z
      .string()
      .optional()
      .describe(
        "Optional chat thread UUID. If provided, we automatically link this deployment to the project containing this thread.",
      ),
    files: z
      .array(
        z.object({
          path: z
            .string()
            .describe(
              "Relative file path, e.g. 'index.html' or 'css/styles.css'",
            ),
          content: z.string().describe("Raw text content of the file"),
        }),
      )
      .optional()
      .describe("Optional list of files for multi-file deployments."),
  }),
  execute: async ({
    title,
    html,
    description,
    slug,
    projectId,
    threadId,
    files,
  }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to deploy sites.",
      };
    }

    try {
      // Resolve wsp-img:// tokens → real base64 data URIs
      const resolvedHtml = html ? resolveImageRefs(html) : undefined;
      const resolvedFiles = files?.map((f) => ({
        ...f,
        content: resolveImageRefs(f.content),
      }));

      const defaultHtml =
        resolvedHtml ||
        resolvedFiles?.find(
          (f) => f.path === "index.html" || f.path === "/index.html",
        )?.content ||
        "";

      let totalBytes = Buffer.byteLength(defaultHtml, "utf-8");
      if (resolvedFiles && resolvedFiles.length > 0) {
        totalBytes = resolvedFiles.reduce(
          (acc, f) => acc + Buffer.byteLength(f.content, "utf-8"),
          0,
        );
      }

      // Check size limit (2MB)
      if (totalBytes > 2 * 1024 * 1024) {
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

      // Resolve projectId using threadId if not explicitly provided
      let finalProjectId = projectId;
      if (!finalProjectId && threadId) {
        const folders = await archiveRepository.getItemArchives(
          threadId,
          session.user.id,
        );
        if (folders && folders.length > 0) {
          finalProjectId = folders[0].id;
        }
      }

      const deployedSite = await siteRepository.createSite({
        slug: finalSlug,
        title,
        description,
        htmlContent: defaultHtml,
        authorId: session.user.id,
        projectId: finalProjectId,
      });

      // Save files to the database
      if (resolvedFiles && resolvedFiles.length > 0) {
        await siteRepository.upsertSiteFiles(deployedSite.id, resolvedFiles);
      } else {
        await siteRepository.upsertSiteFiles(deployedSite.id, [
          { path: "index.html", content: defaultHtml },
        ]);
      }

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
      console.error(
        "[deploySiteTool] Full error:",
        JSON.stringify(err, null, 2),
      );
      // Supabase errors have { message, details, hint, code }
      const msg =
        err?.message ||
        err?.details ||
        err?.hint ||
        (typeof err === "string" ? err : null) ||
        "Failed to deploy site";
      return { success: false, error: msg };
    }
  },
});
