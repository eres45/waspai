"use client";
// Core JavaScript execution engine with security sandbox

import { safe } from "ts-safe";
import {
  CodeRunnerOptions,
  CodeRunnerResult,
  LogEntry,
} from "./code-runner.interface";

// Security: Block dangerous keywords that could compromise sandbox
// Note: 'eval()' and 'Function()' allowed since code runs in isolated sandbox
// Note: 'document.' removed to allow HTML generation in strings
const FORBIDDEN_KEYWORDS = [
  // Browser globals that could escape sandbox
  "globalThis.",
  "window.",
  "frames",
  "opener",
  // Prototype manipulation
  "__proto__",
  // Node.js environment
  "process.",
  "require(",
  "import(",
  // Dangerous objects
  "Worker(",
  "SharedWorker(",
  "ServiceWorker(",
  // Network bypass attempts
  "XMLHttpRequest(",
  "WebSocket(",
  "EventSource(",
];

// Enhanced security check with pattern detection
function validateCodeSafety(code: string): string | null {
  // Check forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    // Escape special regex characters in the keyword
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedKeyword);
    if (regex.test(code)) {
      return `Forbidden keyword: '${keyword}' - not allowed for security reasons`;
    }
  }

  // Detect obvious infinite loop patterns that would block the event loop
  const infiniteLoopPatterns = [
    {
      pattern: /while\s*\(\s*true\s*\)/,
      message: "Infinite while loop detected",
    },
    {
      pattern: /for\s*\(\s*;\s*;\s*\)/,
      message: "Infinite for loop detected",
    },
    {
      pattern: /while\s*\(\s*1\s*\)/,
      message: "Infinite while loop detected",
    },
    {
      pattern: /for\s*\(\s*;\s*true\s*;\s*\)/,
      message: "Infinite for loop detected",
    },
  ];

  for (const { pattern, message } of infiniteLoopPatterns) {
    if (pattern.test(code)) {
      return `Dangerous infinite loop pattern: ${message}`;
    }
  }

  // Detect truly dangerous patterns (reduced from previous overly strict checks)
  const suspiciousPatterns = [
    { pattern: /eval\s*\(/, message: "Dynamic code evaluation" },
    { pattern: /(new\s+)?Function\s*\(/, message: "Function constructor" },
    { pattern: /\.constructor\s*\(/, message: "Constructor access" },
    { pattern: /\.prototype\s*\[/, message: "Prototype manipulation" },
    {
      pattern: /__proto__\s*=/,
      message: "Prototype chain manipulation",
    },
  ];

  for (const { pattern, message } of suspiciousPatterns) {
    if (pattern.test(code)) {
      return `Suspicious pattern detected: ${message}`;
    }
  }

  return null;
}

// Create a controlled execution environment with safe APIs
function createSafeEnvironment(
  logCapture: (type: LogEntry["type"], ...args: any[]) => void,
) {
  const safeConsole = {
    log: (...args: any[]) => logCapture("log", ...args),
    info: (...args: any[]) => logCapture("info", ...args),
    warn: (...args: any[]) => logCapture("warn", ...args),
    error: (...args: any[]) => logCapture("error", ...args),
    debug: (...args: any[]) => logCapture("debug", ...args),
    trace: (...args: any[]) => logCapture("trace", ...args),
  };

  // Safe global objects and functions
  const safeGlobals = {
    // Console for output
    console: safeConsole,

    // Standard JavaScript objects
    Math: Math,
    JSON: JSON,
    Date: Date,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Promise: Promise,

    // Utility functions
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,

    // Safe browser APIs (if available)
    ...(typeof self !== "undefined" && {
      fetch: self.fetch,
      setTimeout: self.setTimeout,
      setInterval: self.setInterval,
      clearTimeout: self.clearTimeout,
      clearInterval: self.clearInterval,
      btoa: self.btoa,
      atob: self.atob,
    }),

    // Node.js environment APIs (for testing)
    ...(typeof global !== "undefined" &&
      typeof self === "undefined" && {
        setTimeout: global.setTimeout.bind(global),
        setInterval: global.setInterval.bind(global),
        clearTimeout: global.clearTimeout.bind(global),
        clearInterval: global.clearInterval.bind(global),
      }),
  };

  return { safeGlobals };
}

// Wrap code in async function to enable await
function wrapCode(code: string): string {
  return `"use strict";\nreturn (async () => {\n${code}\n})()`;
}

async function execute({
  code,
  timeout = 5000,
  onLog,
}: CodeRunnerOptions): Promise<CodeRunnerResult> {
  const startTime = Date.now();
  const logs: LogEntry[] = [];
  let returnValue: any = undefined;

  // Capture logs
  const logCapture = (type: LogEntry["type"], ...args: any[]) => {
    const entry: LogEntry = {
      type,
      args: args.map((v) => ({
        type: "data",
        value: v,
      })),
    };
    logs.push(entry);

    if (onLog) onLog(entry);
  };

  // Validate code safety
  const securityError = validateCodeSafety(code);
  if (securityError) {
    return {
      success: false,
      error: securityError,
      logs,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Create safe execution environment
  const { safeGlobals } = createSafeEnvironment(logCapture);
  const wrappedCode = wrapCode(code);

  // Execute with timeout protection
  try {
    await Promise.race([
      // Code execution
      new Promise(async (resolve, reject) => {
        try {
          const func = new Function(...Object.keys(safeGlobals), wrappedCode);
          const result = func(...Object.values(safeGlobals));

          if (result && typeof result.then === "function") {
            returnValue = await result;
          } else {
            returnValue = result;
          }

          resolve(undefined);
        } catch (error: any) {
          reject(error);
        }
      }),

      // Timeout
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Execution timeout: ${timeout}ms limit exceeded`));
        }, timeout);
      }),
    ]);

    return {
      success: true,
      logs,
      executionTimeMs: Date.now() - startTime,
      result: returnValue,
    };
  } catch (error: any) {
    logs.push({
      type: "error",
      args: [{ type: "data", value: error }],
    });
    return {
      success: false,
      error: error.message || "Unknown execution error",
      logs,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export async function safeJsRun({
  code,
  timeout = 5000,
  onLog,
}: CodeRunnerOptions): Promise<CodeRunnerResult> {
  return safe(async () => {
    const result = await execute({
      code,
      timeout,
      onLog,
    });

    if (!result.success) {
      throw new Error(result.error || "Code execution failed");
    }

    return {
      logs: result.logs,
      executionTimeMs: result.executionTimeMs,
      result: result.result,
      success: true,
    };
  })
    .ifFail((err) => {
      return {
        success: false,
        error: err.message,
        logs: [],
        solution: `JavaScript execution failed. Common issues:
    • Syntax errors: Check for missing semicolons, brackets, or quotes
    • Forbidden operations: Avoid DOM access, eval(), or global object manipulation  
    • Infinite loops: Code execution times out after ${timeout}ms
    • API errors: Check network connectivity for fetch() calls
    • Type errors: Verify data types and object properties exist
    • Reference errors: Make sure all variables and functions are defined
    
    Available APIs: Math, JSON, Date, fetch, setTimeout, console.log
    Input data properties are available as variables in your code scope.
    Use console.log() to output results and debug information.`,
      };
    })
    .unwrap();
}
