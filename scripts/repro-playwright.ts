import Steel from "steel-sdk";
import { chromium } from "playwright";
import dotenv from "dotenv";

dotenv.config();

async function testPlaywright() {
  const apiKey = process.env.STEEL_API_KEY;
  const client = new Steel({ steelAPIKey: apiKey });

  try {
    console.log("Creating session...");
    const session = await client.sessions.create();
    console.log("Session created ID:", session.id);
    console.log("Websocket URL:", session.websocketUrl);

    if (!session.websocketUrl) {
      console.error("CRITICAL: session.websocketUrl is missing!");
      return;
    }

    console.log("Attempting chromium.connectOverCDP...");
    try {
      const browser = await chromium.connectOverCDP(session.websocketUrl, {
        timeout: 10000,
      });
      console.log("Connect successful!");

      const contexts = browser.contexts();
      console.log("Active contexts:", contexts.length);
      const context = contexts[0];
      const page = context.pages()[0] || (await context.newPage());

      console.log("Navigating to google.com...");
      await page.goto("https://www.google.com");
      console.log("Navigation successful! Current URL:", page.url());

      await browser.close();
      console.log("Test finished!");
    } catch (connectError: any) {
      console.error("Chromium Connect Error:", connectError.message);
      console.error("Full Error:", connectError);
    }
  } catch (error: any) {
    console.error("Steel SDK Error:", error.message);
  }
}

testPlaywright();
