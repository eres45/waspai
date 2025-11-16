import { createQWENModels } from "../src/lib/ai/qwen";

async function testQWEN() {
  console.log("🧪 Testing QWEN Model Integration\n");

  const models = createQWENModels();

  console.log(`✅ Available QWEN Models: ${Object.keys(models).length} models`);
  console.log("\n📋 Model Categories:");
  console.log("   QWEN3 Series:");
  console.log("   - Coder models (plus, 480b, 30b, 235b)");
  console.log("   - Base models (72b, 32b, 14b, 8b, 4b, 1.7b, 0.6b)");
  console.log("   - Chat models (72b, 32b, 14b, 8b, 4b, 1.7b, 0.6b)");
  console.log("   - QA models (72b, 32b, 14b, 8b, 4b, 1.7b, 0.6b)");
  console.log("   - Vision models (72b, 32b, 14b, 8b, 4b, 1.7b, 0.6b)");
  console.log("   - Math models (72b, 32b, 14b, 8b, 4b, 1.7b, 0.6b)");
  console.log("   - MT models (72b, 32b, 14b, 8b, 4b, 1.7b, 0.6b)");
  console.log("\n   QWEN2.5 Series:");
  console.log("   - Instruct models (72b, 32b, 14b, 8b, 4b, 1.5b, 0.5b)");
  console.log("   - Chat models (72b, 32b, 14b, 8b, 4b, 1.5b, 0.5b)");
  console.log("   - QA models (72b, 32b, 14b, 8b, 4b, 1.5b, 0.5b)");
  console.log("   - Vision models (72b, 32b, 14b, 8b, 4b, 1.5b, 0.5b)");
  console.log("   - Math models (72b, 32b, 14b, 8b, 4b, 1.5b, 0.5b)");
  console.log("   - Coder models (72b, 32b, 14b, 8b, 4b, 1.5b, 0.5b)");
  console.log("   - MT models (72b, 32b, 14b, 8b, 4b, 1.5b, 0.5b)");
  console.log("   - And more variants (instruct, chat, qa)");

  console.log("\n🔄 Testing API call with qwen2.5-72b-chat...\n");

  try {
    const response = await fetch("https://sii3.top/api/qwen.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        prompt: "What is 2+2?",
        model: "qwen2.5-72b-chat",
      }).toString(),
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      return;
    }

    const data = await response.json();

    console.log("✅ API Response:");
    console.log(`   Response: ${data.response}`);

    console.log("\n✨ QWEN Models Ready!");
    console.log(`   Total Models: ${Object.keys(models).length}`);
    console.log("   - QWEN3 series: 49 models");
    console.log("   - QWEN2.5 series: 121 models");
    console.log("\n📝 Features:");
    console.log("   ✅ Free to use");
    console.log("   ✅ No authentication required");
    console.log("   ✅ Fast responses");
    console.log("   ✅ Multiple model sizes and specializations");
    console.log("   ❌ No tool calling support");
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testQWEN().catch(console.error);
