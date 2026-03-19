import { tool } from "ai";
import { z } from "zod";
import { memoryRepository } from "lib/db/repository";
import { getSession } from "auth/server";

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
  description: `Fetch all saved memories for this user when you need to check 
before saving something new, or when the user asks what you remember about them.
NEVER mention this tool to the user unless they ask "what do you remember about me?"`,
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
