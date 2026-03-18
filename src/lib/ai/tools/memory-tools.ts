import { tool } from "ai";
import { z } from "zod";
import { memoryRepository } from "lib/db/repository";
import { getSession } from "auth/server";

export const saveMemoryTool = tool({
  name: "save-memory",
  description:
    "Save a SIGNIFICANT, PERSISTENT fact or preference about the user. NEVER save greetings (hello, how are you), casual chatter, or temporary session context. Only store stable identity/bio info (name, occupation) or permanent interests (e.g., 'prefers Python'). Trivial memories waste tokens and storage.",
  inputSchema: z.object({
    content: z
      .string()
      .describe(
        "The fact or information to save. Be concise and capture only the essential, persistent detail.",
      ),
    tags: z
      .array(z.string())
      .optional()
      .describe(
        "Tags to categorize this memory (e.g. 'preference', 'bio', 'work', 'code_style').",
      ),
  }),
  execute: async ({ content, tags }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const memory = await memoryRepository.create(
        session.user.id,
        content,
        tags || [],
      );
      return { success: true, memoryId: memory.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const searchMemoriesTool = tool({
  name: "search-memories",
  description:
    "Search user's long-term memory for specific details. Use this when you need to recall information from past conversations or user preferences.",
  inputSchema: z.object({
    query: z.string().describe("The search query to find relevant memories."),
  }),
  execute: async ({ query }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const memories = await memoryRepository.search(session.user.id, query);
      return {
        success: true,
        memories: memories.map((m) => ({
          content: m.content,
          tags: m.tags,
          createdAt: m.createdAt,
        })),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
