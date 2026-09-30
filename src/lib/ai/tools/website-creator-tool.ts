import { tool } from "ai";
import { readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";

interface StyleSeed {
  id: string;
  name: string;
  palette: string[];
  font: string;
  bodyFont: string;
  mood: string;
  layoutStyle: string;
  animationStyle: string;
  bestFor: string[];
}

interface Effect3D {
  id: string;
  name: string;
  description: string;
  implementation: string;
  complexity: string;
  bestFor: string[];
  aiHint: string;
}

export const getWebsiteContextTool = tool({
  name: "get_website_context",
  description:
    "Call this tool whenever the user wants to create any kind of web page, " +
    "website, landing page, UI prototype, web component, product showcase, " +
    "portfolio, or anything that runs in a browser and needs visual design. " +
    "You decide based on intent — not keywords. This tool returns style " +
    "guidelines, a design seed, and generation rules to produce a unique, " +
    "high-quality website.",
  inputSchema: z.object({
    industry: z
      .string()
      .optional()
      .describe(
        "The user's industry or business type (e.g. 'coffee shop', " +
          "'saas startup', 'photography'). Used to match the best style seed. " +
          "Leave empty if unknown.",
      ),
    wants3d: z
      .boolean()
      .default(false)
      .describe("Whether the user wants a 3D or animated background effect."),
    preferredStyle: z
      .string()
      .optional()
      .describe(
        "If the user mentioned a specific style (e.g. 'minimal', 'dark', " +
          "'luxury'), pass it here to help seed selection.",
      ),
  }),
  execute: async ({ industry, wants3d, preferredStyle }) => {
    const skillsDir = join(process.cwd(), "src/lib/ai/skills/website-creator");

    const seeds: StyleSeed[] = JSON.parse(
      readFileSync(join(skillsDir, "style-seeds.json"), "utf-8"),
    );
    const effects: Effect3D[] = JSON.parse(
      readFileSync(join(skillsDir, "3d-effects.json"), "utf-8"),
    );
    const skillMd = readFileSync(join(skillsDir, "SKILL.md"), "utf-8");

    // ── Seed selection: industry keyword match ────────────────────────────
    let selectedSeed: StyleSeed | undefined;

    if (industry) {
      const keyword = industry.toLowerCase();
      selectedSeed = seeds.find((s) =>
        s.bestFor.some(
          (tag) =>
            keyword.includes(tag) || tag.includes(keyword.split(" ")[0] ?? ""),
        ),
      );
    }

    // ── Seed selection: preferred style fallback ──────────────────────────
    if (!selectedSeed && preferredStyle) {
      const style = preferredStyle.toLowerCase();
      selectedSeed = seeds.find(
        (s) => s.mood.toLowerCase().includes(style) || s.id.includes(style),
      );
    }

    // ── Random fallback ───────────────────────────────────────────────────
    if (!selectedSeed) {
      selectedSeed = seeds[Math.floor(Math.random() * seeds.length)];
    }

    // ── 3D effect selection ───────────────────────────────────────────────
    let selectedEffect: Effect3D | null = null;
    if (wants3d) {
      selectedEffect =
        effects[Math.floor(Math.random() * effects.length)] ?? null;
    }

    // ── Creativity seed ───────────────────────────────────────────────────
    const creativitySeed = Math.floor(Math.random() * 99999);

    const effectNote =
      wants3d && selectedEffect
        ? `3D Effect: ${selectedEffect.name} — ${selectedEffect.description}`
        : "No 3D effect requested.";

    return {
      success: true,
      guidelines: skillMd,
      styleSeed: selectedSeed,
      effect3d: selectedEffect,
      creativitySeed,
      instruction:
        `Website Creator mode activated. Style seed: "${selectedSeed.name}" ` +
        `(${selectedSeed.mood}). Creativity seed: ${creativitySeed}. ` +
        `${effectNote}\n\nNow ask the user 3 quick questions before ` +
        `generating: (1) Brand/business name, (2) which sections to include ` +
        `(show options), (3) any specific colors or "let AI choose". ` +
        `Then generate the complete HTML.`,
    };
  },
});
