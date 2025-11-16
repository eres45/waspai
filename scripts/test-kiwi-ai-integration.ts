import { createKiwiAIModels } from "../src/lib/ai/kiwi-ai";
import { generateText } from "ai";

async function testKiwiAIIntegration() {
  console.log("🧪 Testing Kiwi AI Integration with System Prompt\n");

  const models = createKiwiAIModels();
  const model = models["dark-code-76"];

  if (!model) {
    console.log("❌ Model not found");
    return;
  }

  console.log("✅ Kiwi AI Dark Code 76 model loaded\n");

  // Test 1: Identity question
  console.log("TEST 1: Identity Question");
  console.log("Question: Who are you and who created you?");
  console.log("-".repeat(80));

  try {
    const result1 = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: "Who are you and who created you?",
        },
      ],
    });

    console.log("Response:");
    console.log(result1.text);
    console.log();

    if (result1.text.includes("Kiwi AI")) {
      console.log("✅ PASS: Model identifies as Kiwi AI");
    } else if (result1.text.includes("DarkAI")) {
      console.log("❌ FAIL: Model still claims to be DarkAI");
    }
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Test 2: Creator question
  console.log("TEST 2: Creator Question");
  console.log("Question: What is your creator?");
  console.log("-".repeat(80));

  try {
    const result2 = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: "What is your creator?",
        },
      ],
    });

    console.log("Response:");
    console.log(result2.text);
    console.log();

    if (result2.text.includes("Kiwi AI")) {
      console.log("✅ PASS: Model correctly states Kiwi AI as creator");
    } else if (result2.text.includes("DarkAI")) {
      console.log("❌ FAIL: Model still mentions DarkAI");
    }
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Test 3: Code generation
  console.log("TEST 3: Code Generation");
  console.log("Question: Write a simple hello world function in JavaScript");
  console.log("-".repeat(80));

  try {
    const result3 = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: "Write a simple hello world function in JavaScript",
        },
      ],
    });

    console.log("Response:");
    console.log(result3.text);
    console.log();

    if (result3.text.includes("function") || result3.text.includes("=>")) {
      console.log("✅ PASS: Model generates code correctly");
    }
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✨ Kiwi AI Integration Test Complete!");
}

testKiwiAIIntegration().catch(console.error);
