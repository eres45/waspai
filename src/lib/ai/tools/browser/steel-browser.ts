import { Tool } from "ai";
import { z } from "zod";
import Steel from "steel-sdk";
import { chromium, type Page } from "playwright";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function inspectPage(page: Page) {
  return await page.evaluate(() => {
    const interactiveElements = Array.from(
      document.querySelectorAll(
        'button, input, textarea, a, select, [role="button"], [role="link"], [role="checkbox"], [role="menuitem"], [contenteditable="true"]',
      ),
    );

    return interactiveElements
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          style.opacity !== "0"
        );
      })
      .map((el, index) => {
        return {
          id: index,
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || "").trim().slice(0, 80),
          ariaLabel: el.getAttribute("aria-label") || "",
          placeholder: el.getAttribute("placeholder") || "",
          role:
            el.getAttribute("role") ||
            el.getAttribute("contenteditable") === "true"
              ? "textbox"
              : "",
          name: el.getAttribute("name") || "",
          suggestedSelector: el.id
            ? `#${CSS.escape(el.id)}`
            : el.getAttribute("name")
              ? `[name="${CSS.escape(el.getAttribute("name")!)}"]`
              : el.getAttribute("aria-label")
                ? `[aria-label="${CSS.escape(el.getAttribute("aria-label")!)}"]`
                : el.getAttribute("placeholder")
                  ? `[placeholder="${CSS.escape(el.getAttribute("placeholder")!)}"]`
                  : null,
        };
      })
      .slice(0, 50);
  });
}

async function findTargetElement(
  page: Page,
  intent?: string,
  selector?: string,
) {
  // Strategy 1: Exact selector (if provided and visible)
  if (selector) {
    try {
      const loc = page.locator(selector).filter({ visible: true }).first();
      if (await loc.isVisible().catch(() => false)) return loc;
    } catch (_e) {
      console.warn(`Selector ${selector} failed, trying semantic matching...`);
    }
  }

  if (!intent) return null;

  // Strategy 2: Role + Name matching
  const commonRoles = ["button", "link", "textbox", "checkbox", "menuitem"];
  for (const role of commonRoles) {
    try {
      const loc = page
        .getByRole(role as any, { name: new RegExp(intent, "i") })
        .filter({ visible: true })
        .first();
      if (await loc.isVisible().catch(() => false)) return loc;
    } catch (_e) {
      /* ignore */
    }
  }

  // Strategy 3: Label matching
  try {
    const labelLoc = page
      .getByLabel(intent, { exact: false })
      .filter({ visible: true })
      .first();
    if (await labelLoc.isVisible().catch(() => false)) return labelLoc;
  } catch (_e) {
    /* ignore */
  }

  // Strategy 4: Placeholder
  try {
    const placeholderLoc = page
      .getByPlaceholder(intent, { exact: false })
      .filter({ visible: true })
      .first();
    if (await placeholderLoc.isVisible().catch(() => false))
      return placeholderLoc;
  } catch (_e) {
    /* ignore */
  }

  // Strategy 5: Just Text matching
  try {
    const textLoc = page
      .getByText(intent, { exact: false })
      .filter({ visible: true })
      .first();
    if (await textLoc.isVisible().catch(() => false)) return textLoc;
  } catch (_e) {
    /* ignore */
  }

  // Strategy 6: Contenteditable fallback (common for rich editors like ChatGPT)
  if (
    intent.toLowerCase().includes("input") ||
    intent.toLowerCase().includes("type") ||
    intent.toLowerCase().includes("message")
  ) {
    try {
      const ceLoc = page
        .locator('[contenteditable="true"]')
        .filter({ visible: true })
        .first();
      if (await ceLoc.isVisible().catch(() => false)) return ceLoc;
    } catch (_e) {
      /* ignore */
    }
  }

  return null;
}

export const steelBrowserTool: Tool = {
  description:
    "A robust cloud browser engine with semantic matching. Use 'inspect' to discover elements on unknown pages, then use 'click' or 'type' with an 'intent' or 'selector'. Supports human-like interaction and automatic fallbacks.",
  inputSchema: z.object({
    action: z
      .enum([
        "navigate",
        "click",
        "type",
        "press",
        "wait",
        "screenshot",
        "inspect",
        "scroll",
        "extract",
      ])
      .describe("The action to perform in the browser."),
    url: z
      .string()
      .optional()
      .describe("The URL to navigate to (only for 'navigate')."),
    selector: z.string().optional().describe("The CSS selector to target."),
    intent: z
      .string()
      .optional()
      .describe(
        "The semantic description of the element to target (e.g. 'the send button'). Use this when selectors are unknown or dynamic.",
      ),
    value: z
      .string()
      .optional()
      .describe(
        "The text to type, key to press, or ms/direction (up/down) to wait/scroll.",
      ),
    sessionId: z
      .string()
      .optional()
      .describe("The ID of an existing session to reuse."),
  }),
  execute: async ({ action, url, selector, intent, value, sessionId }) => {
    const apiKey = process.env.STEEL_API_KEY;
    if (!apiKey) {
      throw new Error("STEEL_API_KEY is not configured.");
    }

    const client = new Steel({
      steelAPIKey: apiKey,
    });

    let session;
    try {
      if (sessionId) {
        try {
          session = await client.sessions.retrieve(sessionId);
          if (session.status !== "live") {
            session = await client.sessions.create();
          }
        } catch (_retrieveError) {
          session = await client.sessions.create();
        }
      } else {
        session = await client.sessions.create();
      }

      const manualUrl = `wss://connect.steel.dev/?apiKey=${apiKey}&sessionId=${session.id}`;
      const browser = await chromium.connectOverCDP(manualUrl);
      const context = browser.contexts()[0];
      const page = context.pages()[0] || (await context.newPage());

      const result: any = { sessionId: session.id };
      let actionMessage = "";

      // Action Engine
      switch (action) {
        case "navigate":
          if (!url) throw new Error("URL is required for 'navigate'.");
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          actionMessage = `Navigated to ${url}.`;
          break;

        case "inspect":
          const elements = await inspectPage(page);
          result.elements = elements;
          actionMessage = `Scanned page. Found ${elements.length} interactive elements.`;
          break;

        case "extract":
          const textContent = await page.innerText("body");
          result.content = textContent.slice(0, 5000);
          actionMessage = `Extracted page text content.`;
          break;

        case "scroll": {
          const scrollValue = value === "up" ? -500 : 500;
          await page.mouse.wheel(0, scrollValue);
          await sleep(500);
          actionMessage = `Scrolled ${value || "down"}.`;
          break;
        }

        case "click": {
          const element = await findTargetElement(page, intent, selector);
          if (!element)
            throw new Error(
              `Could not find clickable element matching: ${intent || selector}`,
            );

          await element.scrollIntoViewIfNeeded();
          await sleep(200);
          await element.click({ timeout: 15000 });
          actionMessage = `Clicked on element matching "${intent || selector}".`;
          break;
        }

        case "type": {
          const element = await findTargetElement(page, intent, selector);
          if (!element)
            throw new Error(
              `Could not find input element matching: ${intent || selector}`,
            );

          await element.scrollIntoViewIfNeeded();
          await sleep(200);
          await element.click(); // Focus first
          await element.fill(""); // Clear if needed
          await page.keyboard.type(value || "", { delay: 50 }); // Human-like typing
          actionMessage = `Typed "${value}" into element matching "${intent || selector}".`;
          break;
        }

        case "press":
          await page.keyboard.press(value || "Enter");
          actionMessage = `Pressed ${value || "Enter"}.`;
          break;

        case "wait":
          await sleep(parseInt(value || "1000", 10));
          actionMessage = `Waited for ${value}ms.`;
          break;

        case "screenshot":
          const buffer = await page.screenshot({ type: "jpeg", quality: 80 });
          result.screenshot_base64 = buffer.toString("base64");
          actionMessage = `Screenshot captured.`;
          break;
      }

      await browser.close();

      const liveDetails = await client.sessions.liveDetails(session.id);
      result.sessionUrl = `${liveDetails.sessionViewerUrl || session.sessionViewerUrl}/player?interactive=true&showControls=true`;
      result.message = `${actionMessage} You can view the live progress below.`;

      return result;
    } catch (error: any) {
      console.error(`[Steel Browser V2] Error:`, error);
      let friendlyMessage = error.message;
      if (error.message.includes("502 Bad Gateway")) {
        friendlyMessage =
          "Connection issue with Steel.dev (502). Please retry.";
      }
      throw new Error(`Browser V2 failed: ${friendlyMessage}`);
    }
  },
};
