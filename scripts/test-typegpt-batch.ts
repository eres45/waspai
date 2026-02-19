import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import "dotenv/config";

// List extracted from user request
const modelsToTest = [
  "chatgpt-4o-latest",
  "command-a-03-2025",
  "command-r-08-2024",
  "command-r-plus-08-2024",
  "command-r7b-12-2024",
  "deepseek-ai/deepseek-r1",
  "deepseek-ai/deepseek-r1-distill-qwen-32b",
  "deepseek-ai/deepseek-v3.1",
  "deepseek-ai/deepseek-v3.1-terminus",
  "DeepSeek-R1-0528",
  "deepseek-r1t2-chimera",
  "DeepSeek-V3.1-Terminus",
  "glm-4.5-air",
  "gpt-4.1-2025-04-14",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4o-search-preview-2025-03-11",
  "gpt-5-mini-2025-08-07",
  "gpt-5-nano-2025-08-07",
  "gpt-5.1-codex-max",
  "gpt-5.2",
  "gpt-5.2-2025-12-11",
  "gpt-5.2-chat-latest",
  "gpt-5.2-pro",
  "llama-3.1-8b-instant",
  "meta/llama-3.2-90b-vision-instruct",
  "meta/llama-4-scout-17b-16e-instruct",
  "minimaxai/minimax-m2",
  "moonshotai/kimi-k2-instruct-0905",
  "nemotron-3-nano-30b-a3b",
  "nemotron-nano-9b-v2",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen-3-235b-a22b-instruct-2507",
  "umbra",
];

async function testModels() {
  const apiKey = process.env.TYPEGPT_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ No TYPEGPT_API_KEY found in environment environment variables.",
    );
    console.log("Cannot test models without an API key.");
    return;
  }

  console.log(
    `Starting test for ${modelsToTest.length} models using TypeGPT API...`,
  );
  console.log("---------------------------------------------------");

  const results: { model: string; status: string; error?: string }[] = [];

  for (const model of modelsToTest) {
    process.stdout.write(`Testing ${model}... `);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch("https://typegpt.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log("✅ OK");
        results.push({ model, status: "OK" });
      } else {
        const text = await response.text();
        console.log(`❌ Failed (${response.status})`);
        results.push({
          model,
          status: "FAILED",
          error: `${response.status} ${response.statusText}`,
        });
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
      results.push({ model, status: "ERROR", error: error.message });
    }
  }

  console.log("\n---------------------------------------------------");
  console.log("Summary:");
  const working = results.filter((r) => r.status === "OK");
  const failed = results.filter((r) => r.status !== "OK");

  console.log(`Working: ${working.length}`);
  console.log(`Failed: ${failed.length}`);

  if (working.length > 0) {
    console.log("\nWorking Models:");
    working.forEach((w) => console.log(`- ${w.model}`));
  }
}

testModels();
