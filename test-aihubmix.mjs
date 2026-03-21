const workerUrl =
  "https://aihubmix-worker.llamai.workers.dev/v1/chat/completions";

async function testModel(modelId) {
  console.log(`Testing model: ${modelId}...`);
  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${modelId}: OK - ${data.choices[0].message.content}`);
    } else {
      const text = await response.text();
      console.log(`❌ ${modelId}: Failed - HTTP ${response.status} - ${text}`);
    }
  } catch (error) {
    console.log(`❌ ${modelId}: Error - ${error.message}`);
  }
}

async function main() {
  const models = [
    "coding-glm-5-free",
    "coding-minimax-m2.7-free",
    "gpt-4.1-free",
    "gemini-2.0-flash-free",
  ];

  for (const model of models) {
    await testModel(model);
  }
}

main();
