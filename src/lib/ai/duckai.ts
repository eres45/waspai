import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { chromium, type Browser } from "playwright";
import globalLogger from "logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("cyan", "DuckAI Runner: "),
});

export interface DuckAIModelDef {
  id: string;
  name: string;
  label: string;
  testid: string;
  provider: "OpenAI" | "Anthropic" | "Mistral" | "Google";
  tier: "Max";
}

export const DUCKAI_MODELS: DuckAIModelDef[] = [
  {
    id: "gpt-5.6-luna",
    name: "gpt-5.6-luna",
    label: "5.6 Luna",
    testid: "model-picker-row-gpt-5.6-luna",
    provider: "OpenAI",
    tier: "Max",
  },
  {
    id: "gpt-5.4-mini",
    name: "gpt-5.4-mini",
    label: "5.4 mini",
    testid: "model-picker-row-gpt-5.4-mini",
    provider: "OpenAI",
    tier: "Max",
  },
  {
    id: "claude-haiku-4.5",
    name: "claude-haiku-4.5",
    label: "Haiku 4.5",
    testid: "model-picker-row-claude-haiku-4-5",
    provider: "Anthropic",
    tier: "Max",
  },
  {
    id: "mistral-small-4",
    name: "mistral-small-4",
    label: "Mistral Small 4",
    testid: "model-picker-row-mistral-small-2603",
    provider: "Mistral",
    tier: "Max",
  },
  {
    id: "gemma-4-31b",
    name: "gemma-4-31b",
    label: "Gemma 4 31B",
    testid: "model-picker-row-tinfoil/gemma4-31b",
    provider: "Google",
    tier: "Max",
  },
];

export const DUCKAI_MODEL_IDS = new Set(
  DUCKAI_MODELS.map((m) => m.id.toLowerCase()),
);

export function isDuckAIModel(modelId: string): boolean {
  if (!modelId) return false;
  const lower = modelId.toLowerCase();
  if (DUCKAI_MODEL_IDS.has(lower)) return true;
  const parts = lower.split("/");
  return DUCKAI_MODEL_IDS.has(parts[parts.length - 1]);
}

export function getDuckAIModelDef(modelId: string): DuckAIModelDef | undefined {
  if (!modelId) return undefined;
  const lower = modelId.toLowerCase();
  const direct = DUCKAI_MODELS.find((m) => m.id.toLowerCase() === lower);
  if (direct) return direct;
  const parts = lower.split("/");
  const base = parts[parts.length - 1];
  return DUCKAI_MODELS.find((m) => m.id.toLowerCase() === base);
}

// Anti-bot stealth initialization script evaluated inside each browser context
const STEALTH_SCRIPT = `
  try {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const arr = [
          { name: 'PDF Viewer' },
          { name: 'Chrome PDF Viewer' },
          { name: 'Chromium PDF Viewer' },
          { name: 'Microsoft Edge PDF Viewer' },
          { name: 'WebKit built-in PDF' },
        ];
        arr.item = (i) => arr[i];
        arr.namedItem = (n) => arr.find((p) => p.name === n);
        arr.refresh = () => {};
        return arr;
      },
    });
    window.chrome = window.chrome || {};
    window.chrome.runtime = window.chrome.runtime || {};
    window.chrome.csi = window.chrome.csi || (() => ({ startE: Date.now(), onloadT: Date.now() }));
    window.chrome.loadTimes = window.chrome.loadTimes || (() => ({
      requestTime: Date.now() / 1000,
      startLoadTime: Date.now() / 1000,
      commitLoadTime: Date.now() / 1000,
      finishDocumentLoadTime: Date.now() / 1000,
      finishLoadTime: Date.now() / 1000,
      firstPaintTime: Date.now() / 1000,
      firstPaintAfterLoadTime: 0,
      navigationType: 'Other',
      wasFetchedViaSpdy: false,
      wasNegotiatedAfterH2PreliminaryEvaluation: false,
      connectionInfo: 'h2',
    }));
    const origGetParam = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (param) {
      if (param === 37445) return 'Google Inc. (NVIDIA)';
      if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)';
      return origGetParam.call(this, param);
    };
    if (navigator.permissions && navigator.permissions.query) {
      const origQuery = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = (p) =>
        p && p.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : origQuery(p);
    }
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return origToDataURL.apply(canvas, args);
    };
  } catch (e) {}
`;

// Shared Playwright browser singleton
let globalBrowserPromise: Promise<Browser> | null = null;

async function getDuckAIBrowser(): Promise<Browser> {
  if (globalBrowserPromise) {
    try {
      const b = await globalBrowserPromise;
      if (b.isConnected()) return b;
    } catch {
      globalBrowserPromise = null;
    }
  }

  globalBrowserPromise = (async () => {
    logger.info("Initializing Playwright browser for DuckAI engine...");
    try {
      return await chromium.launch({
        headless: true,
        channel: "chrome",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
      });
    } catch (chromeErr) {
      logger.warn(
        "Chrome channel launch failed, falling back to bundled chromium:",
        chromeErr,
      );
      return await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
      });
    }
  })();

  return globalBrowserPromise;
}

// Ensure browser is closed on process exit
if (typeof process !== "undefined") {
  const cleanup = async () => {
    if (globalBrowserPromise) {
      try {
        const b = await globalBrowserPromise;
        if (b.isConnected()) await b.close();
      } catch {}
      globalBrowserPromise = null;
    }
  };
  process.on("beforeExit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

async function selectModelInPage(page: any, modelDef: DuckAIModelDef) {
  const allLabels = DUCKAI_MODELS.map((m) => m.label);
  const pattern = new RegExp(
    "^(" +
      allLabels.map((s) => s.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")).join("|") +
      ")$",
  );
  const btn = page.locator("button").filter({ hasText: pattern }).first();
  await btn.waitFor({ state: "visible", timeout: 15000 });
  await btn.click();
  const opt = page.locator(`[data-testid="${modelDef.testid}"]`);
  await opt.waitFor({ state: "visible", timeout: 6000 });
  await opt.click();
  await page.waitForTimeout(400);
}

async function sendPromptAndWait(page: any, prompt: string): Promise<string> {
  const input = page.locator("textarea");
  await input.waitFor({ state: "visible", timeout: 15000 });
  await input.click();
  await input.fill("");
  await input.fill(prompt);
  await page.waitForTimeout(250);
  await page.locator('button[aria-label="Ask"]').click();

  const t0 = Date.now();
  for (let i = 0; i < 90; i++) {
    const r = await page.evaluate(() => {
      const generating = document.body.innerText.includes(
        "Generating response",
      );
      const challenge =
        document.body.innerText.includes("Unfortunately, bots use") ||
        document.body.innerText.includes(
          "confirm this prompt was made by a human",
        );
      const bubbles = [
        ...document.querySelectorAll('[id$="-assistant-message-0-1"]'),
      ];
      const body = bubbles
        .map((b) =>
          [...b.querySelectorAll("p")]
            .map((p) => (p.innerText || "").trim())
            .join("\n\n")
            .trim(),
        )
        .filter(Boolean);
      return { generating, challenge, count: bubbles.length, body };
    });

    if (r.challenge) {
      throw new Error("Duck AI bot challenge detected");
    }

    if (r.count > 0 && !r.generating && r.body.length) {
      const reply = r.body[r.body.length - 1];
      logger.info(
        `Received completed reply (${Date.now() - t0}ms, ${reply.length} chars)`,
      );
      return reply;
    }

    await page.waitForTimeout(800);
  }

  throw new Error("Timeout waiting for Duck AI assistant response");
}

export async function askDuckAI(
  modelId: string,
  prompt: string,
): Promise<string> {
  const modelDef = getDuckAIModelDef(modelId) || DUCKAI_MODELS[0];
  const maxAttempts = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let context: any = null;
    try {
      const browser = await getDuckAIBrowser();
      context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
      });
      await context.addInitScript(STEALTH_SCRIPT);
      const page = await context.newPage();

      await page.goto("https://duck.ai/", { waitUntil: "domcontentloaded" });
      await page
        .locator('button[aria-label="Ask"]')
        .waitFor({ state: "visible", timeout: 8000 });
      await selectModelInPage(page, modelDef);

      const reply = await sendPromptAndWait(page, prompt);
      return reply;
    } catch (err: any) {
      lastError = err;
      logger.warn(
        `Attempt ${attempt}/${maxAttempts} for ${modelDef.id} failed: ${err?.message || err}`,
      );
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    } finally {
      if (context) {
        await context.close().catch(() => {});
      }
    }
  }

  throw new Error(
    `Duck AI failed to generate response for ${modelDef.id} after ${maxAttempts} attempts: ${lastError?.message || lastError}`,
  );
}

function extractTextFromPart(part: any): string {
  if (!part) return "";
  if (typeof part === "string") return part;
  if (part.type === "text" && typeof part.text === "string") return part.text;
  if (typeof part.content === "string") return part.content;
  return "";
}

function formatMessagesForPrompt(messages: any[]): string {
  if (!messages || messages.length === 0) return "Hello";

  // If only one user message, return its prompt directly
  if (messages.length === 1 && messages[0].role === "user") {
    const content = messages[0].content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map(extractTextFromPart).filter(Boolean).join(" ");
    }
    return String(content || "Hello");
  }

  // Format multi-turn conversation into a coherent prompt
  const turns: string[] = [];
  for (const msg of messages) {
    let text = "";
    if (typeof msg.content === "string") {
      text = msg.content;
    } else if (Array.isArray(msg.content)) {
      text = msg.content.map(extractTextFromPart).filter(Boolean).join(" ");
    } else if (msg.content) {
      text = String(msg.content);
    }

    if (!text.trim()) continue;

    if (msg.role === "system") {
      turns.push(`[System Directive: ${text.trim()}]`);
    } else if (msg.role === "assistant") {
      turns.push(`Assistant: ${text.trim()}`);
    } else {
      turns.push(`User: ${text.trim()}`);
    }
  }

  if (turns.length === 0) return "Hello";
  return turns.join("\n\n");
}

export const duckAIProvider = createOpenAICompatible({
  name: "DuckAI",
  baseURL: "http://localhost/duckai/v1",
  fetch: async (_url, options) => {
    let body: any = {};
    try {
      body = JSON.parse((options?.body as string) || "{}");
    } catch {
      body = {};
    }

    const modelId = body.model || "gpt-5.6-luna";
    const messages = body.messages || [];
    const prompt = formatMessagesForPrompt(messages);

    logger.info(
      `Dispatching model: ${modelId} (stream=${Boolean(body.stream)}, promptLen=${prompt.length})`,
    );

    const reply = await askDuckAI(modelId, prompt);

    if (body.stream) {
      const encoder = new TextEncoder();
      const chunks = reply.split(/(\s+)/);
      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            if (!chunk) continue;
            const data = {
              id: `chatcmpl-${Date.now()}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model: modelId,
              choices: [
                {
                  index: 0,
                  delta: { content: chunk },
                  finish_reason: null,
                },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
            );
          }

          const finishData = {
            id: `chatcmpl-${Date.now()}`,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: modelId,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: "stop",
              },
            ],
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finishData)}\n\n`),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const json = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelId,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: reply,
          },
          finish_reason: "stop",
        },
      ],
    };

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
