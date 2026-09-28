/**
 * DeepSeek Harness Tool Call Timeout Policy
 * Adapted from @deepseek-ai/dsh-tool-call-timeout-policy
 *
 * Enforces per-tool execution deadlines so hanging external APIs, deadlocked
 * subprocesses, or slow network requests fail fast with actionable diagnostics
 * instead of hanging the entire user stream until server timeout.
 */

export const DEFAULT_TOOL_TIMEOUTS: Record<string, number> = {
  "web-search": 12_000,
  "web-content": 15_000,
  "python-execution": 30_000,
  "mini-javascript-execution": 15_000,
  "video-gen": 60_000,
  "generate-presentation": 45_000,
  "generate-pdf": 30_000,
  "generate-word-document": 30_000,
  "generate-csv": 20_000,
  DEFAULT: 25_000,
};

export class ToolTimeoutError extends Error {
  public readonly isTimeout = true;
  public readonly toolName: string;
  public readonly timeoutMs: number;

  constructor(toolName: string, timeoutMs: number) {
    super(
      `TOOL_TIMEOUT: Tool '${toolName}' execution timed out after ${timeoutMs / 1000}s. The operation or external service did not complete in time. Try a simpler query, alter your parameters, or proceed with an alternative approach.`,
    );
    this.name = "ToolTimeoutError";
    this.toolName = toolName;
    this.timeoutMs = timeoutMs;
  }
}

export function getToolTimeoutMs(
  toolName: string,
  overrides?: Record<string, number>,
): number {
  if (overrides && typeof overrides[toolName] === "number") {
    return overrides[toolName];
  }
  return DEFAULT_TOOL_TIMEOUTS[toolName] ?? DEFAULT_TOOL_TIMEOUTS.DEFAULT;
}

/**
 * Wraps an asynchronous tool executor with a strict deadline timer.
 */
export async function executeWithTimeout<T>(
  toolName: string,
  executor: () => Promise<T>,
  options?: {
    timeoutMs?: number;
    timeoutOverrides?: Record<string, number>;
    signal?: AbortSignal;
  },
): Promise<T> {
  const timeoutMs =
    options?.timeoutMs ?? getToolTimeoutMs(toolName, options?.timeoutOverrides);

  if (timeoutMs <= 0 || !Number.isFinite(timeoutMs)) {
    return executor();
  }

  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ToolTimeoutError(toolName, timeoutMs));
    }, timeoutMs);
  });

  const abortPromise = new Promise<never>((_, reject) => {
    if (options?.signal?.aborted) {
      reject(
        new Error(`Operation aborted before '${toolName}' could complete`),
      );
    }
    options?.signal?.addEventListener(
      "abort",
      () => reject(new Error(`Operation aborted for '${toolName}'`)),
      { once: true },
    );
  });

  try {
    return await Promise.race([executor(), timeoutPromise, abortPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
