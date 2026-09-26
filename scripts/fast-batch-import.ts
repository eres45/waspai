/**
 * scripts/fast-batch-import.ts
 *
 * Ultra-fast batch upsert for the clean skills vault into Supabase.
 * - Reads existing IDs to preserve foreign key references.
 * - Generates UUIDs for new records so NOT NULL constraints are satisfied.
 * - Executes in chunks of 100 via Supabase upsert.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  autoEnrichSkillContent,
  sanitizeSkillSlug,
} from "../src/lib/ai/harness/skill-distiller";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const vaultPath = path.resolve(
    "scratch/skills-vault/clean_skills_vault.json",
  );
  if (!fs.existsSync(vaultPath)) {
    console.error(`❌ Vault not found at: ${vaultPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(vaultPath, "utf8");
  const skills: any[] = JSON.parse(raw);
  console.log(`📦 Loaded ${skills.length} clean skills from vault.`);

  // 1. Fetch admin/user author ID
  const { data: user } = await supabase
    .from("user")
    .select("id")
    .limit(1)
    .maybeSingle();
  const authorId = user?.id || "bce2f946-477b-4e99-b336-555c5ebdcc49";

  // 2. Fetch all existing skills from DB to map existing IDs
  console.log("🔍 Fetching existing skills from Supabase to preserve IDs...");
  const existingMap = new Map<string, string>();
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("skill")
      .select("id, name")
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("Error fetching existing skills:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    for (const item of data) {
      existingMap.set(item.name, item.id);
    }
    from += pageSize;
    if (data.length < pageSize) break;
  }
  console.log(`   Found ${existingMap.size} existing skills in DB.`);

  // 3. Prepare rows with exact IDs
  console.log("⚡ Formatting batch rows...");
  const rows = skills.map((s) => {
    const slug = sanitizeSkillSlug(s.name || s.slug || s.title || "unnamed");
    const existingId = existingMap.get(slug);
    const id = existingId || crypto.randomUUID();

    const enriched = autoEnrichSkillContent(
      s.content || `# ${s.title}\n${s.description}`,
      {
        name: slug,
        title: s.title || slug,
        description:
          s.description || `Specialized skill for ${s.title || slug}`,
        category: s.category || "productivity",
        tags: s.tags,
        toolsRequired: s.toolsRequired,
      },
    );

    return {
      id,
      name: enriched.slug,
      title: enriched.title,
      description: enriched.description,
      content: enriched.content,
      category: enriched.category,
      tags: enriched.tags,
      tools_required: enriched.toolsRequired,
      author_id: authorId,
      is_public: true,
      is_verified: true,
      tier_required: "free",
      updated_at: new Date().toISOString(),
    };
  });

  // 4. Batch Upsert in Chunks of 100
  console.log(`🚀 Executing high-speed upsert in chunks of 100...`);
  const chunkSize = 100;
  let totalUpserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("skill")
      .upsert(chunk, { onConflict: "name" });
    if (error) {
      console.error(
        `❌ Error on chunk ${Math.floor(i / chunkSize) + 1}:`,
        error.message,
      );
    } else {
      totalUpserted += chunk.length;
      process.stdout.write(
        `   Upserted ${totalUpserted} / ${rows.length} skills...\r`,
      );
    }
  }

  // 5. Final DB Verification
  const { count: finalCount } = await supabase
    .from("skill")
    .select("*", { count: "exact", head: true });
  console.log(
    `\n\n🎉 COMPLETE! Total skills in your Supabase Vault: ${finalCount}`,
  );
}

main().catch(console.error);
