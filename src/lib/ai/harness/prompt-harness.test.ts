import { describe, it, expect } from "vitest";
import {
  detectModelCognitiveProfile,
  buildIdentityBlock,
  buildUserInfoBlock,
  buildToolProtocolBlock,
  buildWebSearchDirective,
  buildVisualizationDirective,
  buildMemoryDirective,
  buildBrowserDirective,
  buildPresentationDirective,
  buildFormattingDirective,
  assembleHarnessedSystemPrompt,
} from "./prompt-harness";

describe("Prompt Harness Core (DeepSeek + Hermes 3 Standard)", () => {
  describe("detectModelCognitiveProfile", () => {
    it("identifies reasoning models correctly", () => {
      expect(detectModelCognitiveProfile("deepseek-r1").isReasoning).toBe(true);
      expect(detectModelCognitiveProfile("deepseek-reasoner").isReasoning).toBe(
        true,
      );
      expect(detectModelCognitiveProfile("o1-preview").isReasoning).toBe(true);
      expect(detectModelCognitiveProfile("o3-mini").isReasoning).toBe(true);
      expect(detectModelCognitiveProfile("qwq-32b").isReasoning).toBe(true);
      expect(detectModelCognitiveProfile("kimi-k1.5").isReasoning).toBe(true);
    });

    it("identifies non-reasoning standard models correctly", () => {
      expect(detectModelCognitiveProfile("gpt-4o").isReasoning).toBe(false);
      expect(detectModelCognitiveProfile("deepseek-v4-flash").isReasoning).toBe(
        false,
      );
      expect(detectModelCognitiveProfile("claude-haiku-4.5").isReasoning).toBe(
        false,
      );
      expect(detectModelCognitiveProfile("mistral-small-4").isReasoning).toBe(
        false,
      );
    });

    it("identifies voice mode correctly", () => {
      const voiceProfile = detectModelCognitiveProfile("gpt-4o", true);
      expect(voiceProfile.isVoice).toBe(true);
    });
  });

  describe("buildIdentityBlock", () => {
    it("sets Wasp VoidFlash identity for waspai model", () => {
      const profile = detectModelCognitiveProfile("waspai-model");
      const block = buildIdentityBlock(
        profile,
        undefined,
        undefined,
        "waspai-model",
      );
      expect(block).toContain("Wasp VoidFlash");
      expect(block).toContain("waspai.in");
      expect(block).toContain("Current Date & Time:");
    });

    it("sets default assistant name when no custom agent is provided", () => {
      const profile = detectModelCognitiveProfile("deepseek-v4");
      const block = buildIdentityBlock(
        profile,
        undefined,
        undefined,
        "deepseek-v4",
      );
      expect(block).toContain("You are Wasp AI.");
    });
  });

  describe("buildUserInfoBlock", () => {
    it("renders user details cleanly without mojibake", () => {
      const user = { name: "Alex Developer", email: "alex@example.com" } as any;
      const userPreferences = { profession: "Full-Stack Engineer" } as any;
      const block = buildUserInfoBlock(user, userPreferences);

      expect(block).toContain("<user_information>");
      expect(block).toContain("Name: Alex Developer");
      expect(block).toContain("Email: alex@example.com");
      expect(block).toContain("Profession: Full-Stack Engineer");
      expect(block).toContain("</user_information>");
    });

    it("returns empty string when no user details are provided", () => {
      expect(buildUserInfoBlock(undefined, undefined)).toBe("");
    });
  });

  describe("buildToolProtocolBlock", () => {
    it("enforces Hermes standard tool invocation rules", () => {
      const profile = detectModelCognitiveProfile("gpt-4o");
      const block = buildToolProtocolBlock(profile);

      expect(block).toContain("<tool_protocol>");
      expect(block).toContain("Native Execution");
      expect(block).toContain("<invoke>");
      expect(block).toContain("Proactive Real-Time Search");
      expect(block).toContain("Anti-Hallucination");
    });

    it("returns silent voice protocol when in voice mode", () => {
      const profile = detectModelCognitiveProfile("gpt-4o", true);
      const block = buildToolProtocolBlock(profile);

      expect(block).toContain("<voice_tool_protocol>");
      expect(block).toContain("Silent Operations");
    });
  });

  describe("individual directive builders", () => {
    it("builds web search directive with inline citation rules", () => {
      const directive = buildWebSearchDirective();
      expect(directive).toContain("<web_search_guidelines>");
      expect(directive).toContain("Inline Citations");
    });

    it("builds visualization directive with chart rules", () => {
      const directive = buildVisualizationDirective();
      expect(directive).toContain("<visualization_guidelines>");
      expect(directive).toContain("createBarChart");
      expect(directive).toContain("createLineChart");
    });

    it("builds memory directive with 2-week test", () => {
      const directive = buildMemoryDirective();
      expect(directive).toContain("<memory_guidelines>");
      expect(directive).toContain("The 2-Week Value Test");
    });

    it("builds browser automation directive with session reuse rules", () => {
      const directive = buildBrowserDirective();
      expect(directive).toContain("<browser_automation_guidelines>");
      expect(directive).toContain("activeSessionId");
    });

    it("builds presentation directive with dynamic mixing rules", () => {
      const directive = buildPresentationDirective();
      expect(directive).toContain("<presentation_creation_guidelines>");
      expect(directive).toContain("generate-presentation");
      expect(directive).toContain("bento-modern");
    });
  });

  describe("buildFormattingDirective", () => {
    it("adapts directive for reasoning models without rigid thought micromanagement", () => {
      const profile = detectModelCognitiveProfile("deepseek-r1");
      const block = buildFormattingDirective(profile);

      expect(block).toContain("Unconstrained Reasoning");
      expect(block).not.toContain(
        "PRIORITY ORDER (Perform these steps silently in your head",
      );
    });

    it("provides clean structured guidance for standard models", () => {
      const profile = detectModelCognitiveProfile("deepseek-v4");
      const block = buildFormattingDirective(profile);

      expect(block).toContain("Structure & Hierarchy");
      expect(block).toContain("mermaid");
    });
  });

  describe("assembleHarnessedSystemPrompt", () => {
    it("assembles complete, clean, high-signal system prompt", () => {
      const prompt = assembleHarnessedSystemPrompt({
        modelId: "deepseek-v4-flash",
        user: { name: "Sam", email: "sam@example.com" } as any,
        userPreferences: { profession: "Data Scientist" } as any,
        hasUploadedFiles: true,
      });

      expect(prompt).toContain("You are Wasp AI.");
      expect(prompt).toContain("<user_information>");
      expect(prompt).toContain("<tool_protocol>");
      expect(prompt).toContain("<web_search_guidelines>");
      expect(prompt).toContain("<visualization_guidelines>");
      expect(prompt).toContain("<memory_guidelines>");
      expect(prompt).toContain("[DOCUMENT READING SERVICE ENABLED]");
      expect(prompt).toContain("<response_formatting_guidelines>");

      // Ensure zero mojibake broken characters
      expect(prompt).not.toContain("ðŸŽ¨");
      expect(prompt).not.toContain("â€”");
      expect(prompt).not.toContain("â†’");
    });

    it("assembles concise voice prompt when in voice mode", () => {
      const prompt = assembleHarnessedSystemPrompt({
        modelId: "gpt-4o",
        isVoice: true,
      });

      expect(prompt).toContain("[LIVE REAL-TIME VOICE CALL ACTIVE]");
      expect(prompt).toContain("<voice_tool_protocol>");
      expect(prompt).not.toContain("<visualization_guidelines>");
      expect(prompt).not.toContain("<browser_automation_guidelines>");
    });

    it("measures prompt token footprint and compression", () => {
      const standardPrompt = assembleHarnessedSystemPrompt({
        modelId: "deepseek-v4-flash",
        user: { name: "Sam", email: "sam@example.com" } as any,
        userPreferences: { profession: "Engineer" } as any,
      });

      const reasoningPrompt = assembleHarnessedSystemPrompt({
        modelId: "deepseek-r1",
        user: { name: "Sam", email: "sam@example.com" } as any,
      });

      const voicePrompt = assembleHarnessedSystemPrompt({
        modelId: "gpt-4o",
        isVoice: true,
      });

      console.log(
        `[HARNESS METRICS] Standard: ${standardPrompt.length} chars, ${standardPrompt.split(/\s+/).length} words, ~${Math.round(standardPrompt.length / 3.7)} tokens`,
      );
      console.log(
        `[HARNESS METRICS] Reasoning: ${reasoningPrompt.length} chars, ${reasoningPrompt.split(/\s+/).length} words, ~${Math.round(reasoningPrompt.length / 3.7)} tokens`,
      );
      console.log(
        `[HARNESS METRICS] Voice: ${voicePrompt.length} chars, ${voicePrompt.split(/\s+/).length} words, ~${Math.round(voicePrompt.length / 3.7)} tokens`,
      );

      expect(standardPrompt.length).toBeLessThan(8500);
      expect(voicePrompt.length).toBeLessThan(1200);
    });
  });
});
