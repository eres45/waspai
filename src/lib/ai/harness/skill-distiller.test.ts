import { describe, it, expect } from "vitest";
import {
  detectRequiredTools,
  sanitizeSkillSlug,
  distillHermesSkill,
  autoEnrichSkillContent,
} from "./skill-distiller";

describe("skill-distiller (Hermes Compounding Skills)", () => {
  describe("detectRequiredTools", () => {
    it("detects known tools from free-form text", () => {
      const text =
        "First call web-search to find the latest research, then use generate-pdf to format the report.";
      const tools = detectRequiredTools(text);
      expect(tools).toContain("web-search");
      expect(tools).toContain("generate-pdf");
    });

    it("handles underscore and hyphen variations", () => {
      const text =
        "Use image_manager to create the asset and edit-image to modify it.";
      const tools = detectRequiredTools(text);
      expect(tools).toContain("image-manager");
      expect(tools).toContain("edit-image");
    });

    it("returns empty array for text with no tools", () => {
      const tools = detectRequiredTools("Just write a poem about trees.");
      expect(tools).toEqual([]);
    });
  });

  describe("sanitizeSkillSlug", () => {
    it("converts uppercase, spaces, and punctuation to valid slug", () => {
      expect(sanitizeSkillSlug("Novel Writer 2.0!")).toBe("novel-writer-2-0");
    });

    it("strips leading and trailing hyphens", () => {
      expect(sanitizeSkillSlug("---my-skill---")).toBe("my-skill");
    });

    it("falls back to default if empty", () => {
      expect(sanitizeSkillSlug("   ")).toBe("custom-skill");
    });
  });

  describe("distillHermesSkill", () => {
    it("compiles structured spec into complete Hermes SKILL.md", () => {
      const distilled = distillHermesSkill({
        name: "market-researcher",
        title: "Market Researcher",
        description:
          "Autonomous industry research and competitive landscape analysis",
        category: "research",
        tags: ["market", "strategy"],
        triggers: [
          "User asks for competitor analysis",
          "User requests industry report",
        ],
        prerequisites: ["Internet access enabled"],
        procedure: [
          {
            step: 1,
            action: "Search for top 5 industry competitors",
            tool: "web-search",
            failureRecovery: "Refine query with recent year and geography",
          },
          {
            step: 2,
            action: "Compile comparative table and export to PDF",
            tool: "generate-pdf",
          },
        ],
        failureModes: [
          {
            failure: "Competitor data is behind paywall",
            mitigation:
              "Search alternative regulatory filings and press releases",
          },
        ],
        verification: ["All top 5 competitors have revenue estimates"],
      });

      expect(distilled.slug).toBe("market-researcher");
      expect(distilled.category).toBe("research");
      expect(distilled.toolsRequired).toContain("web-search");
      expect(distilled.toolsRequired).toContain("generate-pdf");

      // Verify content structure
      expect(distilled.content).toContain("---");
      expect(distilled.content).toContain("name: market-researcher");
      expect(distilled.content).toContain("# Market Researcher");
      expect(distilled.content).toContain("## Trigger Conditions");
      expect(distilled.content).toContain("## Required Tools");
      expect(distilled.content).toContain("## Step-by-Step Procedure");
      expect(distilled.content).toContain(
        "1. **Search for top 5 industry competitors**",
      );
      expect(distilled.content).toContain("## Failure Modes & Self-Healing");
      expect(distilled.content).toContain("Competitor data is behind paywall");
      expect(distilled.content).toContain("## Verification Checklist");
      expect(distilled.content).toContain(
        "- [ ] All top 5 competitors have revenue estimates",
      );
    });
  });

  describe("autoEnrichSkillContent", () => {
    it("enriches unstructured raw notes into Hermes-compliant skill document", () => {
      const rawNotes = `
        To generate an executive brief:
        1. Query web-search for company metrics.
        2. Format summary and create QR code using qr-code-generator.
      `;

      const enriched = autoEnrichSkillContent(rawNotes, {
        title: "Executive Brief Generator",
        category: "productivity",
      });

      expect(enriched.slug).toBe("executive-brief-generator");
      expect(enriched.toolsRequired).toContain("web-search");
      expect(enriched.toolsRequired).toContain("qr-code-generator");
      expect(enriched.content).toContain("---");
      expect(enriched.content).toContain(
        "## Failure Modes & Self-Healing (Reflective Recovery)",
      );
      expect(enriched.content).toContain("## Verification Checklist");
    });

    it("preserves already structured skill markdown while collecting tools", () => {
      const structuredContent = `---
name: sample-skill
title: "Sample Skill"
description: "Sample description"
category: coding
tags: ["coding"]
tools_required: ["code-runner"]
version: 1.0.0
---

# Sample Skill
Sample description

## Step-by-Step Procedure
1. Run code-runner with python script.

## Failure Recovery & Self-Healing
- If script errors, fix syntax.

## Verification Checklist
- [ ] Output verified.
`;

      const enriched = autoEnrichSkillContent(structuredContent, {
        name: "sample-skill",
        title: "Sample Skill",
      });

      expect(enriched.toolsRequired).toContain("code-runner");
      expect(enriched.content).toBe(structuredContent.trim() + "\n");
    });
  });
});
