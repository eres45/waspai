import { stripReasoning } from "../src/lib/ai/reasoning-detector";

function testReasoning() {
  const models = [
    "nvidia-llama-3.3-nemotron-super-49b-v1.5",
    "microsoft-phi-3-medium-4k-instruct",
  ];

  const testInput =
    "<think>\nLet me analyze the request.\nI will provide a professional answer.\n</think>\nHere is your requested information.";

  console.log("--- Reasoning Detection Test ---");
  for (const model of models) {
    console.log(`Testing Model: ${model}`);
    const result = stripReasoning(testInput, model);

    if (
      result.hasReasoning &&
      result.cleanText.includes("Here is your requested information") &&
      !result.cleanText.includes("<think>")
    ) {
      console.log("✅ SUCCESS: Reasoning stripped correctly.");
      console.log(`  Thought: [${result.reasoning.substring(0, 30)}...]`);
      console.log(`  Clean: [${result.cleanText}]`);
    } else {
      console.log("❌ FAILED: Leakage detected!");
      console.log(`  Result: [${result.cleanText}]`);
    }
    console.log("--------------------------------");
  }
}

testReasoning();
