import { generateText } from "ai";
import { customModelProvider } from "../src/lib/ai/models";
import * as dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const imageUrl =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
  console.log("Testing Qwen Vision OCR with:", imageUrl);

  const model = customModelProvider.getModel({
    provider: "Qwen",
    model: "Qwen Vision (VL)",
  });

  try {
    const startTime = Date.now();
    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this image exactly as it appears. Return ONLY the text.",
            },
            { type: "image", image: imageUrl },
          ],
        },
      ],
    });
    const duration = Date.now() - startTime;

    console.log("--- QWEN OCR RESULTS ---");
    console.log(`Duration: ${duration}ms`);
    console.log("Extracted Text:", text);
    console.log("------------------------");

    if (text.toLowerCase().includes("google")) {
      console.log("✅ Qwen Vision OCR works perfectly!");
    } else {
      console.log("❌ Qwen Vision OCR failed to find 'Google'.");
    }
  } catch (error) {
    console.error("❌ Qwen Vision OCR Error:", error);
  }
}

main().catch(console.error);
