import { extractTextFromDocuments } from "../src/lib/ocr/ocr-service";
import * as dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const imageUrl =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
  console.log("--- QWEN OCR RELIABILITY TEST ---");
  console.log("Image:", imageUrl);

  let successCount = 0;
  const attempts = 3;

  for (let i = 1; i <= attempts; i++) {
    console.log(`Attempt ${i}/${attempts}...`);
    try {
      const startTime = Date.now();
      const result = await extractTextFromDocuments("Test", [imageUrl]);
      const duration = Date.now() - startTime;

      if (result.toLowerCase().includes("google")) {
        console.log(`✅ Attempt ${i} SUCCESS (${duration}ms)`);
        successCount++;
      } else if (result === "Test") {
        console.log(`❌ Attempt ${i} FAILED: No text extracted`);
      } else {
        console.log(`⚠️ Attempt ${i} PARTIAL: "${result.substring(0, 50)}..."`);
      }
    } catch (err: any) {
      console.log(`❌ Attempt ${i} ERROR: ${err.message || "Unknown"}`);
    }
    // Small delay between attempts
    if (i < attempts) await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("-------------------------------");
  console.log(`Final Result: ${successCount}/${attempts} successes`);

  if (successCount === attempts) {
    console.log("STATUS: STABLE");
  } else if (successCount > 0) {
    console.log("STATUS: UNSTABLE (Rate limits or transient errors)");
  } else {
    console.log("STATUS: BROKEN");
  }
}

main().catch(console.error);
