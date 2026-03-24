import { extractTextFromDocuments } from "../src/lib/ocr/ocr-service";
import * as dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  // A simple image with text (Google logo or similar)
  const imageUrl =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
  console.log("Testing OCR with:", imageUrl);

  const startTime = Date.now();
  const result = await extractTextFromDocuments("Initial Message", [imageUrl]);
  const duration = Date.now() - startTime;

  console.log("--- OCR RESULTS ---");
  console.log(`Duration: ${duration}ms`);
  console.log(result);
  console.log("-------------------");

  if (result.includes("Google") || result.toLowerCase().includes("google")) {
    console.log("✅ OCR seems to work!");
  } else if (result === "Initial Message") {
    console.log(
      "❌ OCR returned original text (failed to extract or no text found)",
    );
  } else {
    console.log("⚠️ OCR returned something, but not what was expected.");
  }
}

main().catch(console.error);
