import { createDeepSeekModels } from "../src/lib/ai/deepseek";

async function testDeepSeek() {
  console.log("🧪 Testing DeepSeek Model Integration\n");

  const models = createDeepSeekModels();

  console.log("✅ Available DeepSeek Models:");
  Object.keys(models).forEach((modelName) => {
    console.log(`   - ${modelName}`);
  });

  console.log("\n🔄 Testing API call with deepseek-v3.3...\n");

  try {
    const response = await fetch("https://sii3.top/api/deepseek.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        v3: "What is artificial intelligence?",
      }).toString(),
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      return;
    }

    const data = await response.json();

    console.log("✅ API Response:");
    console.log(`   Response: ${data.response}`);

    console.log("\n✨ DeepSeek Models Ready!");
    console.log("   - deepseek-v3.3: Most powerful model");
    console.log("   - deepseek-r1: Advanced reasoning model");
    console.log("\n📝 Features:");
    console.log("   ✅ Free to use");
    console.log("   ✅ No authentication required");
    console.log("   ✅ Ultra-intelligent models");
    console.log("   ✅ Advanced reasoning capabilities");
    console.log("   ❌ No tool calling support");
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testDeepSeek().catch(console.error);
