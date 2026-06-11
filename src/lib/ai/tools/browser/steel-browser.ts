import { Tool } from "ai";
import { z } from "zod";
import Steel from "steel-sdk";
import { chromium, type Page } from "playwright";
import { userRepository } from "lib/db/repository";
import { supabaseRest } from "lib/db/supabase-rest";
import { getSession } from "auth/server";

const TIER_LIMITS_SECONDS: Record<string, number> = {
  free: 5 * 60, // 300 seconds (5 minutes)
  pro: 30 * 60, // 1800 seconds (30 minutes)
  ultra: 120 * 60, // 7200 seconds (2 hours)
};

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
        "launch",
      ])
      .describe(
        "The action to perform in the browser. Use 'launch' first for immediate visual feedack.",
      ),
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

    const sessionObj = await getSession();
    const userId =
      sessionObj?.user?.id || "d3b07384-d113-4ec5-a559-6e0d68b668d1";

    let session;
    let actionMessage = "";

    const checkLimitAndCreateSession = async () => {
      // 1. Fetch user tier
      const user = await userRepository.getUserById(userId);
      const userTier = user?.tier ?? "free";
      const limit = TIER_LIMITS_SECONDS[userTier] ?? TIER_LIMITS_SECONDS.free;

      // 2. Query used duration in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let usedDuration = 0;
      try {
        const { data, error } = await supabaseRest
          .from("browser_usage")
          .select("allocated_duration")
          .eq("user_id", userId)
          .gte("created_at", sevenDaysAgo.toISOString());

        if (error && error.code !== "PGRST205") {
          console.error("[Steel Browser] Error querying browser usage:", error);
        } else if (data) {
          usedDuration = data.reduce(
            (sum: number, row: any) => sum + (row.allocated_duration || 0),
            0,
          );
        }
      } catch (err) {
        console.error("[Steel Browser] Failed to query browser usage:", err);
      }

      // 3. Check limit
      if (usedDuration + 120 > limit) {
        const limitMin = limit / 60;
        const usedMin = Math.round(usedDuration / 60);
        throw new Error(
          `weekly_limit_exceeded: You have reached your weekly Cloud Browser limit. You have used ${usedMin} minutes out of your weekly allowance of ${limitMin} minutes on the ${userTier.toUpperCase()} tier. Please upgrade your plan for more usage.`,
        );
      }

      // 4. Create new session
      const newSession = await client.sessions.create({ timeout: 120000 });

      // 5. Insert record in database
      try {
        const { error: insertError } = await supabaseRest
          .from("browser_usage")
          .insert({
            user_id: userId,
            session_id: newSession.id,
            allocated_duration: 120,
          });
        if (insertError && insertError.code !== "PGRST205") {
          console.error(
            "[Steel Browser] Failed to insert usage record:",
            insertError,
          );
        }
      } catch (err) {
        console.error("[Steel Browser] Failed to insert usage record:", err);
      }

      return newSession;
    };

    try {
      if (sessionId) {
        try {
          session = await client.sessions.retrieve(sessionId);
          if (session.status !== "live") {
            actionMessage =
              "(Note: Previous session closed due to 2 minutes of inactivity. Starting a fresh one.) ";
            session = await checkLimitAndCreateSession();
          }
        } catch (_retrieveError) {
          // Fallback to discovery if retrieval fails
          const sessions = await client.sessions.list();
          for await (const s of sessions) {
            if (s.status === "live") {
              session = s;
              break;
            }
          }
          if (!session) {
            session = await checkLimitAndCreateSession();
          }
        }
      } else {
        // Backend Guard: Force reuse of ANY existing live session
        const sessions = await client.sessions.list();
        for await (const s of sessions) {
          if (s.status === "live") {
            session = s;
            break;
          }
        }
        if (session) {
          actionMessage = "(Re-attached to active session) ";
        } else {
          session = await checkLimitAndCreateSession();
        }
      }

      const manualUrl = `wss://connect.steel.dev/?apiKey=${apiKey}&sessionId=${session.id}`;
      const browser = await chromium.connectOverCDP(manualUrl);
      const context = browser.contexts()[0];
      const page = context.pages()[0] || (await context.newPage());

      const result: any = { sessionId: session.id };
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

        case "launch":
          actionMessage = `Browser session launched and ready. You can see the live view below.`;
          break;
      }

      await browser.close();

      // Only return the sessionUrl if it's a launch action or the first call (initialization)
      // This prevents the UI from showing multiple redundant browser frames in the chat history.
      if (action === "launch" || !sessionId) {
        const liveDetails = await client.sessions.liveDetails(session.id);
        const baseViewerUrl =
          liveDetails.sessionViewerUrl || session.sessionViewerUrl;
        const viewerUrl = baseViewerUrl.includes("/player")
          ? baseViewerUrl
          : `${baseViewerUrl}/player`;

        const finalUrl = new URL(viewerUrl);
        finalUrl.searchParams.set("interactive", "true");
        finalUrl.searchParams.set("showControls", "true");

        result.sessionUrl = finalUrl.toString();
        result.sessionId = session.id;
      } else {
        result.message = actionMessage;
        result.sessionId = session.id;
      }

      return result;
    } catch (error: any) {
      console.error(`[Steel Browser V2] Error:`, error);
      if (error.message && error.message.includes("weekly_limit_exceeded")) {
        return {
          error: "weekly_limit_exceeded",
          message: error.message.replace("weekly_limit_exceeded: ", ""),
        };
      }
      let friendlyMessage = error.message;
      if (error.message.includes("502 Bad Gateway")) {
        friendlyMessage =
          "Connection issue with Steel.dev (502). Please retry.";
      }
      throw new Error(`Browser V2 failed: ${friendlyMessage}`);
    }
  },
};
