import { Tool } from "ai";
import { z } from "zod";
import Steel from "steel-sdk";
import { chromium } from "playwright";

export const steelBrowserTool: Tool = {
  description:
    "Control a cloud browser session with Steel.dev. Use this to navigate, click, type, and interact with websites.",
  inputSchema: z.object({
    url: z.string().describe("The URL to open or navigate to."),
    action: z
      .enum(["navigate", "interact"])
      .default("navigate")
      .describe("The action to perform."),
    task: z
      .string()
      .optional()
      .describe("A description of the interaction task to perform."),
  }),
  execute: async ({ url, action, task }) => {
    const apiKey = process.env.STEEL_API_KEY;
    if (!apiKey) {
      throw new Error("STEEL_API_KEY is not configured.");
    }

    const client = new Steel({
      steelAPIKey: apiKey,
    });

    try {
      // Create a session
      const session = await client.sessions.create();

      // Connect to the session via Playwright
      const browser = await chromium.connectOverCDP(session.websocketUrl);
      const context = browser.contexts()[0];
      const page = context.pages()[0] || (await context.newPage());

      // Perform initial navigation
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // If it's an interaction task, we can do more here.
      // For now, we'll just handle basic navigation and reporting.
      let message = `Cloud browser session started at ${url}.`;

      if (action === "interact" && task) {
        // Here you would implement a loop or a smarter agent to fulfill the 'task'
        // For the sake of this example, we'll just log that we are ready for interaction.
        message += ` Agent is ready to perform task: ${task}`;
      }

      // Get live details which contains the proper player URL
      const liveDetails = await client.sessions.liveDetails(session.id);

      const viewerUrl =
        liveDetails.sessionViewerUrl || `${session.sessionViewerUrl}/player`;

      const finalUrl = new URL(viewerUrl);
      finalUrl.searchParams.set("interactive", "true");
      finalUrl.searchParams.set("showControls", "true");

      return {
        sessionId: session.id,
        sessionUrl: finalUrl.toString(),
        message: message + " You can view and take control live below.",
      };
    } catch (error) {
      console.error("Failed to execute Steel browser task:", error);
      throw new Error("Cloud browser operation failed.");
    }
  },
};
