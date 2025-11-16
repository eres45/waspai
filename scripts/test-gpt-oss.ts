import { createGptOssModels } from "../src/lib/ai/gpt-oss";

async function testGptOss() {
  console.log("🧪 Testing GPT-OSS Models Integration\n");

  const models = createGptOssModels();

  console.log("✅ Available GPT-OSS Models:");
  Object.keys(models).forEach((modelName) => {
    console.log(`   - ${modelName}`);
  });

  console.log("\n🔄 Testing API call with gpt-oss-120b...\n");

  try {
    const response = await fetch("https://sii3.top/api/gpt-oss.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "What is 2+2?",
      }),
    });

    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      return;
    }

    const data = await response.json();

    console.log("✅ API Response:");
    console.log(`   Date: ${data.date}`);
    console.log(`   Response: ${data.response}`);
    console.log(`   Dev: ${data.dev}`);

    console.log("\n✨ GPT-OSS Models Ready!");
    console.log("   - gpt-oss-120b: GPT-OSS 120B model");
    console.log("   - gpt-4-117b: GPT-4 117B model");
    console.log("\n📝 Features:");
    console.log("   ✅ Free to use");
    console.log("   ✅ No authentication required");
    console.log("   ✅ Fast responses");
    console.log("   ❌ No tool calling support");
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testGptOss().catch(console.error);
