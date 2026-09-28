/**
 * Model-facing Todo & Step Tracker tool.
 * Adapted from DeepSeek Harness (@deepseek-ai/dsh-tool-todo).
 *
 * Allows the agent to maintain and stream a live, structured checklist of tasks:
 * [ { content: "...", status: "pending" | "in_progress" | "completed" } ]
 *
 * Each call sends the ENTIRE updated list, providing a reliable progress anchor
 * throughout complex multi-step reasoning cycles.
 */

import { tool as createTool } from "ai";
import { z } from "zod";

export const todoStatusSchema = z.enum(["pending", "in_progress", "completed"]);
export type TodoStatus = z.infer<typeof todoStatusSchema>;

export const todoItemSchema = z.object({
  id: z.string().optional(),
  content: z
    .string()
    .min(1, "Task description must not be empty.")
    .describe(
      "What the task is — a short imperative line (e.g. 'Search 2026 AI models').",
    ),
  status: todoStatusSchema.describe(
    "pending (not started) | in_progress (actively being worked on) | completed (done).",
  ),
});

export type TodoItem = z.infer<typeof todoItemSchema>;

export const todoWriteSchema = z.object({
  todos: z
    .array(todoItemSchema)
    .min(1, "Task list must contain at least one item.")
    .describe(
      "The COMPLETE task list, replacing any previous list. Mark tasks completed the moment they finish.",
    ),
});

// Session-scoped in-memory store for active todo projections
const sessionTodoStore = new Map<string, TodoItem[]>();

export function getSessionTodos(sessionId: string): TodoItem[] | null {
  return sessionTodoStore.get(sessionId) ?? null;
}

export function clearSessionTodos(sessionId: string): void {
  sessionTodoStore.delete(sessionId);
}

export const todoTool = createTool({
  description:
    "Record and update a structured task checklist for multi-step work. Send the ENTIRE list every call — it REPLACES the previous list. Use it before starting complex tasks: add one item per concrete step. Keep at most one item 'in_progress' at a time. Mark items 'completed' as soon as they finish. Statuses: pending, in_progress, completed.",
  inputSchema: todoWriteSchema,
  execute: async ({ todos }, context) => {
    const sessionId =
      (context as any)?.threadId || (context as any)?.sessionId || "default";

    // Validate and canonicalize
    const cleanTodos: TodoItem[] = [];
    const seen = new Set<string>();
    let inProgressCount = 0;

    for (let i = 0; i < todos.length; i++) {
      const item = todos[i];
      const content = item.content.trim();
      if (!content) continue;
      if (seen.has(content)) {
        throw new Error(`Duplicate task description: "${content}"`);
      }
      seen.add(content);

      if (item.status === "in_progress") {
        inProgressCount++;
      }

      cleanTodos.push({
        id: item.id || `todo-${i + 1}`,
        content,
        status: item.status,
      });
    }

    if (inProgressCount > 1) {
      throw new Error(
        `Invalid task list: At most one task may be 'in_progress' at a time for sequential execution (got ${inProgressCount}).`,
      );
    }

    // Persist in session store
    sessionTodoStore.set(sessionId, cleanTodos);

    const counts = {
      pending: cleanTodos.filter((t) => t.status === "pending").length,
      inProgress: inProgressCount,
      completed: cleanTodos.filter((t) => t.status === "completed").length,
      total: cleanTodos.length,
    };

    return {
      todos: cleanTodos,
      counts,
      summary: `Task checklist updated: ${counts.completed}/${counts.total} completed, ${counts.inProgress} in progress, ${counts.pending} pending.`,
    };
  },
});
