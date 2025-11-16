import fs from "fs";

/**
 * Debug script to check what the enhance API actually returns
 */

async function debugEnhanceAPI() {
  console.log("🔍 Debugging Image Enhance API Response...\n");

  const testImageUrl =
    "https://cdn.snapzion.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/531b6193-2d4b-45fa-8779-ceed7be01455.png";

  try {
    const enhanceApiUrl = `https://image-enhance.apis-bj-devs.workers.dev/?imageurl=${encodeURIComponent(testImageUrl)}`;
    
    console.log(`Calling: ${enhanceApiUrl}\n`);

    const response = await fetch(enhanceApiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "better-chatbot/1.0",
      },
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}\n`);

    // Get the raw text response
    const text = await response.text();
    console.log("Raw Response:");
    console.log(text);
    console.log("\n");

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:");
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log("Not JSON, raw text above");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

debugEnhanceAPI();
