import { tool } from "ai";
import { getSession } from "auth/server";
import {
  autoEnrichSkillContent,
  distillHermesSkill,
  sanitizeSkillSlug,
} from "lib/ai/harness/skill-distiller";
import { skillRepository } from "lib/db/repository";
import { z } from "zod";

export const createSkillTool = tool({
  name: "create_skill",
  description: `Create a custom AI skill directly inside the user's Skill Library and automatically install it for them. Use this tool when the user asks you to create a skill, specialized instruction set, custom persona, or when distilling a successful multi-step workflow into a reusable capability. The skill slug name should be lowercase alphanumeric and hyphens only (e.g. "novel-writer").`,
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
      .optional()
      .describe(
        "The full SKILL.md markdown content containing specialized AI instructions. If provided without procedure steps, it will be automatically enriched with Hermes operational standards.",
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
      .default("productivity")
      .describe("The category this skill fits in (default: 'productivity')"),
    tags: z
      .array(z.string())
      .default([])
      .describe("A list of tag strings associated with this skill"),
    toolsRequired: z
      .array(z.string())
      .optional()
      .describe(
        "Tools required by this skill (e.g. ['web-search', 'generate-pdf']). Detected automatically if omitted.",
      ),
    triggers: z
      .array(z.string())
      .optional()
      .describe("Conditions or user prompts that should trigger this skill."),
    procedure: z
      .union([
        z.string(),
        z.array(
          z.object({
            step: z.union([z.number(), z.string()]),
            action: z.string(),
            tool: z.string().optional(),
            failureRecovery: z.string().optional(),
          }),
        ),
      ])
      .optional()
      .describe(
        "Step-by-step procedural recipe. Can be structured step objects or markdown.",
      ),
    failureModes: z
      .array(z.string())
      .optional()
      .describe(
        "Self-healing mitigations and recovery instructions for when a tool or step fails.",
      ),
    verification: z
      .array(z.string())
      .optional()
      .describe("Checklist to verify the output meets quality standards."),
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
    toolsRequired,
    triggers,
    procedure,
    failureModes,
    verification,
    isPublic,
  }) => {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Sanitize slug: lowercase alphanumeric + hyphens only
    const slug = sanitizeSkillSlug(name);

    // Distill / enrich skill markdown using Hermes distillation engine
    let distilled;
    if (procedure) {
      distilled = distillHermesSkill({
        name: slug,
        title,
        description,
        category,
        tags,
        toolsRequired,
        triggers,
        procedure,
        failureModes,
        verification,
      });
    } else {
      distilled = autoEnrichSkillContent(
        content || `# ${title}\n${description}`,
        {
          name: slug,
          title,
          description,
          category,
          tags,
          toolsRequired,
        },
      );
    }

    try {
      // Check if a skill with this slug already exists for this user
      // (handles duplicate tool calls from the AI)
      const existing = await skillRepository.getSkillByName(
        slug,
        session.user.id,
      );
      if (existing) {
        // Ensure it's installed
        try {
          await skillRepository.installSkill(session.user.id, existing.id);
        } catch {
          // Already installed, ignore
        }
        return {
          success: true,
          skillId: existing.id,
          name: existing.name,
          title: existing.title,
          message: `The "${existing.title}" skill is already registered and active in your library!`,
        };
      }

      // 1. Create the skill with distilled Hermes metadata and required tools
      const saved = await skillRepository.createSkill({
        name: slug,
        title: distilled.title,
        description: distilled.description,
        content: distilled.content,
        category: distilled.category,
        tags: distilled.tags,
        authorId: session.user.id,
        isPublic,
        icon: "✨", // default icon
        toolsRequired: distilled.toolsRequired,
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
        toolsRequired: distilled.toolsRequired,
        message: `Successfully created and automatically installed the "${saved.title}" skill!`,
      };
    } catch (error: any) {
      // Handle unique constraint violation (race condition fallback)
      if (error.message?.includes("unique") || error.code === "23505") {
        try {
          const existing = await skillRepository.getSkillByName(
            slug,
            session.user.id,
          );
          if (existing) {
            await skillRepository
              .installSkill(session.user.id, existing.id)
              .catch(() => {});
            return {
              success: true,
              skillId: existing.id,
              name: existing.name,
              title: existing.title,
              message: `The "${existing.title}" skill was already created and is now active!`,
            };
          }
        } catch {
          // fall through
        }
      }
      return { success: false, error: error.message };
    }
  },
});

/**
 * On-Demand Skill Search Tool (Private Skill Vault)
 * Allows the AI to query the private vault of 1,000+ skills by topic, keyword, or domain.
 */
export const searchSkillsTool = tool({
  name: "search_skills",
  description: `Search your private Skill Vault for specialized AI operational skills, procedural recipes, or expert workflows by keyword, topic, or category. Call this tool when encountering specialized tasks (e.g. video analysis, competitor reports, deep research, code audits, SEO, marketing) to see if an expert skill recipe exists in your vault.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search keywords, topic, or domain (e.g. 'aeo', 'react', 'seo', 'docker', 'incident', 'finance'). Use 1-3 core keywords for best results.",
      ),
    category: z
      .enum([
        "productivity",
        "coding",
        "media",
        "writing",
        "research",
        "automation",
        "security",
        "devops",
        "business",
        "marketing",
        "other",
      ])
      .optional()
      .describe("Optional category to filter skills"),
    limit: z
      .number()
      .default(5)
      .describe("Maximum number of skills to return (default: 5)"),
  }),
  execute: async ({ query, category, limit }) => {
    try {
      const skills = await skillRepository.listSkills({
        search: query,
        category,
        limit: Math.min(limit || 5, 10),
      });

      if (!skills || skills.length === 0) {
        return {
          success: true,
          count: 0,
          skills: [],
          message: `No skills found in the vault matching "${query}". You can proceed using your general capabilities or distill a new skill via create_skill once complete.`,
        };
      }

      return {
        success: true,
        count: skills.length,
        skills: skills.map((s) => ({
          name: s.name,
          title: s.title,
          description: s.description,
          category: s.category,
          tags: s.tags,
          toolsRequired: s.toolsRequired,
        })),
        instruction:
          "To load the full procedural recipe and step-by-step instructions for any skill above, call 'load_skill' with its name slug.",
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to search skill vault",
      };
    }
  },
});

/**
 * On-Demand Skill Loader Tool (Private Skill Vault)
 * Loads the complete procedural recipe and required tools for a specific skill from the private vault.
 */
export const loadSkillTool = tool({
  name: "load_skill",
  description: `Loads the full procedural recipe, step-by-step instructions, and failure recovery protocols for a specific skill from your private Skill Vault on demand. Call this tool to obtain the exact recipe before executing a specialized task.`,
  inputSchema: z.object({
    name: z
      .string()
      .describe(
        "Exact slug name of the skill to load (e.g. 'competitor-intelligence-analyst', 'youtube-summarizer')",
      ),
  }),
  execute: async ({ name }) => {
    const slug = sanitizeSkillSlug(name);
    try {
      const skill = await skillRepository.getSkillByName(slug);
      if (!skill || !skill.content) {
        return {
          success: false,
          error: `Skill '${slug}' was not found in your private vault. You can use 'search_skills' to discover available skills.`,
        };
      }

      return {
        success: true,
        name: skill.name,
        title: skill.title,
        description: skill.description,
        category: skill.category,
        toolsRequired: skill.toolsRequired || [],
        recipe: skill.content,
        instruction: `The full recipe for '${skill.title}' is now loaded into your working memory. Follow its Step-by-Step Procedure and Failure Modes & Self-Healing protocols to complete the user's task.`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || `Failed to load skill '${slug}'`,
      };
    }
  },
});
