import { tool } from "ai";
import { getSession } from "auth/server";
import { chatRepository, memoryRepository } from "lib/db/repository";
import { z } from "zod";

export const saveMemoryTool = tool({
  name: "save_memory",
  description: `Save a NEW long-term fact about the user ONLY when they share:
- Personal details (name, job, location, age)
- Skills or expertise ("User is a React developer")
- Preferences ("User prefers TypeScript over JavaScript")
- Goals or active projects
- Important life context

DO NOT save: greetings, thanks, one-off requests, temporary context.
Save the FULL context, not a shortened version.
Before saving ask: "Will this matter in 2 weeks?" If no → don't save.
NEVER mention this tool to the user.`,
  inputSchema: z.object({
    memory: z.string().describe("The full fact to save"),
  }),
  execute: async ({ memory }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const saved = await memoryRepository.create(session.user.id, memory, []);
      return { success: true, memoryId: saved.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const updateMemoryTool = tool({
  name: "update_memory",
  description: `Update an existing memory when the user corrects or upgrades info.
Example: User said "I switched from Vue to React" → update old Vue memory.
NEVER mention this tool to the user.`,
  inputSchema: z.object({
    memory_id: z.string().describe("ID of memory to update"),
    new_memory: z.string().describe("The updated fact"),
  }),
  execute: async ({ memory_id, new_memory }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      await memoryRepository.update(session.user.id, memory_id, new_memory);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const deleteMemoryTool = tool({
  name: "delete_memory",
  description: `Delete a memory that is wrong, outdated, or contradicted by new info.
NEVER mention this tool to the user.`,
  inputSchema: z.object({
    memory_id: z.string().describe("ID of memory to delete"),
  }),
  execute: async ({ memory_id }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      await memoryRepository.delete(session.user.id, memory_id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const getMemoriesTool = tool({
  name: "get_memories",
  description: `Fetch all saved long-term memories for this user. Call this tool when checking saved context before saving, or whenever the user asks what you remember, what you know about them, or what you've worked on together.`,
  inputSchema: z.object({}),
  execute: async () => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const memories = await memoryRepository.list(session.user.id, 50);
      return {
        success: true,
        memories: memories.map((m) => ({
          id: m.id,
          memory: m.content,
        })),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const searchPastConversationsTool = tool({
  name: "search_past_conversations",
  description: `Search through the user's past chat conversations and threads. Call this tool whenever the user asks what you worked on before, what you discussed earlier, asks to recall a previous topic, or asks if you remember past conversations.`,
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe(
        "Optional topic or keyword to search for, or empty to retrieve recent conversation topics",
      ),
  }),
  execute: async ({ query }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      const threads = await chatRepository.selectThreadsByUserId(
        session.user.id,
      );

      if (!threads || threads.length === 0) {
        return {
          success: true,
          message: "No previous chat threads found for this user.",
          conversations: [],
        };
      }

      // Filter by query if provided
      let matchedThreads = threads;
      if (query && query.trim().length > 0) {
        const lowerQ = query.toLowerCase().trim();
        matchedThreads = threads.filter((t) =>
          t.title?.toLowerCase().includes(lowerQ),
        );
        // Fallback to recent threads if query filter returned nothing
        if (matchedThreads.length === 0) {
          matchedThreads = threads;
        }
      }

      // Take top 5 most recent threads
      const topThreads = matchedThreads.slice(0, 5);

      const summaries = await Promise.all(
        topThreads.map(async (t) => {
          try {
            const msgs = await chatRepository.selectMessagesByThreadId(t.id);
            const userPrompts = msgs
              .filter((m) => m.role === "user")
              .map((m) => {
                const text = (m.parts as any[])
                  ?.filter((p: any) => p.type === "text")
                  ?.map((p: any) => p.text)
                  ?.join(" ");
                return text?.slice(0, 150) || "";
              })
              .filter(Boolean)
              .slice(0, 2);

            // Clean title if it was generated with markdown
            const cleanTitle = (t.title || "Untitled Chat")
              .replace(/^[#*\s-]+/, "")
              .slice(0, 80);

            return {
              threadId: t.id,
              title: cleanTitle,
              topics: userPrompts,
              date: t.createdAt
                ? new Date(t.createdAt).toLocaleDateString()
                : undefined,
            };
          } catch {
            return {
              threadId: t.id,
              title: (t.title || "Untitled Chat").slice(0, 80),
            };
          }
        }),
      );

      return {
        success: true,
        conversations: summaries,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
