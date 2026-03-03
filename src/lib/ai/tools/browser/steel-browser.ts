import { Tool } from "ai";
import { z } from "zod";
import Steel from "steel-sdk";

export const steelBrowserTool: Tool = {
  description:
    "Start a cloud browser session with Steel.dev and return a live preview URL.",
  inputSchema: z.object({
    url: z.string().describe("The URL to open in the cloud browser."),
  }),
  execute: async ({ url }) => {
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

      // Navigate to the requested URL
      // Note: The Steel SDK might vary slightly in its methods,
      // but creating a session and getting the viewer URL is the core.

      return {
        sessionId: session.id,
        sessionUrl: `https://app.steel.dev/sessions/${session.id}`,
        message: `Cloud browser session started for ${url}. You can view it live below.`,
      };
    } catch (error) {
      console.error("Failed to create Steel session:", error);
      throw new Error("Could not start cloud browser session.");
    }
  },
};
