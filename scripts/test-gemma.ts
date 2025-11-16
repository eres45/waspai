import { createGemmaModels } from "../src/lib/ai/gemma";

async function testGemma() {
  console.log("🧪 Testing Gemma Model Integration\n");

  const models = createGemmaModels();

  console.log("✅ Available Gemma Models:");
  Object.keys(models).forEach((modelName) => {
    console.log(`   - ${modelName}`);
  });

  console.log("\n🔄 Testing API call with gemma-27b...\n");

  try {
    const response = await fetch("https://sii3.top/api/gemma.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "27b": "Explain machine learning in simple terms",
      }).toString(),
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      return;
    }

    const data = await response.json();

    console.log("✅ API Response:");
    console.log(`   Response: ${data.response}`);

    console.log("\n✨ Gemma Models Ready!");
    console.log("   - gemma-27b: Most powerful (best quality)");
    console.log("   - gemma-12b: Balanced (good quality & speed)");
    console.log("   - gemma-4b: Lightweight (fast responses)");
    console.log("\n📝 Features:");
    console.log("   ✅ Free to use");
    console.log("   ✅ No authentication required");
    console.log("   ✅ Multiple model sizes");
    console.log("   ✅ Fast responses");
    console.log("   ❌ No tool calling support");
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testGemma().catch(console.error);
