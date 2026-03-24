import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import fs from "fs";

// Mock the environment
process.env.TELEGRAM_BOT_TOKEN = "dummy";

const qwenProvider = createOpenAICompatible({
  name: "QWEN",
  apiKey: "dummy",
  baseURL: "https://qwen-worker-proxy.ronitshrimankar1.workers.dev/v1",
});

const model = qwenProvider("vision-model");

async function testOCR() {
  try {
    console.log("Testing Qwen Vision OCR...");

    // Create a tiny 1x1 black PNG as a sample image
    const sampleImageBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const imageData = Buffer.from(sampleImageBase64, "base64");

    console.log("Attempt 1: Passing Uint8Array...");
    try {
      const { text: text1 } = await generateText({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What is in this image?" },
              { type: "image", image: new Uint8Array(imageData) },
            ],
          },
        ],
      });
      console.log("Attempt 1 Result:", text1);
    } catch (e) {
      console.error("Attempt 1 Failed:", e.message);
    }

    console.log("\nAttempt 2: Passing Data URL string...");
    try {
      const { text: text2 } = await generateText({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What is in this image?" },
              {
                type: "image",
                image: `data:image/png;base64,${sampleImageBase64}`,
              },
            ],
          },
        ],
      });
      console.log("Attempt 2 Result:", text2);
    } catch (e) {
      console.error("Attempt 2 Failed:", e.message);
    }
  } catch (err) {
    console.error("Overall Test Failed:", err);
  }
}

testOCR();
