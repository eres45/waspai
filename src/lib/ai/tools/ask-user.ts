/**
 * Human-in-the-Loop User Question Tool.
 * Adapted from DeepSeek Harness (@deepseek-ai/dsh-tool-ask-user).
 *
 * Allows the agent to ask the user clarifying questions, present multiple-choice
 * options with tradeoffs, or seek confirmation before executing sensitive actions.
 */

import { tool as createTool } from "ai";
import { z } from "zod";

export const questionOptionSchema = z.object({
  label: z
    .string()
    .describe("Short option label (e.g. 'PostgreSQL (Recommended)')."),
  description: z
    .string()
    .optional()
    .describe("One sentence explaining the technical tradeoff or impact."),
});

export const userQuestionItemSchema = z.object({
  id: z
    .string()
    .describe("Stable question ID (e.g. 'db_choice', 'confirm_deploy')."),
  question: z.string().describe("The specific question to ask the user."),
  header: z
    .string()
    .optional()
    .describe(
      "Short category header like 'Confirm Architecture' or 'Select Engine'.",
    ),
  options: z
    .array(questionOptionSchema)
    .optional()
    .describe(
      "Optional choices. If you recommend one, put it first and append '(Recommended)' to its label.",
    ),
  multiSelect: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether the user can select multiple options."),
});

export const askUserQuestionSchema = z.object({
  questions: z
    .array(userQuestionItemSchema)
    .min(1, "Must provide at least one question.")
    .describe("One or more questions to ask the user."),
});

export const askUserQuestionTool = createTool({
  description:
    "Ask the user a concise question when you need clarification, a decision between alternative architectures, or confirmation before proceeding. Provide structured options with tradeoffs whenever possible.",
  inputSchema: askUserQuestionSchema,
  execute: async ({ questions }) => {
    return {
      status: "pending_user_input",
      isUserQuestion: true,
      questions: questions.map((q) => ({
        id: q.id,
        header: q.header,
        question: q.question,
        options: q.options || [],
        multiSelect: Boolean(q.multiSelect),
      })),
      guide:
        "The question has been presented to the user. Await their response or explain the alternatives clearly in your answer.",
    };
  },
});
