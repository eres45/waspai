/**
 * DeepSeek Harness Tool Result Spill Policy
 * Adapted from @deepseek-ai/dsh-spill-policy and @deepseek-ai/dsh-spill-local
 *
 * Keeps oversized tool results (e.g. massive bash outputs, huge web page scrapes,
 * large SQL/JSON dumps) out of the LLM context window by saving the complete
 * text to a private session-scoped spill file, replacing the model-facing
 * observation with a bounded Head/Tail preview plus a retrieval locator.
 */

import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { writeFileAtomic } from "lib/atomic-write";
import globalLogger from "logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("cyan", "SpillPolicy: "),
});

export const DEFAULT_MAX_INLINE_BYTES = 80_000; // ~20,000 tokens

export const NO_SPILL_TOOLS = new Set([
  "read_spill_slice",
  "read_site_file",
  "read_file",
  "write_site_file",
  "write_file",
  "edit_site_file",
  "edit_file",
  "html_preview",
  "presentation_generator",
  "get_website_context",
  "todo_write",
  "exit_plan_mode",
]);

export interface SpillRef {
  locator: string;
  totalBytes: number;
  omittedBytes: number;
  lineCount: number;
}

export interface SpillOptions {
  maxInlineBytes?: number;
  spillRoot?: string;
  sessionId?: string;
}

export class SpillStore {
  private readonly spillRoot: string;

  constructor(spillRoot?: string) {
    this.spillRoot = spillRoot || join(process.cwd(), ".spill");
  }

  public async saveSpill(
    sessionId: string,
    toolName: string,
    content: string,
  ): Promise<SpillRef> {
    const timestamp = Date.now();
    const cleanToolName = toolName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${timestamp}-${cleanToolName}.txt`;
    const targetPath = join(this.spillRoot, sessionId || "default", filename);

    const totalBytes = Buffer.byteLength(content, "utf8");
    const lineCount = content.split("\n").length;

    await writeFileAtomic(targetPath, content, { mode: 0o644 });

    logger.info(
      `Spilled oversized output for '${toolName}' (${totalBytes} bytes, ${lineCount} lines) -> ${targetPath}`,
    );

    return {
      locator: targetPath,
      totalBytes,
      omittedBytes: 0,
      lineCount,
    };
  }

  public async readSlice(
    locator: string,
    startLine = 1,
    lineCount = 100,
  ): Promise<{
    content: string;
    startLine: number;
    endLine: number;
    totalLines: number;
  }> {
    const raw = await readFile(locator, "utf8");
    const lines = raw.split("\n");
    const totalLines = lines.length;

    const actualStart = Math.max(1, startLine);
    const actualEnd = Math.min(totalLines, actualStart + lineCount - 1);
    const sliceLines = lines.slice(actualStart - 1, actualEnd);

    return {
      content: sliceLines.join("\n"),
      startLine: actualStart,
      endLine: actualEnd,
      totalLines,
    };
  }
}

export const defaultSpillStore = new SpillStore();

/**
 * Checks if a tool result exceeds maxInlineBytes and spills it if necessary.
 */
export async function applySpillPolicy(
  toolName: string,
  result: any,
  options?: SpillOptions,
): Promise<any> {
  // Never spill tools that require full content in LLM context (e.g. site file readers/writers, previewers)
  if (NO_SPILL_TOOLS.has(toolName) || !result) {
    return result;
  }

  const maxBytes = options?.maxInlineBytes ?? DEFAULT_MAX_INLINE_BYTES;
  const store = new SpillStore(options?.spillRoot);
  const sessionId = options?.sessionId || "global-session";

  let textToMeasure = "";
  let isJson = false;

  if (typeof result === "string") {
    textToMeasure = result;
  } else if (typeof result === "object") {
    // Check if it's already an error envelope or non-spillable
    if (result.isReflectiveError || result.isCircuitBreaker) {
      return result;
    }
    try {
      textToMeasure = JSON.stringify(result, null, 2);
      isJson = true;
    } catch {
      return result;
    }
  } else {
    return result;
  }

  const totalBytes = Buffer.byteLength(textToMeasure, "utf8");
  if (totalBytes <= maxBytes) {
    return result;
  }

  // Spill to disk
  const spillRef = await store.saveSpill(sessionId, toolName, textToMeasure);

  // Compute Head/Tail Preview
  const reserveNoticeBytes = 300;
  const previewBudget = Math.max(500, maxBytes - reserveNoticeBytes);
  const headBudget = Math.floor(previewBudget * 0.7);
  const tailBudget = Math.floor(previewBudget * 0.3);

  const head = textToMeasure.slice(0, headBudget);
  const tail = textToMeasure.slice(-tailBudget);
  const omitted = totalBytes - (headBudget + tailBudget);

  const notice = `\n\n[... SPILL OVERFLOW: ${omitted.toLocaleString()} bytes omitted. Full formatted result (${spillRef.totalBytes.toLocaleString()} bytes, ${spillRef.lineCount} lines) stored at: ${spillRef.locator}. Use 'read_spill_slice' with this locator to inspect specific line ranges ...]`;

  const spilledText = `${head}${notice}\n\n${tail}`;

  if (isJson) {
    return {
      _spilled: true,
      locator: spillRef.locator,
      totalBytes: spillRef.totalBytes,
      totalLines: spillRef.lineCount,
      preview: spilledText,
    };
  }

  return spilledText;
}
