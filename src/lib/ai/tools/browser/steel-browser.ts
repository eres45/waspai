import { Tool } from "ai";
import { z } from "zod";
import Steel from "steel-sdk";
import { chromium } from "playwright";

export const steelBrowserTool: Tool = {
  description:
    "Control a cloud browser session with Steel.dev. Support modular actions like navigate, type, click, and press. To keep using the same browser tab, always pass the sessionId returned from the previous step.",
  inputSchema: z.object({
    action: z
      .enum(["navigate", "click", "type", "press", "wait", "screenshot"])
      .describe("The action to perform in the browser."),
    url: z
      .string()
      .optional()
      .describe("The URL to navigate to (only for 'navigate')."),
    selector: z
      .string()
      .optional()
      .describe("The CSS selector to target (for 'click' or 'type')."),
    value: z
      .string()
      .optional()
      .describe("The text to type, key to press, or ms to wait."),
    sessionId: z
      .string()
      .optional()
      .describe("The ID of an existing session to reuse."),
  }),
  execute: async ({ action, url, selector, value, sessionId }) => {
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
        // Retrieve existing session
        session = await client.sessions.retrieve(sessionId);
        if (session.status !== "live") {
          // If session expired, create a new one
          session = await client.sessions.create({
            timeout: 1200000, // 20 minutes
          });
        }
      } else {
        // Create a new session
        session = await client.sessions.create({
          timeout: 1200000, // 20 minutes
        });
      }

      // Connect to the session via Playwright
      const browser = await chromium.connectOverCDP(session.websocketUrl);
      const context = browser.contexts()[0];
      const page = context.pages()[0] || (await context.newPage());

      let actionMessage = "";

      switch (action) {
        case "navigate":
          if (!url) throw new Error("URL is required for 'navigate' action.");
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          actionMessage = `Navigated to ${url}.`;
          break;
        case "click":
          if (!selector)
            throw new Error("Selector is required for 'click' action.");
          await page.click(selector, { timeout: 10000 });
          actionMessage = `Clicked on ${selector}.`;
          break;
        case "type":
          if (!selector || value === undefined)
            throw new Error(
              "Selector and value are required for 'type' action.",
            );
          await page.fill(selector, value, { timeout: 10000 });
          actionMessage = `Typed "${value}" into ${selector}.`;
          break;
        case "press":
          if (!value)
            throw new Error("Key (value) is required for 'press' action.");
          await page.keyboard.press(value);
          actionMessage = `Pressed ${value}.`;
          break;
        case "wait":
          const ms = parseInt(value || "1000", 10);
          await page.waitForTimeout(ms);
          actionMessage = `Waited for ${ms}ms.`;
          break;
        case "screenshot":
          await page.screenshot({ type: "jpeg", quality: 80 });
          actionMessage = `Screenshot captured. (Omitted from text response)`;
          break;
      }

      // Always close the Playwright connection (but not the Steel session!)
      // Steel sessions stay alive until timeout or manual release.
      await browser.close();

      // Get live details for the UI preview
      const liveDetails = await client.sessions.liveDetails(session.id);
      const viewerUrl =
        liveDetails.sessionViewerUrl || `${session.sessionViewerUrl}/player`;

      const finalUrl = new URL(viewerUrl);
      finalUrl.searchParams.set("interactive", "true");
      finalUrl.searchParams.set("showControls", "true");

      return {
        sessionId: session.id,
        sessionUrl: finalUrl.toString(),
        message: `${actionMessage} You can view the live progress below.`,
      };
    } catch (error: any) {
      console.error(`Failed to execute Steel browser action ${action}:`, error);
      throw new Error(`Cloud browser action failed: ${error.message}`);
    }
  },
};
