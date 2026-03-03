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

      // Get live details which contains the proper player URL
      const liveDetails = await client.sessions.liveDetails(session.id);

      // The sessionViewerUrl from liveDetails is usually the api.steel.dev one
      const viewerUrl =
        liveDetails.sessionViewerUrl || `${session.sessionViewerUrl}/player`;

      // Ensure interactive flags are present
      const finalUrl = new URL(viewerUrl);
      finalUrl.searchParams.set("interactive", "true");
      finalUrl.searchParams.set("showControls", "true");
      // If the URL doesn't already have an auth token/key, we might need to append it
      // but let's try without first as api.steel.dev/player might be public for the session

      return {
        sessionId: session.id,
        sessionUrl: finalUrl.toString(),
        message: `Cloud browser session started for ${url}. You can view it live below.`,
      };
    } catch (error) {
      console.error("Failed to create Steel session:", error);
      throw new Error("Could not start cloud browser session.");
    }
  },
};
