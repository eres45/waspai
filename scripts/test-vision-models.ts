import { generateText } from "ai";
import { customModelProvider } from "../src/lib/ai/models";
import * as dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testModel(
  provider: string,
  modelName: string,
  imageUrl: string,
) {
  console.log(`Testing [${provider}] ${modelName}...`);
  try {
    const model = customModelProvider.getModel({ provider, model: modelName });
    const startTime = Date.now();
    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Act as a high-precision OCR engine. Extract all text from this image exactly as it appears. Return ONLY the text.",
            },
            { type: "image", image: imageUrl },
          ],
        },
      ],
      maxRetries: 1,
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Success (${duration}ms): "${text.substring(0, 50)}..."`);
    return true;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message || "Unknown error"}`);
    return false;
  }
}

async function main() {
  const imageUrl =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";

  const modelsToTest = [
    { p: "Qwen", m: "Qwen Vision (VL)" },
    { p: "Meta", m: "Llama 3.2 11B Vision" },
    { p: "Google", m: "Gemini 2.0 Flash" },
    { p: "Microsoft", m: "Phi-3.5 Vision" },
  ];

  console.log("--- MULTI-MODEL VISION TEST ---");
  for (const item of modelsToTest) {
    await testModel(item.p, item.m, imageUrl);
    console.log("");
  }
  console.log("-------------------------------");
}

main().catch(console.error);
