import type { SkillCategory } from "@/types/skill";

export interface SkillProcedureStep {
  step: number | string;
  action: string;
  tool?: string;
  failureRecovery?: string;
}

export interface SkillFailureMode {
  failure: string;
  mitigation: string;
}

export interface HermesSkillSpec {
  name: string;
  title: string;
  description: string;
  category?: SkillCategory;
  tags?: string[];
  toolsRequired?: string[];
  triggers?: string[];
  prerequisites?: string[];
  procedure: string | SkillProcedureStep[];
  failureModes?: (SkillFailureMode | string)[];
  verification?: string[];
  examples?: string[];
  rawContent?: string;
}

export interface DistilledSkillResult {
  slug: string;
  title: string;
  description: string;
  category: SkillCategory;
  tags: string[];
  toolsRequired: string[];
  content: string;
}

// Known tool catalog for automatic dependency extraction
const KNOWN_TOOLS: Record<string, string> = {
  "web-search": "web-search",
  web_search: "web-search",
  websearch: "web-search",
  "image-manager": "image-manager",
  image_manager: "image-manager",
  "edit-image": "edit-image",
  edit_image: "edit-image",
  "remove-background": "remove-background",
  "enhance-image": "enhance-image",
  "anime-conversion": "anime-conversion",
  "generate-pdf": "generate-pdf",
  "pdf-generator": "generate-pdf",
  "generate-presentation": "generate-presentation",
  "word-document": "word-document",
  "csv-generator": "csv-generator",
  "text-file": "text-file",
  "file-converter": "file-converter",
  "qr-code-generator": "qr-code-generator",
  "qr-code": "qr-code-generator",
  "code-runner": "code-runner",
  "python-interpreter": "code-runner",
  "create-skill": "create_skill",
  create_skill: "create_skill",
  "steel-browser": "steel-browser",
  "browser-automation": "steel-browser",
};

/**
 * Extracts recognized tool names from arbitrary text or procedure steps.
 */
export function detectRequiredTools(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const detected = new Set<string>();

  for (const [pattern, canonicalName] of Object.entries(KNOWN_TOOLS)) {
    // Check for exact word or tool invocation format
    const regex = new RegExp(`\\b${pattern.replace("-", "[_-]?")}\\b`, "i");
    if (regex.test(lower)) {
      detected.add(canonicalName);
    }
  }

  return Array.from(detected);
}

/**
 * Normalizes a skill slug name into lowercase alphanumeric + hyphens
 */
export function sanitizeSkillSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "custom-skill"
  );
}

/**
 * Compiles a structured HermesSkillSpec into a canonical Hermes/Antigravity SKILL.md document.
 */
export function distillHermesSkill(
  spec: HermesSkillSpec,
): DistilledSkillResult {
  const slug = sanitizeSkillSlug(spec.name);
  const title = spec.title?.trim() || spec.name;
  const description =
    spec.description?.trim() || `Specialized skill for ${title}`;
  const category: SkillCategory = spec.category || "productivity";

  // Deduplicate and sanitize tags
  const tagsSet = new Set<string>();
  if (Array.isArray(spec.tags)) {
    for (const t of spec.tags) {
      const clean = t.trim().toLowerCase();
      if (clean) tagsSet.add(clean);
    }
  }
  tagsSet.add(category);

  // Collect and detect tools
  const toolsSet = new Set<string>(spec.toolsRequired || []);

  let procedureMarkdown = "";
  if (typeof spec.procedure === "string") {
    procedureMarkdown = spec.procedure.trim();
  } else if (Array.isArray(spec.procedure)) {
    procedureMarkdown = spec.procedure
      .map((p) => {
        let stepText = `${p.step}. **${p.action}**`;
        if (p.tool) {
          stepText += ` (Tool: \`${p.tool}\`)`;
          toolsSet.add(p.tool);
        }
        if (p.failureRecovery) {
          stepText += `\n   - *Recovery on failure*: ${p.failureRecovery}`;
        }
        return stepText;
      })
      .join("\n\n");
  }

  // Scan procedure text for any additional tools
  for (const tool of detectRequiredTools(procedureMarkdown)) {
    toolsSet.add(tool);
  }

  const toolsRequired = Array.from(toolsSet);
  const tags = Array.from(tagsSet);

  // Build Frontmatter
  const frontmatter = [
    "---",
    `name: ${slug}`,
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `category: ${category}`,
    `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`,
    `tools_required: [${toolsRequired.map((t) => `"${t}"`).join(", ")}]`,
    `version: 1.0.0`,
    "---",
  ].join("\n");

  const sections: string[] = [frontmatter, `\n# ${title}\n`, description];

  // Triggers section
  if (spec.triggers && spec.triggers.length > 0) {
    sections.push("\n## Trigger Conditions");
    sections.push(
      "Activate this skill whenever the user asks for or the workflow encounters:\n" +
        spec.triggers.map((t) => `- ${t}`).join("\n"),
    );
  }

  // Prerequisites section
  if (spec.prerequisites && spec.prerequisites.length > 0) {
    sections.push("\n## Prerequisites & Environment");
    sections.push(spec.prerequisites.map((p) => `- ${p}`).join("\n"));
  }

  // Required Tools section
  if (toolsRequired.length > 0) {
    sections.push("\n## Required Tools");
    sections.push(toolsRequired.map((tool) => `- \`${tool}\``).join("\n"));
  }

  // Step-by-Step Procedure
  if (procedureMarkdown) {
    sections.push("\n## Step-by-Step Procedure");
    sections.push(procedureMarkdown);
  }

  // Failure Modes & Self-Healing section (Hermes / DeepSeek resilience)
  const failureItems: string[] = [];
  if (spec.failureModes && spec.failureModes.length > 0) {
    for (const fm of spec.failureModes) {
      if (typeof fm === "string") {
        failureItems.push(`- **Failure**: ${fm}`);
      } else {
        failureItems.push(`- **When ${fm.failure} occurs**: ${fm.mitigation}`);
      }
    }
  } else {
    // Default reflective recovery instruction
    failureItems.push(
      "- **Tool Execution Error**: Inspect the reflective diagnostic envelope returned by the tool. If the input parameters were rejected, correct schema types and re-attempt with alternate valid arguments.",
      "- **Empty or Stale Results**: If web search or retrieval returns incomplete context, refine query keywords with timestamp/domain qualifiers instead of repeating the identical query.",
      "- **Rate or Context Limit**: Abort recursive retries immediately and synthesize the best available response using partial collected evidence.",
    );
  }
  sections.push("\n## Failure Modes & Self-Healing (Reflective Recovery)");
  sections.push(failureItems.join("\n"));

  // Verification Checklist
  const verificationItems: string[] = [];
  if (spec.verification && spec.verification.length > 0) {
    for (const v of spec.verification) {
      verificationItems.push(`- [ ] ${v}`);
    }
  } else {
    verificationItems.push(
      `- [ ] Verify the requested output meets all user constraints and schema requirements.`,
      `- [ ] Confirm no placeholder links or hallucinated resources exist in the final output.`,
    );
  }
  sections.push("\n## Verification Checklist");
  sections.push(verificationItems.join("\n"));

  // Examples
  if (spec.examples && spec.examples.length > 0) {
    sections.push("\n## Examples & Expected Formats");
    sections.push(spec.examples.join("\n\n"));
  }

  const content = sections.join("\n").trim() + "\n";

  return {
    slug,
    title,
    description,
    category,
    tags,
    toolsRequired,
    content,
  };
}

/**
 * Enriches unstructured or raw skill text into a production-grade Hermes-compliant skill.
 * Ensures the markdown has operational structure, tool requirements, and self-healing protocols.
 */
export function autoEnrichSkillContent(
  rawContent: string,
  options?: {
    name?: string;
    title?: string;
    description?: string;
    category?: SkillCategory;
    tags?: string[];
    toolsRequired?: string[];
  },
): DistilledSkillResult {
  const trimmed = rawContent.trim();
  const title = options?.title || options?.name || "Distilled Agent Skill";
  const name = options?.name || title.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const description = options?.description || `Operational recipe for ${title}`;
  const category = options?.category || "productivity";

  // Check if content already contains frontmatter
  const hasFrontmatter = /^---\r?\n[\s\S]*?\r?\n---/.test(trimmed);

  // Detect tools from content
  const detectedTools = detectRequiredTools(trimmed);
  const combinedTools = Array.from(
    new Set([...(options?.toolsRequired || []), ...detectedTools]),
  );

  // If already richly structured with frontmatter and key sections, preserve while ensuring tools
  const hasProcedure = /##.*(procedure|steps|execution|instructions)/i.test(
    trimmed,
  );
  const hasRecovery = /##.*(failure|healing|recovery|fallback|pitfall)/i.test(
    trimmed,
  );
  const hasVerification = /##.*(verification|checklist|validation)/i.test(
    trimmed,
  );

  if (hasFrontmatter && hasProcedure && hasRecovery && hasVerification) {
    return {
      slug: sanitizeSkillSlug(name),
      title,
      description,
      category,
      tags: options?.tags || [category],
      toolsRequired: combinedTools,
      content: trimmed + "\n",
    };
  }

  // Parse raw text into structured spec
  return distillHermesSkill({
    name,
    title,
    description,
    category,
    tags: options?.tags,
    toolsRequired: combinedTools,
    procedure: trimmed,
  });
}
