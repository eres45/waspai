import { customModelProvider } from "../src/lib/ai/models";

console.log("🧪 Testing Model Registration\n");

console.log("📋 Available Providers:");
customModelProvider.modelsInfo.forEach((providerInfo) => {
  console.log(`\n  Provider: ${providerInfo.provider}`);
  console.log(`  Has API Key: ${providerInfo.hasAPIKey}`);
  console.log(`  Models:`);
  providerInfo.models.forEach((model) => {
    console.log(
      `    - ${model.name} (Tool Support: ${!model.isToolCallUnsupported}, Image Support: ${!model.isImageInputUnsupported})`
    );
  });
});

console.log("\n\n🔍 Testing Model Retrieval:");

// Test GPT-OSS model
const gptOssModel = customModelProvider.getModel({
  provider: "gpt-oss",
  model: "gpt-oss-120b",
});
console.log(`✅ GPT-OSS 120B retrieved:`, gptOssModel ? "YES" : "NO");

// Test Pollinations model
const pollModel = customModelProvider.getModel({
  provider: "pollinations",
  model: "openai",
});
console.log(`✅ Pollinations OpenAI retrieved:`, pollModel ? "YES" : "NO");

// Test fallback
const fallbackModel = customModelProvider.getModel(undefined);
console.log(`✅ Fallback model retrieved:`, fallbackModel ? "YES" : "NO");

// Test invalid model
const invalidModel = customModelProvider.getModel({
  provider: "invalid",
  model: "invalid",
});
console.log(
  `✅ Invalid model falls back to default:`,
  invalidModel ? "YES" : "NO"
);
