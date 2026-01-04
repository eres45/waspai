import { createGoogleGenerativeAI } from "@ai-sdk/google";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = "DUMMY_KEY";
const google = createGoogleGenerativeAI({ apiKey });
const model = google("gemini-1.5-flash");

console.log("Model Keys:", Object.keys(model));
console.log(
  "Config:",
  JSON.stringify(
    (model as any).config,
    (key, value) => (key === "apiKey" ? "***" : value),
    2,
  ),
);

// Check for doGenerate/doStream hidden properties
console.log("Has doGenerate:", typeof (model as any).doGenerate);
console.log("Has doStream:", typeof (model as any).doStream);
