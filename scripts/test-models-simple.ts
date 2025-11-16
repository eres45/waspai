const TOKEN = "EICMZ46M8iT-61zv";

async function testModel(modelName: string) {
  console.log(`Testing ${modelName}...`);

  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      }),
    });

    console.log(`${modelName}: ${response.status}`);
    if (!response.ok) {
      const text = await response.text();
      console.log(`Error: ${text}`);
    } else {
      const data = await response.json();
      console.log(`Success: ${JSON.stringify(data).substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`${modelName}: Error - ${error}`);
  }
}

async function listModels() {
  console.log("Fetching models...\n");
  try {
    const response = await fetch("https://text.pollinations.ai/models");
    const models = await response.json();
    console.log(`Found ${models.length} models:\n`);
    models.forEach((m: any) => {
      console.log(`• ${m.name} (${m.tier}): ${m.description}`);
    });
    return models;
  } catch (error) {
    console.log(`Error fetching models: ${error}`);
    return [];
  }
}

async function main() {
  const models = await listModels();

  console.log("\n\nTesting seed tier models:\n");

  const seedModels = models.filter((m: any) => m.tier === "seed");
  for (const model of seedModels.slice(0, 3)) {
    await testModel(model.name);
    console.log("");
  }
}

main();
