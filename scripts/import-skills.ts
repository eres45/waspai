/**
 * scripts/import-skills.ts
 *
 * Batch Ingestion Script for the Private Skill Vault (Scaling to 1,000+ Skills)
 *
 * Usage:
 *   pnpm exec tsx scripts/import-skills.ts <file-or-directory-path>
 *
 * Supports:
 *   1. Directory containing SKILL.md files (e.g. `pnpm exec tsx scripts/import-skills.ts ./my-skills-folder`)
 *   2. JSON file with skill definitions array (e.g. `pnpm exec tsx scripts/import-skills.ts ./skills.json`)
 *   3. Single SKILL.md file (e.g. `pnpm exec tsx scripts/import-skills.ts ./my-skill/SKILL.md`)
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  autoEnrichSkillContent,
  detectRequiredTools,
  sanitizeSkillSlug,
} from "../src/lib/ai/harness/skill-distiller";
import type { SkillCategory, SkillTier } from "../src/types/skill";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface RawSkillInput {
  name?: string;
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  toolsRequired?: string[];
  tools_required?: string[];
  tierRequired?: string;
}

function parseMarkdownSkill(filePath: string, rawText: string): RawSkillInput {
  let content = rawText;
  const metadata: RawSkillInput = {};

  // Check for YAML frontmatter: --- ... ---
  const frontmatterMatch = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatterMatch) {
    const yamlBlock = frontmatterMatch[1];
    content = rawText.slice(frontmatterMatch[0].length).trim();

    for (const line of yamlBlock.split(/\r?\n/)) {
      const kv = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (kv) {
        const key = kv[1].toLowerCase().replace(/-/g, "_");
        let val = kv[2].trim().replace(/^["']|["']$/g, "");
        if (val.startsWith("[") && val.endsWith("]")) {
          try {
            val = JSON.parse(val);
          } catch {
            val = val
              .slice(1, -1)
              .split(",")
              .map((s) => s.trim().replace(/^["']|["']$/g, "")) as any;
          }
        }
        (metadata as any)[key] = val;
      }
    }
  }

  // Derive title from first H1 if missing
  if (!metadata.title) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) metadata.title = h1Match[1].trim();
  }

  // Fallback slug from filename
  if (!metadata.name && !metadata.slug) {
    const parentDir = path.basename(path.dirname(filePath));
    const baseName = path.basename(filePath, path.extname(filePath));
    metadata.name = baseName === "SKILL" ? parentDir : baseName;
  }

  return {
    name: metadata.slug || metadata.name,
    title: metadata.title,
    description: metadata.description,
    content,
    category: metadata.category,
    tags: metadata.tags,
    toolsRequired: metadata.tools_required || metadata.toolsRequired,
  };
}

async function upsertSkillToVault(skillData: RawSkillInput): Promise<boolean> {
  const name = sanitizeSkillSlug(
    skillData.name || skillData.slug || skillData.title || "unnamed-skill",
  );
  const title = skillData.title || name;
  const description = skillData.description || `Specialized skill for ${title}`;
  const category: SkillCategory = (
    [
      "productivity",
      "coding",
      "media",
      "writing",
      "research",
      "automation",
      "other",
    ].includes(skillData.category?.toLowerCase() || "")
      ? skillData.category?.toLowerCase()
      : "productivity"
  ) as SkillCategory;

  const rawContent = skillData.content || `# ${title}\n${description}`;

  // Distill and normalize content into Hermes standard format
  const enriched = autoEnrichSkillContent(rawContent, {
    name,
    title,
    description,
    category,
    tags: skillData.tags,
    toolsRequired:
      skillData.toolsRequired || skillData.tools_required || undefined,
  });

  const row = {
    name: enriched.slug,
    title: enriched.title,
    description: enriched.description,
    content: enriched.content,
    category: enriched.category,
    tags: enriched.tags,
    tools_required: enriched.toolsRequired,
    is_public: true, // accessible to your private vault AI queries
    is_verified: true,
    tier_required: (skillData.tierRequired || "free") as SkillTier,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("skill")
    .select("id")
    .eq("name", enriched.slug)
    .maybeSingle();

  if (existing?.id) {
    const { error: updateErr } = await supabase
      .from("skill")
      .update(row)
      .eq("id", existing.id);
    if (updateErr) {
      console.error(`❌ Failed to update ${enriched.slug}:`, updateErr.message);
      return false;
    }
    console.log(
      `🔄 Updated existing skill: ${enriched.title} (${enriched.slug})`,
    );
  } else {
    const { error: insertErr } = await supabase.from("skill").insert({
      id: crypto.randomUUID(),
      ...row,
      created_at: new Date().toISOString(),
      install_count: 0,
    });
    if (insertErr) {
      console.error(`❌ Failed to insert ${enriched.slug}:`, insertErr.message);
      return false;
    }
    console.log(`✨ Inserted new skill: ${enriched.title} (${enriched.slug})`);
  }
  return true;
}

async function collectFiles(targetPath: string): Promise<string[]> {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) return [targetPath];

  const files: string[] = [];
  function scan(dir: string) {
    for (const item of fs.readdirSync(dir)) {
      if (item === "node_modules" || item.startsWith(".")) continue;
      const full = path.join(dir, item);
      const s = fs.statSync(full);
      if (s.isDirectory()) {
        scan(full);
      } else if (
        s.isFile() &&
        (item.endsWith(".md") || item.endsWith(".json"))
      ) {
        files.push(full);
      }
    }
  }
  scan(targetPath);
  return files;
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.log(`
Usage:
  pnpm exec tsx scripts/import-skills.ts <path-to-file-or-dir>

Examples:
  pnpm exec tsx scripts/import-skills.ts ./skills-folder
  pnpm exec tsx scripts/import-skills.ts ./all-skills.json
  pnpm exec tsx scripts/import-skills.ts ./my-skill/SKILL.md
`);
    process.exit(1);
  }

  const resolved = path.resolve(target);
  if (!fs.existsSync(resolved)) {
    console.error(`❌ Path not found: ${resolved}`);
    process.exit(1);
  }

  console.log(`🔍 Scanning target: ${resolved}`);
  const files = await collectFiles(resolved);
  console.log(
    `📦 Found ${files.length} candidate file(s). Processing import...\n`,
  );

  let count = 0;
  for (const f of files) {
    try {
      const raw = fs.readFileSync(f, "utf8");
      if (f.endsWith(".json")) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const ok = await upsertSkillToVault(item);
            if (ok) count++;
          }
        } else if (typeof parsed === "object") {
          const ok = await upsertSkillToVault(parsed);
          if (ok) count++;
        }
      } else if (f.endsWith(".md")) {
        const parsed = parseMarkdownSkill(f, raw);
        const ok = await upsertSkillToVault(parsed);
        if (ok) count++;
      }
    } catch (err: any) {
      console.error(`⚠️ Error processing ${f}:`, err.message);
    }
  }

  console.log(
    `\n🎉 Successfully imported ${count} skill(s) into your Private Skill Vault!`,
  );
}

main().catch(console.error);
