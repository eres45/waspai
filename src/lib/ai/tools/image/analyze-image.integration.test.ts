import { describe, it, expect } from "vitest";
import { analyzeImageTool } from "./analyze-image";

describe("Analyze Image Tool - Live Integration Test", () => {
  it("successfully analyzes a live image using Llama 4 Scout on the Groq Worker", async () => {
    console.log("🚀 STARTING LIVE END-TO-END VISION INTEGRATION TEST...");
    const logoUrl =
      "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png";

    const start = Date.now();
    const result = await (analyzeImageTool.execute as any)(
      {
        imageUrl: logoUrl,
        prompt:
          "Identify the word in this image and describe the color of the first letter in one short sentence.",
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );

    const duration = Date.now() - start;
    console.log(`⏱️ Live Groq Vision call finished in ${duration}ms`);
    console.log(
      "📊 RESULT STATUS:",
      result.success ? "✅ SUCCESS" : "❌ FAILED",
    );
    if (result.success) {
      console.log("📝 RESPONSE FROM GROQ VISION MODEL:\n", result.analysis);
    } else {
      console.log("❌ ERROR RESPONSE:", result.error);
    }

    expect(result.success).toBe(true);
    expect(result.analysis.toLowerCase()).toContain("google");
    expect(result.analysis.toLowerCase()).toContain("blue"); // G is blue
  }, 25000); // 25s timeout for live integration test
});
