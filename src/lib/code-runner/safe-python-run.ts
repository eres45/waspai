"use client";

import { safe } from "ts-safe";
import {
  CodeRunnerOptions,
  CodeRunnerResult,
  LogEntry,
} from "./code-runner.interface";

// Add security validations similar to JS

function validateCodeSafety(code: string): string | null {
  if (code.includes("os.system")) return "Forbidden: os.system";
  return null;
}

// Output handlers from reference
export const OUTPUT_HANDLERS = {
  matplotlib: `
    import io
    import base64
    from matplotlib import pyplot as plt

    plt.clf()
    plt.close('all')
    plt.switch_backend('agg')

    def setup_matplotlib_output():
        def custom_show():
            if plt.gcf().get_size_inches().prod() * plt.gcf().dpi ** 2 > 25_000_000:
                print("Warning: Plot size too large, reducing quality")
                plt.gcf().set_dpi(100)

            png_buf = io.BytesIO()
            plt.savefig(png_buf, format='png')
            png_buf.seek(0)
            png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
            print(f'data:image/png;base64,{png_base64}')
            png_buf.close()

            plt.clf()
            plt.close('all')

        plt.show = custom_show
  `,
  basic: ``,
};

async function ensurePyodideLoaded(): Promise<any> {
  if ((globalThis as any).loadPyodide) {
    return (globalThis as any).loadPyodide;
  }

  const isWorker = typeof (globalThis as any).importScripts !== "undefined";

  if (isWorker) {
    try {
      (globalThis as any).importScripts(
        "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js",
      );
      return (globalThis as any).loadPyodide;
    } catch {
      throw new Error("Failed to load Pyodide script in worker");
    }
  } else {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"]',
    );

    if (existingScript) {
      if ((globalThis as any).loadPyodide) {
        return (globalThis as any).loadPyodide;
      }
      await new Promise<void>((resolve, reject) => {
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Failed to load Pyodide script")),
          { once: true },
        );
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load Pyodide script"));
        document.head.appendChild(script);
      });
    }
  }

  return (globalThis as any).loadPyodide;
}

function detectRequiredHandlers(code: string): string[] {
  const handlers: string[] = ["basic"];
  if (code.includes("matplotlib") || code.includes("plt.")) {
    handlers.push("matplotlib");
  }
  return handlers;
}

const SANDBOX_URL =
  process.env.NEXT_PUBLIC_SANDBOX_RUNNER_URL ||
  "https://waspai-sandbox.antideploy.app/execute";

async function executeViaCloudSandbox({
  code,
  timeout = 180000,
  onLog,
}: CodeRunnerOptions): Promise<CodeRunnerResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout + 5000);

  try {
    const res = await fetch(SANDBOX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        timeout: Math.floor(timeout / 1000),
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Sandbox returned status ${res.status}`);
    }

    const data = await res.json();
    const logs: LogEntry[] = [];

    // Parse stdout
    if (data.stdout) {
      const lines = data.stdout.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const entry: LogEntry = {
          type: "log",
          args: [{ type: "data", value: line }],
        };
        logs.push(entry);
        onLog?.(entry);
      }
    }

    // Parse stderr
    if (data.stderr) {
      const lines = data.stderr.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const entry: LogEntry = {
          type: "error",
          args: [{ type: "data", value: line }],
        };
        logs.push(entry);
        onLog?.(entry);
      }
    }

    // Process files (PDF, images, etc.)
    if (Array.isArray(data.files)) {
      for (const file of data.files) {
        const isImage = file.mime_type.startsWith("image/");
        const dataUrl = `data:${file.mime_type};base64,${file.base64_data}`;

        if (isImage) {
          const imgEntry: LogEntry = {
            type: "log",
            args: [{ type: "image", value: dataUrl }],
          };
          logs.push(imgEntry);
          onLog?.(imgEntry);
        }

        const fileEntry: LogEntry = {
          type: "info",
          args: [
            {
              type: "file",
              value: {
                name: file.name,
                size: file.size,
                mime_type: file.mime_type,
                dataUrl,
              },
            },
          ],
        };
        logs.push(fileEntry);
        onLog?.(fileEntry);
      }
    }

    return {
      success: data.success,
      logs,
      executionTimeMs: Date.now() - startTime,
      error: data.success ? undefined : data.stderr || "Execution failed",
    };
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

export async function safePythonRun({
  code,
  timeout = 180000,
  onLog,
}: CodeRunnerOptions): Promise<CodeRunnerResult> {
  // First attempt cloud sandbox with full internet and library support
  try {
    return await executeViaCloudSandbox({ code, timeout, onLog });
  } catch (cloudErr) {
    console.warn(
      "Cloud sandbox execution failed or unavailable, falling back to browser Pyodide:",
      cloudErr,
    );
  }

  return safe(async () => {
    const startTime = Date.now();
    const logs: LogEntry[] = [];

    const securityError = validateCodeSafety(code);
    if (securityError) throw new Error(securityError);

    const loadPyodide = await ensurePyodideLoaded();

    // Load Pyodide
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
    });

    // Set up stdout capture
    pyodide.setStdout({
      batched: (output: string) => {
        const type = output.startsWith("data:image/png;base64")
          ? "image"
          : "data";
        logs.push({ type: "log", args: [{ type, value: output }] });
        onLog?.({ type: "log", args: [{ type, value: output }] });
      },
    });
    pyodide.setStderr({
      batched: (output: string) => {
        logs.push({ type: "error", args: [{ type: "data", value: output }] });
        onLog?.({ type: "error", args: [{ type: "data", value: output }] });
      },
    });

    // Load packages and handlers
    await pyodide.loadPackagesFromImports(code);
    const requiredHandlers = detectRequiredHandlers(code);
    for (const handler of requiredHandlers) {
      await pyodide.runPythonAsync(
        OUTPUT_HANDLERS[handler as keyof typeof OUTPUT_HANDLERS],
      );
      if (handler === "matplotlib") {
        await pyodide.runPythonAsync("setup_matplotlib_output()");
      }
    }

    // Execute code with timeout
    const execution = pyodide.runPythonAsync(code);
    const timer = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout),
    );
    const returnValue = await Promise.race([execution, timer]);

    return {
      success: true,
      logs,
      executionTimeMs: Date.now() - startTime,
      result: returnValue,
    } as CodeRunnerResult;
  })
    .ifFail((err) => ({
      success: false,
      error: err.message,
      logs: [],
      solution: "Python execution failed. Check syntax, imports, or timeout.",
    }))
    .unwrap();
}
