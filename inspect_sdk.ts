import { createGoogleGenerativeAI } from "@ai-sdk/google";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY?.split(",")[0] || "dummy";
const google = createGoogleGenerativeAI({ apiKey });
const model = google("gemini-1.5-flash");

console.log("Model Keys:", Object.keys(model));
console.log("specificationVersion:", (model as any).specificationVersion);
console.log("provider:", (model as any).provider);
console.log("modelId:", (model as any).modelId);
