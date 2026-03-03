import { Tool } from "ai";
import { z } from "zod";
import Steel from "steel-sdk";

export const steelBrowserTool: Tool = {
  description:
    "Start a cloud browser session with Steel.dev. Use this to navigate to websites and view them live.",
  inputSchema: z.object({
    url: z.string().describe("The URL to open or navigate to."),
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

      const viewerUrl =
        liveDetails.sessionViewerUrl || `${session.sessionViewerUrl}/player`;

      const finalUrl = new URL(viewerUrl);
      finalUrl.searchParams.set("interactive", "true");
      finalUrl.searchParams.set("showControls", "true");

      return {
        sessionId: session.id,
        sessionUrl: finalUrl.toString(),
        message: `Cloud browser session started at ${url}. You can view and take control live below.`,
      };
    } catch (error) {
      console.error("Failed to execute Steel browser task:", error);
      throw new Error("Cloud browser operation failed.");
    }
  },
};
