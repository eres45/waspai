import { describe, it, expect, beforeEach } from "vitest";
import { todoTool, getSessionTodos, clearSessionTodos } from "./todo-tool";

describe("todoTool (DeepSeek Harness tool-todo)", () => {
  const sessionId = "test-session-todo";

  beforeEach(() => {
    clearSessionTodos(sessionId);
  });

  it("records structured task list and computes counts", async () => {
    const input = {
      todos: [
        { content: "Research 2026 AI models", status: "completed" as const },
        { content: "Draft slide outlines", status: "in_progress" as const },
        { content: "Generate presentation deck", status: "pending" as const },
      ],
    };

    const result = (await (todoTool as any).execute(input, {
      sessionId,
    })) as any;

    expect(result.counts.completed).toBe(1);
    expect(result.counts.inProgress).toBe(1);
    expect(result.counts.pending).toBe(1);
    expect(result.counts.total).toBe(3);
    expect(result.summary).toContain("1/3 completed");

    const saved = getSessionTodos(sessionId);
    expect(saved?.length).toBe(3);
  });

  it("rejects duplicate task contents", async () => {
    const input = {
      todos: [
        { content: "Same task", status: "pending" as const },
        { content: "Same task", status: "in_progress" as const },
      ],
    };

    await expect(
      (todoTool as any).execute(input, { sessionId }),
    ).rejects.toThrow('Duplicate task description: "Same task"');
  });

  it("enforces single in_progress task rule", async () => {
    const input = {
      todos: [
        { content: "Task 1", status: "in_progress" as const },
        { content: "Task 2", status: "in_progress" as const },
      ],
    };

    await expect(
      (todoTool as any).execute(input, { sessionId }),
    ).rejects.toThrow("At most one task may be 'in_progress'");
  });
});
