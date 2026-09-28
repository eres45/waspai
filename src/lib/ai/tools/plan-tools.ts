/**
 * Plan Mode & Review tools.
 * Adapted from DeepSeek Harness (@deepseek-ai/dsh-plan-mode).
 *
 * In Plan Mode, the model explores options, drafts a structured multi-phase
 * implementation plan, and presents it for user or supervisor approval via
 * `exit_plan_mode` before executing any destructive or costly actions.
 */

import { tool as createTool } from "ai";
import { z } from "zod";

const planStateStore = new Map<
  string,
  { active: boolean; plan?: string; approvedAt?: number }
>();

export function isPlanModeActive(sessionId: string): boolean {
  return planStateStore.get(sessionId)?.active ?? false;
}

export function setPlanModeActive(sessionId: string, active: boolean): void {
  const current = planStateStore.get(sessionId) || { active: false };
  planStateStore.set(sessionId, { ...current, active });
}

export function getApprovedPlan(
  sessionId: string,
): { plan?: string; approvedAt?: number } | null {
  const current = planStateStore.get(sessionId);
  if (!current?.plan) return null;
  return { plan: current.plan, approvedAt: current.approvedAt };
}

export const exitPlanModeSchema = z.object({
  plan: z
    .string()
    .min(10, "Plan markdown must be at least 10 characters.")
    .describe(
      "The complete, structured plan as markdown, starting with a top-level # heading naming the plan.",
    ),
});

export const exitPlanModeTool = createTool({
  description:
    "Use when in plan mode to present your completed implementation plan for user review. Once approved, leaves plan mode so you can carry out the plan from your next step. Must send the COMPLETE plan formatted in markdown starting with a # heading.",
  inputSchema: exitPlanModeSchema,
  execute: async ({ plan }, context) => {
    const sessionId =
      (context as any)?.threadId || (context as any)?.sessionId || "default";

    const trimmed = plan.trim();
    if (!/^#{1,6}\s+\S/m.test(trimmed)) {
      throw new Error(
        "exit_plan_mode requires a structured markdown plan starting with a # heading.",
      );
    }

    // Extract first heading
    const firstLine =
      trimmed.split("\n").find((line) => /^#{1,6}\s+/.test(line)) ||
      "# Execution Plan";
    const heading = firstLine.replace(/^#{1,6}\s+/, "").trim();

    // Store approved plan and switch plan mode to false
    planStateStore.set(sessionId, {
      active: false,
      plan: trimmed,
      approvedAt: Date.now(),
    });

    return {
      approved: true,
      planHeading: heading,
      planLength: trimmed.length,
      message: `Plan "${heading}" approved. Plan mode exited. Carry out the plan starting with your next step.`,
    };
  },
});
