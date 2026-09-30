import { tool as createTool } from "ai";
import { z } from "zod";
import { getSession } from "auth/server";
import { archiveRepository, siteRepository } from "lib/db/repository";
import { cacheThreadFile, getCachedThreadFile } from "./site-files-cache";

const DEFAULT_USER_ID = "d3b07384-d113-4ec5-a559-6e0d68b668d1";

export const readSiteFileTool = createTool({
  description:
    "Read the content of an existing file (HTML, CSS, JS, etc.) from the website draft project. " +
    "Use this before editing code to inspect what is currently written.",
  inputSchema: z.object({
    path: z
      .string()
      .describe(
        'File path relative to project root, e.g. "index.html", "css/styles.css"',
      ),
    threadId: z
      .string()
      .optional()
      .describe("Current thread/chat ID to locate the project draft"),
    userId: z
      .string()
      .optional()
      .describe("User ID to locate the project draft"),
  }),
  execute: async ({ path, threadId, userId }) => {
    let finalUserId = userId;
    if (!finalUserId) {
      try {
        const session = await getSession();
        finalUserId = session?.user?.id;
      } catch {
        // Request context / cookies not available
      }
    }
    if (!finalUserId) {
      finalUserId = DEFAULT_USER_ID;
    }

    // 1. Check in-memory thread cache first for immediate consistency
    if (threadId && threadId !== "current") {
      const cached = getCachedThreadFile(threadId, path);
      if (cached && cached.content) {
        return {
          success: true,
          path,
          content: cached.content,
          size: cached.size,
        };
      }
    }

    if (!threadId || threadId === "current") {
      return {
        success: false,
        error:
          "A valid chat thread ID is required to locate the project draft.",
      };
    }

    try {
      // Find the project linked to the thread
      const archives = await archiveRepository.getItemArchives(
        threadId,
        finalUserId,
      );
      if (!archives || archives.length === 0) {
        return {
          success: false,
          error: "No project folder associated with this chat thread.",
        };
      }

      const projectId = archives[0].id;
      const site = await siteRepository.getSiteByProjectId(projectId);
      if (!site) {
        return {
          success: false,
          error: "No draft site found for this project.",
        };
      }

      const file = await siteRepository.getSiteFileByPath(site.id, path);
      if (!file) {
        // Fallback for index.html from site.htmlContent
        const clean = path.replace(/^[./\\]+/, "");
        if (clean === "index.html" && site.htmlContent) {
          cacheThreadFile(threadId, path, site.htmlContent);
          return {
            success: true,
            path,
            content: site.htmlContent,
            size: Buffer.byteLength(site.htmlContent, "utf8"),
          };
        }
        return {
          success: false,
          error: `File '${path}' not found in this project.`,
        };
      }

      // Populate thread cache for subsequent fast reads
      cacheThreadFile(threadId, path, file.content);

      return {
        success: true,
        path,
        content: file.content,
        size: Buffer.byteLength(file.content, "utf8"),
      };
    } catch (err: any) {
      console.error("[read_site_file] Error reading file:", err);
      return { success: false, error: err.message || "Failed to read file." };
    }
  },
});
