/**
 * Model-Facing Subagent Delegation Tool.
 * Adapted from DeepSeek Harness (@deepseek-ai/dsh-subagent-spawn-in-process & @deepseek-ai/dsh-tool-subagent).
 *
 * Allows a parent agent to spawn a focused, in-process child subagent for
 * offloading targeted tasks (e.g. multi-source research, detailed synthesis, code analysis)
 * without polluting the parent conversation's context window.
 */

import { tool as createTool, generateText, stepCountIs } from "ai";
import { z } from "zod";
import { customModelProvider } from "lib/ai/models";
import { webSearchTool } from "./web/web-search";
import globalLogger from "logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("cyan", "Subagent: "),
});

export const delegateSubagentSchema = z.preprocess(
  (val) => (val && typeof val === "object" ? val : {}),
  z.object({
    description: z
      .string()
      .min(1)
      .default("Autonomous Subagent Task")
      .describe(
        "A short 3-5 word title of the delegated subtask (e.g. 'Analyze competitor API pricing').",
      ),
    prompt: z
      .string()
      .min(1)
      .default(
        "Perform the requested research and return a structured synthesis.",
      )
      .describe(
        "The complete, self-contained instruction for the subagent. The subagent works in its own isolated context, so include all necessary constraints, context, and expected output formats.",
      ),
    allowWebSearch: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "Whether to allow the child subagent to perform real-time web searches.",
      ),
    model: z
      .string()
      .optional()
      .describe(
        "Optional model override for the child subagent (e.g. 'gpt-oss-120b').",
      ),
  }),
);

export const subagentTool = createTool({
  description:
    "Delegate a focused, self-contained task to an in-process child subagent that works in its own clean context window. Use this to offload deep multi-query research, code verification, or data synthesis without bloating your main conversation context. You receive the subagent's final synthesized result.",
  inputSchema: delegateSubagentSchema,
  execute: async ({ description, prompt, allowWebSearch, model }) => {
    const subagentId = `subagent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    logger.info(`Starting subagent [${subagentId}]: "${description}"`);

    const childTools: Record<string, any> = {};
    if (allowWebSearch) {
      childTools["web-search"] = webSearchTool;
    }

    try {
      const isKnownWorkingModel =
        model &&
        model !== "gpt-4o-mini" &&
        !model.toLowerCase().includes("gpt-4") &&
        !model.toLowerCase().includes("claude");

      const selectedModel = isKnownWorkingModel
        ? { provider: "OpenAI", model }
        : { provider: "OpenAI", model: "gpt-oss-120b" };

      const modelInstance = customModelProvider.getModel(selectedModel);

      let result: any;
      try {
        result = await generateText({
          model: modelInstance as any,
          system:
            "You are a specialized autonomous subagent executing a focused delegation on behalf of the primary agent. Work directly on the task, conduct any necessary research or computation using your available tools, and produce a well-structured, comprehensive, and concise final synthesis. Do not include conversational filler.",
          prompt,
          tools: childTools as any,
          stopWhen: stepCountIs(5),
        });
      } catch (callErr) {
        // Fallback to default gpt-oss-120b if custom model invocation fails
        logger.warn(
          `Subagent model call failed. Falling back to default gpt-oss-120b:`,
          callErr,
        );
        const fallbackModel = customModelProvider.getModel({
          provider: "OpenAI",
          model: "gpt-oss-120b",
        });
        result = await generateText({
          model: fallbackModel as any,
          system:
            "You are a specialized autonomous subagent executing a focused delegation on behalf of the primary agent. Work directly on the task, conduct any necessary research or computation using your available tools, and produce a well-structured, comprehensive, and concise final synthesis. Do not include conversational filler.",
          prompt,
          tools: childTools as any,
          stopWhen: stepCountIs(5),
        });
      }

      logger.info(`Subagent [${subagentId}] completed successfully`);

      return {
        subagentId,
        description,
        status: "completed",
        result: result.text,
      };
    } catch (err: any) {
      logger.error(`Subagent [${subagentId}] failed:`, err);
      return {
        subagentId,
        description,
        status: "failed",
        error: err.message || String(err),
        fallbackAdvice:
          "The subagent encountered an execution error. You can either perform the step yourself directly or adjust the delegated prompt.",
      };
    }
  },
});
