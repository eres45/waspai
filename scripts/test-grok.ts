import { createGrokModels } from "../src/lib/ai/grok";

async function testGrok() {
  console.log("🧪 Testing Grok-4 Model Integration\n");

  const models = createGrokModels();

  console.log("✅ Available Grok Models:");
  Object.keys(models).forEach((modelName) => {
    console.log(`   - ${modelName}`);
  });

  console.log("\n🔄 Testing API call with grok-4...\n");

  try {
    const response = await fetch(
      "https://sii3.top/api/grok4.php?text=What%20is%202%2B2%3F",
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      return;
    }

    const data = await response.json();

    console.log("✅ API Response:");
    console.log(`   Response: ${data.response}`);

    console.log("\n✨ Grok-4 Model Ready!");
    console.log("   - grok-4: Grok-4 model");
    console.log("\n📝 Features:");
    console.log("   ✅ Free to use");
    console.log("   ✅ No authentication required");
    console.log("   ✅ Fast responses");
    console.log("   ❌ No tool calling support");
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testGrok().catch(console.error);
