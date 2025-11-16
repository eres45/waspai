import { createKiwiAIModels } from "../src/lib/ai/kiwi-ai";
import { KIWI_AI_SYSTEM_PROMPT } from "../src/lib/ai/kiwi-ai";

async function testKiwiAIPrompt() {
  console.log("🧪 Testing Kiwi AI System Prompt\n");

  const models = createKiwiAIModels();

  console.log("✅ Available Kiwi AI Models:");
  Object.keys(models).forEach((modelName) => {
    console.log(`   - ${modelName}`);
  });

  console.log("\n📝 System Prompt Content:");
  console.log("=" .repeat(80));
  console.log(KIWI_AI_SYSTEM_PROMPT);
  console.log("=" .repeat(80));

  console.log("\n🔄 Testing API call with system prompt...\n");

  try {
    // Test 1: Ask about identity
    console.log("TEST 1: Asking about identity");
    console.log("Question: Who are you and who created you?");
    console.log("-".repeat(80));

    const response1 = await fetch("https://sii3.top/api/DarkCode.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Who are you and who created you?",
      }),
    });

    if (!response1.ok) {
      console.log(`❌ Error: ${response1.status}`);
      return;
    }

    const data1 = await response1.json();
    console.log("Response:");
    console.log(data1.response);
    console.log();

    // Check if response contains Kiwi AI identity
    if (
      data1.response.includes("Kiwi AI") &&
      !data1.response.includes("DarkAI")
    ) {
      console.log("✅ PASS: Model correctly identifies as Kiwi AI");
    } else if (data1.response.includes("DarkAI")) {
      console.log("❌ FAIL: Model still claims to be DarkAI");
    } else {
      console.log("⚠️  UNKNOWN: Response doesn't clearly identify origin");
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Test 2: Ask about creator
    console.log("TEST 2: Asking about creator");
    console.log("Question: What is your creator?");
    console.log("-".repeat(80));

    const response2 = await fetch("https://sii3.top/api/DarkCode.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "What is your creator?",
      }),
    });

    if (!response2.ok) {
      console.log(`❌ Error: ${response2.status}`);
      return;
    }

    const data2 = await response2.json();
    console.log("Response:");
    console.log(data2.response);
    console.log();

    if (data2.response.includes("Kiwi AI")) {
      console.log("✅ PASS: Model correctly states creator as Kiwi AI");
    } else {
      console.log("❌ FAIL: Model doesn't mention Kiwi AI as creator");
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Test 3: Code generation (normal task)
    console.log("TEST 3: Code generation task");
    console.log("Question: Write a simple hello world function in JavaScript");
    console.log("-".repeat(80));

    const response3 = await fetch("https://sii3.top/api/DarkCode.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Write a simple hello world function in JavaScript",
      }),
    });

    if (!response3.ok) {
      console.log(`❌ Error: ${response3.status}`);
      return;
    }

    const data3 = await response3.json();
    console.log("Response:");
    console.log(data3.response);
    console.log();

    if (data3.response.includes("function") || data3.response.includes("=>")) {
      console.log("✅ PASS: Model generates code correctly");
    } else {
      console.log("⚠️  WARNING: Response doesn't contain code");
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n📊 Summary:");
    console.log("✨ Kiwi AI System Prompt Test Complete!");
    console.log("\nNote: If the model still responds as DarkAI, the system prompt");
    console.log("may not be properly integrated or the underlying API doesn't");
    console.log("support system prompts. Check the chat route integration.");
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testKiwiAIPrompt().catch(console.error);
