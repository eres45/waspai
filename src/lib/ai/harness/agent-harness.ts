import globalLogger from "logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("cyan", "AgentHarness: "),
});

export interface CircuitBreakerCheckResult {
  allowed: boolean;
  reason?: string;
  fingerprint?: string;
  executionCount?: number;
}

export interface ReflectiveErrorEnvelope {
  status: "error";
  isReflectiveError: true;
  tool: string;
  error: string;
  resolutionHint: string;
}

export interface CircuitBreakerEnvelope {
  status: "blocked";
  isCircuitBreaker: true;
  tool: string;
  message: string;
}

/**
 * Hermes-inspired Action Circuit Breaker
 * Detects identical tool calls within a single execution cycle and interrupts
 * loop states before quota or step limits are exhausted.
 */
export class ActionCircuitBreaker {
  private callCounts = new Map<string, number>();
  private readonly maxAllowedRepetitions: number;

  constructor(maxAllowedRepetitions = 2) {
    this.maxAllowedRepetitions = Math.max(1, maxAllowedRepetitions);
  }

  /**
   * Deterministically fingerprints a tool call based on tool name and normalized arguments.
   * Key order in argument objects is normalized to prevent false negatives.
   */
  public getFingerprint(toolName: string, args: any): string {
    const canonicalArgs = this.canonicalStringify(args ?? {});
    return `${toolName}:${canonicalArgs}`;
  }

  /**
   * Evaluates if a tool invocation should be allowed to proceed.
   * If allowed, records the invocation count.
   * If repeated beyond threshold, trips the circuit breaker.
   */
  public checkAndRecord(
    toolName: string,
    args: any,
  ): CircuitBreakerCheckResult {
    const fingerprint = this.getFingerprint(toolName, args);
    const currentCount = (this.callCounts.get(fingerprint) || 0) + 1;
    this.callCounts.set(fingerprint, currentCount);

    if (currentCount > this.maxAllowedRepetitions) {
      const reason = `CIRCUIT_BREAKER_TRIGGERED: Action '${toolName}' was already executed ${currentCount - 1} times with identical parameters. Repeating identical actions without state modification is prohibited. Analyze your previous results, alter your parameters or strategy, or synthesize your final answer directly.`;
      return {
        allowed: false,
        reason,
        fingerprint,
        executionCount: currentCount,
      };
    }

    return {
      allowed: true,
      fingerprint,
      executionCount: currentCount,
    };
  }

  public getCount(toolName: string, args: any): number {
    const fingerprint = this.getFingerprint(toolName, args);
    return this.callCounts.get(fingerprint) || 0;
  }

  public reset(): void {
    this.callCounts.clear();
  }

  /**
   * Recursively sorts object keys for deterministic serialization.
   */
  private canonicalStringify(obj: any): string {
    if (obj === null || typeof obj !== "object") {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return (
        "[" + obj.map((item) => this.canonicalStringify(item)).join(",") + "]"
      );
    }
    const keys = Object.keys(obj).sort();
    const parts = keys.map(
      (key) => `${JSON.stringify(key)}:${this.canonicalStringify(obj[key])}`,
    );
    return "{" + parts.join(",") + "}";
  }
}

/**
 * DeepSeek-inspired Reflective Error Envelope
 * Wraps tool execution in a resilient diagnostic envelope so errors are delivered
 * as actionable observations to the LLM rather than unhandled rejections that break the stream.
 */
export async function executeWithReflectiveEnvelope<T = any>(
  toolName: string,
  args: any,
  context: any,
  executor: (args: any, context: any) => Promise<T>,
): Promise<T | ReflectiveErrorEnvelope> {
  try {
    return await executor(args, context);
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.warn(`Tool '${toolName}' execution failed: ${errorMessage}`);

    return {
      status: "error",
      isReflectiveError: true,
      tool: toolName,
      error: errorMessage,
      resolutionHint:
        "Do not apologize to the user. Treat this error as diagnostic data. Analyze the error message, correct your parameters or code, and proceed with an alternate strategy.",
    };
  }
}

/**
 * Attaches Hermes Circuit Breaker and DeepSeek Error Envelope guards to a Vercel AI SDK toolkit.
 */
export function createHarnessedToolkit(
  tools: Record<string, any>,
  options?: {
    maxRepetitions?: number;
    circuitBreaker?: ActionCircuitBreaker;
  },
): Record<string, any> {
  if (!tools || typeof tools !== "object") return tools;

  const breaker =
    options?.circuitBreaker ||
    new ActionCircuitBreaker(options?.maxRepetitions ?? 2);
  const harnessed: Record<string, any> = {};

  for (const [toolName, toolDef] of Object.entries(tools)) {
    if (
      !toolDef ||
      typeof toolDef !== "object" ||
      typeof toolDef.execute !== "function"
    ) {
      harnessed[toolName] = toolDef;
      continue;
    }

    const originalExecute = toolDef.execute.bind(toolDef);

    harnessed[toolName] = {
      ...toolDef,
      execute: async (args: any, context: any) => {
        // 1. Action Circuit Breaker Guard
        const check = breaker.checkAndRecord(toolName, args);
        if (!check.allowed) {
          logger.warn(
            `Circuit breaker tripped for '${toolName}': ${check.reason}`,
          );
          const envelope: CircuitBreakerEnvelope = {
            status: "blocked",
            isCircuitBreaker: true,
            tool: toolName,
            message: check.reason!,
          };
          return envelope;
        }

        // 2. Reflective Error Envelope Guard
        return executeWithReflectiveEnvelope(
          toolName,
          args,
          context,
          originalExecute,
        );
      },
    };
  }

  return harnessed;
}

/**
 * Hermes/DeepSeek Context Compactor
 * Condenses a single tool output if it exceeds maxLength.
 */
export function compactToolOutput(output: any, maxLength = 500): any {
  if (output === null || output === undefined) return output;
  if (typeof output === "string") {
    if (output.length <= maxLength) return output;
    return `${output.slice(0, maxLength)}...\n[Tool output compacted: ${output.length - maxLength} chars omitted to conserve context budget]`;
  }
  if (typeof output === "object") {
    try {
      const json = JSON.stringify(output);
      if (json.length <= maxLength) return output;
      if (Array.isArray(output)) {
        return {
          _summary: `Array of ${output.length} items (compacted for context efficiency)`,
          sample: output.slice(0, 2),
        };
      }
      return {
        _summary: `Object with ${Object.keys(output).length} keys (compacted for context efficiency)`,
        preview: json.slice(0, maxLength) + "...",
      };
    } catch {
      return output;
    }
  }
  return output;
}

/**
 * Prunes and compacts bloated tool results from completed prior conversation turns,
 * preserving full fidelity for the active turn while slashing token usage by up to 80%.
 */
export function compactPriorTurnToolInvocations<T extends Record<string, any>>(
  messages: T[],
  options?: { maxToolOutputLength?: number },
): T[] {
  if (!Array.isArray(messages) || messages.length === 0) return messages;

  const maxLen = options?.maxToolOutputLength ?? 500;

  // Locate the index of the latest user message (marks start of active turn)
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
      lastUserIdx = i;
      break;
    }
  }

  // If no prior turns exist, active turn has no completed prior tools to compact
  if (lastUserIdx <= 0) return messages;

  return messages.map((msg, idx) => {
    // Only compact tools from prior completed turns (before last user message)
    if (idx >= lastUserIdx) return msg;
    if (!msg || typeof msg !== "object") return msg;

    let modified = false;
    let newParts = msg.parts;
    let newToolInvocations = msg.toolInvocations;

    // Compact UI message parts
    if (Array.isArray(msg.parts)) {
      newParts = msg.parts.map((part: any) => {
        if (
          part &&
          (part.type === "tool-invocation" || part.type === "tool-result") &&
          part.toolInvocation &&
          part.toolInvocation.result !== undefined
        ) {
          modified = true;
          return {
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              result: compactToolOutput(part.toolInvocation.result, maxLen),
            },
          };
        }
        return part;
      });
    }

    // Compact top-level toolInvocations array if present
    if (Array.isArray(msg.toolInvocations)) {
      newToolInvocations = msg.toolInvocations.map((ti: any) => {
        if (ti && ti.result !== undefined) {
          modified = true;
          return {
            ...ti,
            result: compactToolOutput(ti.result, maxLen),
          };
        }
        return ti;
      });
    }

    if (!modified) return msg;

    return {
      ...msg,
      parts: newParts,
      ...(newToolInvocations ? { toolInvocations: newToolInvocations } : {}),
    };
  });
}

// Re-export Hermes Compounding Skill Distiller
export * from "./skill-distiller";
