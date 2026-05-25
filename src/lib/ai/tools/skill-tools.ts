import { tool } from "ai";
import { z } from "zod";
import { skillRepository } from "lib/db/repository";
import { getSession } from "auth/server";

export const createSkillTool = tool({
  name: "create_skill",
  description: `Create a custom AI skill directly inside the user's Skill Library and automatically install it for them. Use this tool when the user asks you to create a skill, specialized instruction set, or custom persona. The skill slug name should be lowercase alphanumeric and hyphens only (e.g. "novel-writer").`,
  inputSchema: z.object({
    name: z
      .string()
      .describe(
        "Unique slug name for the skill (lowercase alphanumeric and hyphens only, e.g. 'novel-writer')",
      ),
    title: z
      .string()
      .describe("Display title of the skill (e.g. 'Novel Writer')"),
    description: z
      .string()
      .describe("Brief description of what the skill does"),
    content: z
      .string()
      .describe(
        "The full SKILL.md markdown content containing specialized AI instructions",
      ),
    category: z
      .enum([
        "productivity",
        "coding",
        "media",
        "writing",
        "research",
        "automation",
        "other",
      ])
      .describe("The category this skill fits in"),
    tags: z
      .array(z.string())
      .describe("A list of tag strings associated with this skill"),
    isPublic: z
      .boolean()
      .default(true)
      .describe(
        "Whether the skill should be public to the community (default: true)",
      ),
  }),
  execute: async ({
    name,
    title,
    description,
    content,
    category,
    tags,
    isPublic,
  }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    try {
      // 1. Create the skill
      const saved = await skillRepository.createSkill({
        name,
        title,
        description,
        content,
        category,
        tags,
        authorId: session.user.id,
        isPublic,
        icon: "✨", // default icon
        toolsRequired: [],
        tierRequired: "free",
        version: "1.0.0",
      });

      // 2. Automatically install it for the user
      await skillRepository.installSkill(session.user.id, saved.id);

      return {
        success: true,
        skillId: saved.id,
        name: saved.name,
        title: saved.title,
        message: `Successfully created and automatically installed the "${saved.title}" skill!`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
