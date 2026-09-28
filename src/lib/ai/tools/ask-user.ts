/**
 * Human-in-the-Loop User Question Tool.
 * Adapted from DeepSeek Harness (@deepseek-ai/dsh-tool-ask-user).
 *
 * Allows the agent to ask the user clarifying questions, present multiple-choice
 * options with tradeoffs, or seek confirmation before executing sensitive actions.
 */

import { tool as createTool } from "ai";
import { z } from "zod";

export const questionOptionSchema = z.union([
  z.string(),
  z.object({
    label: z.string().optional().default(""),
    text: z.string().optional(),
    description: z.string().optional(),
    value: z.string().optional(),
  }),
]);

export const userQuestionItemSchema = z.object({
  id: z.string().optional(),
  question: z.string().optional(),
  text: z.string().optional(),
  title: z.string().optional(),
  header: z.string().optional(),
  type: z.string().optional(),
  options: z.array(questionOptionSchema).optional().default([]),
  multiSelect: z.boolean().optional(),
  example: z.string().optional(),
  note: z.string().optional(),
});

export const askUserQuestionSchema = z.object({
  questions: z
    .array(userQuestionItemSchema)
    .min(1, "Must provide at least one question.")
    .describe("One or more questions to ask the user."),
  instructions: z
    .string()
    .optional()
    .describe(
      "Optional instructions or context for the user answering the questions.",
    ),
});

export const askUserQuestionTool = createTool({
  description:
    "Ask the user clarifying questions, architecture decisions, or requirement choices. Provides an interactive questionnaire UI.",
  inputSchema: askUserQuestionSchema,
  execute: async ({ questions, instructions }) => {
    const normalizedQuestions = (questions || []).map((q) => {
      const questionText = q.question || q.text || q.title || "Question";
      const isMulti = Boolean(
        q.multiSelect ||
          q.type === "multiple" ||
          q.note?.toLowerCase().includes("multiple"),
      );
      const normalizedOptions = (q.options || []).map((opt) => {
        if (typeof opt === "string") {
          return { label: opt, value: opt };
        }
        return {
          label: opt.label || opt.text || opt.value || "",
          description: opt.description,
          value: opt.value || opt.label || opt.text || "",
        };
      });
      return {
        id: q.id || `q_${Math.random().toString(36).slice(2, 8)}`,
        question: questionText,
        text: questionText,
        header: q.header,
        type:
          q.type ||
          (isMulti
            ? "multiple"
            : normalizedOptions.length > 0
              ? "choice"
              : "open"),
        options: normalizedOptions,
        multiSelect: isMulti,
        example: q.example,
        note: q.note,
      };
    });

    return {
      status: "pending_user_input",
      isUserQuestion: true,
      questions: normalizedQuestions,
      instructions,
      guide:
        "The question questionnaire has been rendered directly to the user. Await their response or explain the key considerations.",
    };
  },
});
