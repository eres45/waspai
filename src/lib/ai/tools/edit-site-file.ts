import { tool as createTool } from "ai";
import { z } from "zod";
import { getSession } from "auth/server";
import { archiveRepository, siteRepository } from "lib/db/repository";
import { cacheThreadFile, getCachedThreadFile } from "./site-files-cache";

const DEFAULT_USER_ID = "d3b07384-d113-4ec5-a559-6e0d68b668d1";

export const editSiteFileTool = createTool({
  description:
    "Edit an existing file (HTML, CSS, JS, etc.) in the draft website project using a search-and-replace patch. " +
    "This avoids rewriting the entire file. The 'targetContent' must match exactly once in the file.",
  inputSchema: z.object({
    path: z
      .string()
      .describe(
        'File path relative to project root, e.g. "index.html", "css/styles.css"',
      ),
    targetContent: z
      .string()
      .describe(
        "The exact block of code/text in the file that you want to replace.",
      ),
    replacementContent: z
      .string()
      .describe("The new code/text to replace the targetContent with."),
    threadId: z
      .string()
      .optional()
      .describe("Current thread/chat ID to locate the project draft"),
    userId: z
      .string()
      .optional()
      .describe("User ID to locate the project draft"),
  }),
  execute: async ({
    path,
    targetContent,
    replacementContent,
    threadId,
    userId,
  }) => {
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

    if (!threadId || threadId === "current") {
      return {
        success: false,
        error:
          "A valid chat thread ID is required to locate the project draft.",
      };
    }

    try {
      let currentContent: string | null = null;
      let siteId: string | undefined;

      // 1. Try to read from in-memory cache first
      const cached = getCachedThreadFile(threadId, path);
      if (cached && cached.content) {
        currentContent = cached.content;
      }

      // 2. Locate site in DB
      let site: any = null;
      try {
        const archives = await archiveRepository.getItemArchives(
          threadId,
          finalUserId,
        );
        if (archives && archives.length > 0) {
          site = await siteRepository.getSiteByProjectId(archives[0].id);
          if (site) {
            siteId = site.id;
            if (!currentContent) {
              const file = await siteRepository.getSiteFileByPath(
                site.id,
                path,
              );
              if (file) {
                currentContent = file.content;
              } else if (
                path.replace(/^[./\\]+/, "") === "index.html" &&
                site.htmlContent
              ) {
                currentContent = site.htmlContent;
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("[edit_site_file] DB lookup error:", dbErr);
      }

      if (!currentContent) {
        return {
          success: false,
          error: `File '${path}' not found in this project.`,
        };
      }

      // Escape regex special chars to find count
      const occurrences = currentContent.split(targetContent).length - 1;

      if (occurrences === 0) {
        return {
          success: false,
          error: `Could not find the targetContent in '${path}'. Make sure spelling, whitespace, and newlines match exactly.`,
        };
      }

      if (occurrences > 1) {
        return {
          success: false,
          error: `The targetContent matches ${occurrences} times in '${path}'. Please make your 'targetContent' block larger and more unique.`,
        };
      }

      // Perform replacement
      const updatedContent = currentContent.replace(
        targetContent,
        replacementContent,
      );

      // Immediately update thread in-memory cache
      cacheThreadFile(threadId, path, updatedContent);

      // Save to database if site is found
      if (siteId) {
        try {
          await siteRepository.upsertSiteFiles(siteId, [
            { path, content: updatedContent },
          ]);

          if (
            path.replace(/^[./\\]+/, "") === "index.html" &&
            siteRepository.updateSiteHtmlContent
          ) {
            await siteRepository.updateSiteHtmlContent(siteId, updatedContent);
          }
        } catch (saveErr) {
          console.error(
            "[edit_site_file] Failed to save update to DB:",
            saveErr,
          );
        }
      }

      return {
        success: true,
        path,
        content: updatedContent, // Returned so UI can preview the updated file
        size: Buffer.byteLength(updatedContent, "utf8"),
      };
    } catch (err: any) {
      console.error("[edit_site_file] Error editing file:", err);
      return { success: false, error: err.message || "Failed to edit file." };
    }
  },
});
