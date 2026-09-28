/**
 * Model-facing tool to read sections of spilled oversized tool outputs.
 * Adapted from DeepSeek Harness (@deepseek-ai/dsh-spill).
 */

import { tool as createTool } from "ai";
import { z } from "zod";
import { defaultSpillStore } from "lib/ai/harness/spill-policy";

export const readSpillSliceSchema = z.object({
  locator: z
    .string()
    .describe("The spill file path returned in the spill overflow notice."),
  startLine: z
    .number()
    .min(1)
    .default(1)
    .describe("The 1-indexed line number to start reading from."),
  lineCount: z
    .number()
    .min(1)
    .max(500)
    .default(100)
    .describe("Number of lines to read (max 500)."),
});

export const readSpillSliceTool = createTool({
  description:
    "Read a specific line range from an oversized spilled tool output file. Use this when a prior tool call's result was spilled to disk and you need to inspect more details.",
  inputSchema: readSpillSliceSchema,
  execute: async ({ locator, startLine, lineCount }) => {
    try {
      const slice = await defaultSpillStore.readSlice(
        locator,
        startLine,
        lineCount,
      );
      return {
        locator,
        startLine: slice.startLine,
        endLine: slice.endLine,
        totalLines: slice.totalLines,
        content: slice.content,
      };
    } catch (err: any) {
      return {
        error: `Failed to read spill slice from ${locator}: ${err.message}`,
      };
    }
  },
});
