import { createGeminiDarkModels } from "../src/lib/ai/gemini-dark";

async function testGeminiDark() {
  console.log("🧪 Testing Gemini Dark Model Integration\n");

  const models = createGeminiDarkModels();

  console.log("✅ Available Gemini Models:");
  Object.keys(models).forEach((modelName) => {
    console.log(`   - ${modelName}`);
  });

  console.log("\n🔄 Testing API call with gemini-2.5-pro...\n");

  try {
    const response = await fetch("https://sii3.top/api/gemini-dark.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "gemini-pro": "Explain quantum computing in simple terms",
      }),
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      return;
    }

    const data = await response.json();

    console.log("✅ API Response:");
    console.log(`   Response: ${data.response}`);

    console.log("\n✨ Gemini Models Ready!");
    console.log("   - gemini-2.5-pro: Most powerful (best quality)");
    console.log("   - gemini-2.5-deep-search: Advanced reasoning");
    console.log("   - gemini-2.5-flash: Fast and efficient");
    console.log("\n📝 Features:");
    console.log("   ✅ Free to use");
    console.log("   ✅ No authentication required");
    console.log("   ✅ Latest Gemini 2.5 models");
    console.log("   ✅ Fast responses");
    console.log("   ❌ No tool calling support");
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testGeminiDark().catch(console.error);
