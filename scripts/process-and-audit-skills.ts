/**
 * scripts/process-and-audit-skills.ts
 *
 * Full Production Pipeline:
 * 1. Collect all skills from claude-skills (Rank 1) and agentic-awesome-skills (Rank 2).
 * 2. Clean & normalize content (YAML frontmatter parsing, slug sanitization).
 * 3. Filter out empty stubs (< 150 chars) and personal private agency workflows.
 * 4. Remove duplicates using priority hierarchy (Rank 1 wins; duplicates logged).
 * 5. Run rigorous Security Audit (OWASP / Threat Surface Hardening):
 *    - Remove offensive attack weaponization / malware / exploit generators / brute-forcers.
 *    - Remove prompt injection / jailbreak / system exfiltration vectors.
 *    - Preserve defensive security (incident response, SOC detection, OWASP hardening, defensive reviews).
 * 6. Standardize into 9 core categories with word-boundary precision.
 * 7. Output clean vault and detailed audit reports with full statistics.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

interface RawSkillRecord {
  slug: string;
  title: string;
  description: string;
  content: string;
  sourceRepo: "claude-skills" | "agentic-awesome-skills";
  sourcePath: string;
  rawCategory?: string;
  rawRisk?: string;
  rawSourceType?: string;
  tags: string[];
}

export type StandardCategory =
  | "coding"
  | "security"
  | "devops"
  | "research"
  | "business"
  | "marketing"
  | "productivity"
  | "media"
  | "automation";

export interface CleanSkillRecord {
  id: string;
  name: string;
  title: string;
  description: string;
  content: string;
  category: StandardCategory;
  tags: string[];
  toolsRequired: string[];
  sourceRepo: "claude-skills" | "agentic-awesome-skills";
  sourcePath: string;
  originalRisk?: string;
}

export interface SecurityRejection {
  slug: string;
  title: string;
  sourceRepo: string;
  reason: string;
  category:
    | "offensive-weaponization"
    | "prompt-injection"
    | "credential-exfiltration"
    | "destructive-command"
    | "unsafe-blackhat";
  evidence: string;
}

export interface DuplicateRejection {
  slug: string;
  keptSource: string;
  discardedSource: string;
  keptTitle: string;
  discardedTitle: string;
}

export interface QualityRejection {
  slug: string;
  sourceRepo: string;
  reason: string;
}

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[_\s/\\:.]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseMarkdownSkill(
  _filePath: string,
  rawText: string,
): {
  title?: string;
  description?: string;
  category?: string;
  tags: string[];
  content: string;
} {
  let content = rawText;
  let title: string | undefined;
  let description: string | undefined;
  let category: string | undefined;
  const tags: string[] = [];

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
        if (key === "title" || key === "name") title = String(val);
        else if (key === "description") description = String(val);
        else if (key === "category") category = String(val);
        else if (key === "tags" && Array.isArray(val)) {
          for (const t of val) tags.push(String(t).toLowerCase());
        }
      }
    }
  }

  if (!title) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) title = h1Match[1].trim();
  }

  if (!description) {
    const firstPara = content
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .find((p) => p.length > 20 && !p.startsWith("#") && !p.startsWith("---"));
    if (firstPara) {
      description = firstPara.slice(0, 200).replace(/\r?\n/g, " ");
    }
  }

  return { title, description, category, tags, content };
}

/**
 * Standard Category Mapper with strict word-boundary matching
 */
function mapToStandardCategory(
  rawCat = "",
  tags: string[] = [],
  text = "",
): StandardCategory {
  const haystack =
    `${rawCat} ${tags.join(" ")} ${text.slice(0, 400)}`.toLowerCase();

  // 1. Security
  if (
    /\b(security|audit|vulnerability|owasp|hardening|compliance|threat|stride|pasta|penetration|soc2|gdpr|firewall|cryptography)\b/i.test(
      haystack,
    )
  ) {
    return "security";
  }

  // 2. DevOps & Cloud
  if (
    /\b(devops|cloud|docker|kubernetes|k8s|terraform|aws|gcp|azure|ci-cd|pipeline|infrastructure|sysadmin|ansible|helm|sentry|datadog|nginx|grafana|prometheus)\b/i.test(
      haystack,
    )
  ) {
    return "devops";
  }

  // 3. Business & Leadership
  if (
    /\b(c-level|advisor|cfo|cmo|cto|coo|cpo|cro|executive|founder|finance|financial|legal|law|contract|product-management|commercial|pricing|investor|board-meeting|merger|acquisition)\b/i.test(
      haystack,
    )
  ) {
    return "business";
  }

  // 4. Marketing & SEO
  if (
    /\b(marketing|seo|aeo|advertising|copywriting|ad-creative|social-media|growth|content-strategy|campaign|branding|conversion)\b/i.test(
      haystack,
    )
  ) {
    return "marketing";
  }

  // 5. Research & Academic
  if (
    /\b(research|academic|literature-review|patent|paper|scientific|data-science|notebooklm|deep-research|hypothesis|citation)\b/i.test(
      haystack,
    )
  ) {
    return "research";
  }

  // 6. Media & Design (Strict word boundary for UI/UX)
  if (
    /\b(figma|design-system|presentation|slide-deck|video-editing|audio|graphic-design|3d-web|threejs|canvas|animation|illustration)\b/i.test(
      haystack,
    ) ||
    /\b(ui|ux)\b/i.test(haystack)
  ) {
    return "media";
  }

  // 7. Automation & Scraping
  if (
    /\b(automation|crawler|scraper|scraping|browser-automation|playwright|puppeteer|selenium|webhook|n8n|zapier)\b/i.test(
      haystack,
    )
  ) {
    return "automation";
  }

  // 8. Coding & Engineering
  if (
    /\b(coding|engineering|software|frontend|backend|fullstack|react|nextjs|vue|angular|svelte|python|typescript|javascript|golang|rust|java|c\+\+|sql|database|postgres|mongodb|redis|graphql|rest-api|refactor|debugging|unit-test|vitest|jest|algorithms)\b/i.test(
      haystack,
    )
  ) {
    return "coding";
  }

  return "productivity";
}

function detectToolsRequired(content: string): string[] {
  const tools = new Set<string>();
  const lowered = content.toLowerCase();

  if (
    lowered.includes("web-search") ||
    lowered.includes("search_web") ||
    lowered.includes("google search") ||
    lowered.includes("search the web")
  ) {
    tools.add("web-search");
  }
  if (lowered.includes("generate-pdf") || lowered.includes("export pdf")) {
    tools.add("pdf-generator");
  }
  if (lowered.includes("execute python") || lowered.includes("run python")) {
    tools.add("python-executor");
  }
  if (lowered.includes("scrape") || lowered.includes("crawl webpage")) {
    tools.add("web-scrape");
  }
  if (
    lowered.includes("playwright") ||
    lowered.includes("browser automation")
  ) {
    tools.add("browser-automation");
  }
  if (lowered.includes("qr code") || lowered.includes("qrcode")) {
    tools.add("qr-code-generator");
  }
  if (
    lowered.includes("chart") ||
    lowered.includes("create bar chart") ||
    lowered.includes("pie chart")
  ) {
    tools.add("visualization-tools");
  }

  return Array.from(tools);
}

/**
 * Rigorous Security Audit Filter:
 * Detects offensive exploits, weaponized tools, prompt injection / jailbreak vectors,
 * credential theft, and destructive commands while protecting legitimate defensive tooling.
 */
function auditSkillSecurity(skill: RawSkillRecord): SecurityRejection | null {
  const content = skill.content;
  const loweredHeader =
    `${skill.slug} ${skill.title} ${skill.description}`.toLowerCase();
  const loweredAll = `${loweredHeader} ${content}`.toLowerCase();

  // 1. Check if this is an explicitly defensive security tool
  const isDefensive =
    loweredHeader.includes("defense") ||
    loweredHeader.includes("defend") ||
    loweredHeader.includes("mitigat") ||
    loweredHeader.includes("incident") ||
    loweredHeader.includes("response") ||
    loweredHeader.includes("responder") ||
    loweredHeader.includes("detection") ||
    loweredHeader.includes("auditor") ||
    loweredHeader.includes("audit") ||
    loweredHeader.includes("hardening") ||
    loweredHeader.includes("patch") ||
    loweredHeader.includes("review") ||
    loweredHeader.includes("blue-team") ||
    loweredHeader.includes("soc") ||
    loweredHeader.includes("siem") ||
    loweredHeader.includes("continuity") ||
    loweredHeader.includes("block-storage") ||
    loweredHeader.includes("sysadmin") ||
    skill.slug.includes("cloud-security") ||
    skill.slug.includes("skill-security-auditor");

  // 2. Known Offensive / Malicious Attack Tooling (Quarantine immediately)
  const offensiveSlugs = [
    "active-directory-attacks",
    "anti-reversing-techniques",
    "apk-redteam-pipeline",
    "apk-reverse",
    "attack-chain",
    "aws-penetration-testing",
    "ios-redteam-pipeline",
    "metasploit-framework",
    "privilege-escalation-methods",
    "red-team-tactics",
    "windows-ad",
    "windows-privilege-escalation",
    "hunt-html-injection",
    "hunt-http-smuggling",
    "hunt-xss",
    "hunt-xxe",
    "hunt-shadow-api",
    "hunt-subdomain",
    "hunt-llm-ai",
    "hunt-dispatch",
    "burp-suite-testing",
  ];

  if (offensiveSlugs.includes(skill.slug)) {
    return {
      slug: skill.slug,
      title: skill.title,
      sourceRepo: skill.sourceRepo,
      category: "offensive-weaponization",
      reason:
        "Blackhat attack tool / offensive exploit pipeline / payload delivery suite",
      evidence: `Identified offensive attack tool: ${skill.slug} - ${skill.description.slice(0, 100)}`,
    };
  }

  // 3. AAS catalog explicit offensive flag (if not defensive)
  if (skill.rawRisk === "offensive" && !isDefensive) {
    return {
      slug: skill.slug,
      title: skill.title,
      sourceRepo: skill.sourceRepo,
      category: "offensive-weaponization",
      reason:
        "Catalog flagged as offensive attack weaponization without defensive focus",
      evidence: `Risk tag: offensive. Description: ${skill.description.slice(0, 120)}`,
    };
  }

  // 4. Blackhat attack terms (if not in a defensive context)
  if (!isDefensive) {
    const offensiveTerms = [
      {
        term: "credential harvesting",
        desc: "Credential harvesting attack instructions",
      },
      { term: "kerberoasting", desc: "Kerberos exploitation / attack tooling" },
      {
        term: "domain dominance",
        desc: "Active Directory domain takeover tooling",
      },
      { term: "reverse shell payload", desc: "Malicious payload generation" },
      { term: "bypass edr", desc: "EDR/Antivirus evasion techniques" },
      { term: "keylogger", desc: "Keylogging software creation" },
      {
        term: "ransomware creation",
        desc: "Ransomware / extortion payload creation",
      },
      { term: "ddos attack", desc: "Distributed denial-of-service tool" },
    ];

    for (const item of offensiveTerms) {
      if (loweredAll.includes(item.term)) {
        return {
          slug: skill.slug,
          title: skill.title,
          sourceRepo: skill.sourceRepo,
          category: "unsafe-blackhat",
          reason: item.desc,
          evidence: `Found offensive exploit term: '${item.term}' in ${skill.slug}`,
        };
      }
    }
  }

  // 5. Genuine Prompt Injections & Jailbreak Vectors (Exclude regex defense patterns)
  if (
    !isDefensive &&
    !skill.slug.includes("defense") &&
    !skill.slug.includes("eval")
  ) {
    const jailbreaks = [
      {
        pattern: /you\s+are\s+now\s+in\s+dan\s+mode/i,
        desc: "DAN / unconstrained jailbreak prompt pattern",
      },
      {
        pattern: /bypass\s+(all\s+)?(ethical|safety|system)\s+boundaries/i,
        desc: "Safety guardrail bypass directive",
      },
      {
        pattern:
          /output\s+your\s+(initial|system)\s+(prompt|instructions)\s+verbatim/i,
        desc: "System prompt exfiltration vector",
      },
    ];

    for (const item of jailbreaks) {
      if (item.pattern.test(content)) {
        return {
          slug: skill.slug,
          title: skill.title,
          sourceRepo: skill.sourceRepo,
          category: "prompt-injection",
          reason: item.desc,
          evidence: `Matched unconstrained jailbreak vector in content`,
        };
      }
    }
  }

  // 6. Credential Exfiltration
  const exfilPatterns = [
    {
      pattern: /cat\s+~\/\.ssh\/id_rsa/i,
      desc: "Direct attempt to read and leak private SSH keys",
    },
    {
      pattern: /curl.*--data.*(\/etc\/shadow|id_rsa)/i,
      desc: "Exfiltration of system credentials via curl",
    },
  ];

  for (const item of exfilPatterns) {
    if (item.pattern.test(content)) {
      return {
        slug: skill.slug,
        title: skill.title,
        sourceRepo: skill.sourceRepo,
        category: "credential-exfiltration",
        reason: item.desc,
        evidence: `Matched credential exfiltration pattern`,
      };
    }
  }

  // 7. Destructive System Commands (not in standard disk partition / format guides)
  if (
    !skill.slug.includes("block-storage") &&
    !skill.slug.includes("linux-admin")
  ) {
    const destructive = [
      {
        pattern: /rm\s+-rf\s+\/\s+/i,
        desc: "Destructive root filesystem wipe command",
      },
    ];
    for (const item of destructive) {
      if (item.pattern.test(content)) {
        return {
          slug: skill.slug,
          title: skill.title,
          sourceRepo: skill.sourceRepo,
          category: "destructive-command",
          reason: item.desc,
          evidence: `Matched destructive system command`,
        };
      }
    }
  }

  return null;
}

// Collector for claude-skills
function collectClaudeSkills(baseDir: string): RawSkillRecord[] {
  const records: RawSkillRecord[] = [];
  function scan(dir: string) {
    for (const entry of fs.readdirSync(dir)) {
      if (entry === ".git" || entry === "node_modules") continue;
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const skillMd = path.join(full, "SKILL.md");
        if (fs.existsSync(skillMd)) {
          const raw = fs.readFileSync(skillMd, "utf8");
          const parsed = parseMarkdownSkill(skillMd, raw);
          const slug = sanitizeSlug(
            entry === "SKILL" ? path.basename(dir) : entry,
          );
          if (slug && parsed.content.length > 50) {
            records.push({
              slug,
              title: parsed.title || entry,
              description:
                parsed.description || `Specialized skill for ${entry}`,
              content: parsed.content,
              sourceRepo: "claude-skills",
              sourcePath: path.relative(baseDir, skillMd),
              rawCategory: parsed.category || path.basename(path.dirname(full)),
              tags: parsed.tags,
            });
          }
        }
        scan(full);
      }
    }
  }
  scan(baseDir);
  return records;
}

// Collector for agentic-awesome-skills
function collectAasSkills(baseDir: string): RawSkillRecord[] {
  const records: RawSkillRecord[] = [];
  const indexPath = path.join(baseDir, "skills_index.json");
  const indexMap = new Map<string, any>();

  if (fs.existsSync(indexPath)) {
    try {
      const idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      if (Array.isArray(idx)) {
        for (const item of idx) {
          if (item.name || item.id) {
            indexMap.set(sanitizeSlug(item.name || item.id), item);
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse AAS skills_index.json:", e);
    }
  }

  const skillsDir = path.join(baseDir, "skills");
  if (!fs.existsSync(skillsDir)) return records;

  for (const entry of fs.readdirSync(skillsDir)) {
    if (entry.startsWith(".")) continue;
    const full = path.join(skillsDir, entry);
    if (!fs.statSync(full).isDirectory()) continue;

    const skillMd = path.join(full, "SKILL.md");
    if (!fs.existsSync(skillMd)) continue;

    const raw = fs.readFileSync(skillMd, "utf8");
    const parsed = parseMarkdownSkill(skillMd, raw);
    const slug = sanitizeSlug(entry);
    const meta = indexMap.get(slug) || {};

    records.push({
      slug,
      title: parsed.title || meta.title || entry,
      description:
        parsed.description ||
        meta.description ||
        `Specialized skill for ${entry}`,
      content: parsed.content,
      sourceRepo: "agentic-awesome-skills",
      sourcePath: path.relative(baseDir, skillMd),
      rawCategory: parsed.category || meta.category,
      rawRisk: meta.risk,
      rawSourceType: meta.source,
      tags: parsed.tags.length ? parsed.tags : meta.tags || [],
    });
  }

  return records;
}

async function runPipeline() {
  console.log(
    "=================================================================",
  );
  console.log("🚀 STARTING SKILLS INGESTION, AUDIT & DEDUPLICATION PIPELINE");
  console.log(
    "=================================================================\n",
  );

  const claudeSkillsDir = path.resolve("scratch/raw-skills/claude-skills");
  const aasSkillsDir = path.resolve(
    "scratch/raw-skills/agentic-awesome-skills",
  );
  const outDir = path.resolve("scratch/skills-vault");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Collection
  console.log("📦 Phase 1: Collecting raw skills from both repositories...");
  const claudeRaw = collectClaudeSkills(claudeSkillsDir);
  console.log(
    `   Found ${claudeRaw.length} raw skills in claude-skills (Rank 1).`,
  );

  const aasRaw = collectAasSkills(aasSkillsDir);
  console.log(
    `   Found ${aasRaw.length} raw skills in agentic-awesome-skills (Rank 2).`,
  );
  const totalScanned = claudeRaw.length + aasRaw.length;
  console.log(`   Total raw skills cataloged: ${totalScanned}\n`);

  // 2. Deduplication & Priority Selection
  console.log("🔍 Phase 2: Deduplication with Source Priority Cascade...");
  const keptMap = new Map<string, RawSkillRecord>();
  const duplicateRejections: DuplicateRejection[] = [];
  const qualityRejections: QualityRejection[] = [];

  // Pass 1: Ingest Rank 1 (claude-skills)
  for (const skill of claudeRaw) {
    if (skill.content.length < 150) {
      qualityRejections.push({
        slug: skill.slug,
        sourceRepo: skill.sourceRepo,
        reason: `Empty stub (< 150 characters, was ${skill.content.length})`,
      });
      continue;
    }
    if (keptMap.has(skill.slug)) {
      duplicateRejections.push({
        slug: skill.slug,
        keptSource: keptMap.get(skill.slug)!.sourcePath,
        discardedSource: skill.sourcePath,
        keptTitle: keptMap.get(skill.slug)!.title,
        discardedTitle: skill.title,
      });
    } else {
      keptMap.set(skill.slug, skill);
    }
  }

  // Pass 2: Ingest Rank 2 (agentic-awesome-skills)
  for (const skill of aasRaw) {
    // Quality check 1: Empty or trivial content
    if (skill.content.length < 150) {
      qualityRejections.push({
        slug: skill.slug,
        sourceRepo: skill.sourceRepo,
        reason: `Empty stub (< 150 characters, was ${skill.content.length})`,
      });
      continue;
    }

    // Quality check 2: Personal agency private prompts
    if (
      skill.rawSourceType === "personal" ||
      skill.rawCategory === "andruia" ||
      skill.rawCategory === "leiloeiro"
    ) {
      qualityRejections.push({
        slug: skill.slug,
        sourceRepo: skill.sourceRepo,
        reason: `Personal private agency workflow (source: personal / proprietary)`,
      });
      continue;
    }

    // Deduplication check: Has higher-ranking claude-skills version already?
    if (keptMap.has(skill.slug)) {
      const existing = keptMap.get(skill.slug)!;
      duplicateRejections.push({
        slug: skill.slug,
        keptSource: `${existing.sourceRepo}:${existing.sourcePath}`,
        discardedSource: `${skill.sourceRepo}:${skill.sourcePath}`,
        keptTitle: existing.title,
        discardedTitle: skill.title,
      });
    } else {
      keptMap.set(skill.slug, skill);
    }
  }

  console.log(`   Duplicates removed: ${duplicateRejections.length}`);
  console.log(
    `   Quality / Stub / Personal rejections: ${qualityRejections.length}`,
  );
  console.log(`   Unique candidates remaining: ${keptMap.size}\n`);

  // 3. Rigorous Security Audit
  console.log("🛡️ Phase 3: Rigorous Security Audit & Threat Hardening...");
  const securityRejections: SecurityRejection[] = [];
  const cleanSkills: CleanSkillRecord[] = [];

  for (const [slug, rawSkill] of keptMap.entries()) {
    const secViolation = auditSkillSecurity(rawSkill);
    if (secViolation) {
      securityRejections.push(secViolation);
      continue;
    }

    const standardCategory = mapToStandardCategory(
      rawSkill.rawCategory,
      rawSkill.tags,
      rawSkill.content,
    );
    const toolsRequired = detectToolsRequired(rawSkill.content);

    cleanSkills.push({
      id: crypto.randomUUID(),
      name: slug,
      title: rawSkill.title,
      description: rawSkill.description,
      content: rawSkill.content,
      category: standardCategory,
      tags: Array.from(new Set([...rawSkill.tags, standardCategory])),
      toolsRequired,
      sourceRepo: rawSkill.sourceRepo,
      sourcePath: rawSkill.sourcePath,
      originalRisk: rawSkill.rawRisk,
    });
  }

  console.log(
    `   Risky / Offensive / Malicious skills removed: ${securityRejections.length}`,
  );
  console.log(`   Final verified, clean skills: ${cleanSkills.length}\n`);

  // 4. Category Distribution
  const categoryCounts: Record<string, number> = {};
  for (const s of cleanSkills) {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
  }

  // 5. Save Artifacts & Reports
  const vaultPath = path.join(outDir, "clean_skills_vault.json");
  const securityReportPath = path.join(outDir, "security_audit_report.json");
  const duplicatesReportPath = path.join(outDir, "duplicates_report.json");
  const qualityReportPath = path.join(outDir, "quality_report.json");
  const summaryReportPath = path.join(outDir, "pipeline_summary.json");

  fs.writeFileSync(vaultPath, JSON.stringify(cleanSkills, null, 2), "utf8");
  fs.writeFileSync(
    securityReportPath,
    JSON.stringify(securityRejections, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    duplicatesReportPath,
    JSON.stringify(duplicateRejections, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    qualityReportPath,
    JSON.stringify(qualityRejections, null, 2),
    "utf8",
  );

  const summary = {
    totalScanned,
    claudeSkillsFound: claudeRaw.length,
    aasSkillsFound: aasRaw.length,
    duplicatesRemoved: duplicateRejections.length,
    qualityStubsRemoved: qualityRejections.length,
    securityRisksRemoved: securityRejections.length,
    finalCleanSkills: cleanSkills.length,
    categoryDistribution: categoryCounts,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(summaryReportPath, JSON.stringify(summary, null, 2), "utf8");

  console.log(
    "=================================================================",
  );
  console.log("✅ PIPELINE COMPLETED SUCCESSFULLY!");
  console.log(
    "=================================================================",
  );
  console.log(`📊 Summary of Metrics:`);
  console.log(`   - Total Skills Scanned:        ${totalScanned}`);
  console.log(`   - From claude-skills:          ${claudeRaw.length}`);
  console.log(`   - From agentic-awesome-skills: ${aasRaw.length}`);
  console.log(
    `   - Duplicates Removed:          ${duplicateRejections.length}`,
  );
  console.log(`   - Quality/Stub/Personal Filter:${qualityRejections.length}`);
  console.log(`   - Security Risks Removed:      ${securityRejections.length}`);
  console.log(`   -------------------------------------------------`);
  console.log(`   🌟 FINAL CLEAN AUDITED VAULT:  ${cleanSkills.length} SKILLS`);
  console.log(`\n📂 Category Distribution:`);
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`   • ${cat.padEnd(14)} : ${count} skills`);
  }
  console.log(`\n💾 Saved Clean Vault to: ${vaultPath}`);
  console.log(`💾 Saved Security Audit to: ${securityReportPath}`);
}

runPipeline().catch(console.error);
