import { tool as createTool } from "ai";
import { z } from "zod";
import { getSession } from "auth/server";
import { archiveRepository, siteRepository } from "lib/db/repository";

/**
 * write_site_file — writes one file into the current project's site draft.
 * The AI calls this once per file BEFORE calling deploy_site.
 * The UI shows a "Creating <filename>" card with a live code preview.
 */
export const writeSiteFileTool = createTool({
  description:
    "Write a single file (HTML, CSS, JS, etc.) for a website being built. " +
    "Call this once per file before calling deploy_site. " +
    "The user will see a live code preview card for each file as it is written. " +
    "Always call html_preview after writing index.html so the user can see a preview.",
  inputSchema: z.object({
    path: z
      .string()
      .describe(
        'File path relative to project root, e.g. "index.html", "css/styles.css", "about.html"',
      ),
    content: z.string().describe("Full file content to write"),
    projectName: z
      .string()
      .optional()
      .describe(
        'Human-readable project name, e.g. "Football Site". Used to auto-create the project folder.',
      ),
    threadId: z
      .string()
      .optional()
      .describe("Current thread/chat ID to link this file to a project"),
  }),
  execute: async ({ path, content, projectName, threadId }) => {
    const session = await getSession();
    const userId = session?.user?.id;

    // Auto-create a project folder if we have a threadId
    let projectId: string | undefined;
    if (userId && threadId) {
      try {
        const existing = await archiveRepository.getItemArchives(
          threadId,
          userId,
        );
        if (existing && existing.length > 0) {
          projectId = existing[0].id;
        } else if (projectName) {
          const created = await archiveRepository.createArchive({
            name: projectName,
            description: null,
            userId,
          });
          projectId = created.id;
          // Link the thread to the new project
          await archiveRepository.addItemToArchive(projectId, threadId, userId);
        }
      } catch {
        // Non-fatal — continue without project link
      }
    }

    // Save the file contents immediately to the DB under a draft site
    if (projectId && userId) {
      try {
        let site = await siteRepository.getSiteByProjectId(projectId);
        if (!site) {
          // Generate a temporary draft slug
          const draftSlug = `draft-${projectId.substring(0, 8)}-${Math.random().toString(36).substring(2, 6)}`;
          site = await siteRepository.createSite({
            slug: draftSlug,
            title: projectName || "Draft Site",
            htmlContent: "",
            authorId: userId,
            projectId: projectId,
            isPublic: false,
          });
        }

        // Save this file to the site's DeployedSiteFile table
        await siteRepository.upsertSiteFiles(site.id, [{ path, content }]);

        // If index.html is being written, update htmlContent on the site as well for fallback
        if (path === "index.html" || path === "/index.html") {
          await siteRepository.updateSiteHtmlContent(site.id, content);
        }
      } catch (err) {
        console.error("[write_site_file] Failed to save file to DB:", err);
      }
    }

    return {
      success: true,
      path,
      size: Buffer.byteLength(content, "utf8"),
      projectId: projectId ?? null,
      content, // Returned so the UI card can show the preview
    };
  },
});
