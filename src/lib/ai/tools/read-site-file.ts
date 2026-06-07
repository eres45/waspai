import { tool as createTool } from "ai";
import { z } from "zod";
import { getSession } from "auth/server";
import { archiveRepository, siteRepository } from "lib/db/repository";

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
  }),
  execute: async ({ path, threadId }) => {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
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
