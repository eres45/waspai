import { describe, it, expect, beforeEach } from "vitest";
import {
  exitPlanModeTool,
  isPlanModeActive,
  setPlanModeActive,
  getApprovedPlan,
} from "./plan-tools";

describe("exitPlanModeTool (DeepSeek Harness plan-mode)", () => {
  const sessionId = "test-plan-session";

  beforeEach(() => {
    setPlanModeActive(sessionId, true);
  });

  it("approves valid markdown plan starting with # heading and leaves plan mode", async () => {
    expect(isPlanModeActive(sessionId)).toBe(true);

    const planMarkdown = `# Architecture Refactoring Plan
## Phase 1: Dependency Audit
Audit all current node modules.
## Phase 2: Implementation
Replace legacy modules with DeepSeek Harness adaptations.`;

    const result = (await (exitPlanModeTool as any).execute(
      { plan: planMarkdown },
      { sessionId },
    )) as any;

    expect(result.approved).toBe(true);
    expect(result.planHeading).toBe("Architecture Refactoring Plan");
    expect(isPlanModeActive(sessionId)).toBe(false);

    const saved = getApprovedPlan(sessionId);
    expect(saved?.plan).toBe(planMarkdown);
    expect(saved?.approvedAt).toBeDefined();
  });

  it("rejects plan without a # markdown heading", async () => {
    const invalidPlan = "Just a raw string with no heading at all.";

    await expect(
      (exitPlanModeTool as any).execute({ plan: invalidPlan }, { sessionId }),
    ).rejects.toThrow(
      "requires a structured markdown plan starting with a # heading",
    );
  });
});
