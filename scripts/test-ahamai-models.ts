const API_URL =
  "https://ahamai-api.officialprakashkrsingh.workers.dev/v1/chat/completions";
const API_KEY = "ahamaipriv05";

const modelsToTest = [
  "qwen-coder-480b",
  "qwen-32b",
  "glm-4.5-air",
  "exaanswer",
  "felo",
];

async function testModel(modelId) {
  console.log(`Testing model: ${modelId}...`);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        Origin: "https://ahamai-api.officialprakashkrsingh.workers.dev",
        Referer: "https://ahamai-api.officialprakashkrsingh.workers.dev/",
        Accept: "*/*",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "Say hello in one word." }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(
        `✅ ${modelId} working. Response: ${data.choices[0].message.content}`,
      );
      return true;
    } else {
      console.log(`❌ ${modelId} failed. Status: ${response.status}`);
      const text = await response.text();
      console.log(`Error: ${text}`);
      return false;
    }
  } catch (e) {
    console.log(`❌ ${modelId} failed with error: ${e.message}`);
    return false;
  }
}

async function runTests() {
  const workingModels = [];
  for (const model of modelsToTest) {
    const success = await testModel(model);
    if (success) workingModels.push(model);
    await new Promise((r) => setTimeout(r, 500)); // Rate limit safety
  }
  console.log("\n--- Test Summary ---");
  console.log(`Total models tested: ${modelsToTest.length}`);
  console.log(`Working models: ${workingModels.length}`);
  console.log(JSON.stringify(workingModels, null, 2));
}

runTests();
