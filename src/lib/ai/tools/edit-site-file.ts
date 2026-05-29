import { tool as createTool } from "ai";
import { z } from "zod";
import { getSession } from "auth/server";
import { archiveRepository, siteRepository } from "lib/db/repository";

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
      .describe("Current thread/chat ID to locate the project draft"),
  }),
  execute: async ({ path, targetContent, replacementContent, threadId }) => {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      // Find the project linked to the thread
      const archives = await archiveRepository.getItemArchives(
        threadId,
        userId,
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
        return {
          success: false,
          error: `File '${path}' not found in this project.`,
        };
      }

      const currentContent = file.content;

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

      // Save to database
      await siteRepository.upsertSiteFiles(site.id, [
        { path, content: updatedContent },
      ]);

      // If index.html, update the site fallback htmlContent as well
      if (path === "index.html" || path === "/index.html") {
        await siteRepository.updateSiteHtmlContent(site.id, updatedContent);
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
