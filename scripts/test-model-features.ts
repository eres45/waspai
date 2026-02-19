const TOKEN = "EICMZ46M8iT-61zv";

interface TestModelFeatureResult {
  model: string;
  success: boolean;
  responseStructure: any;
  specialFields: string[];
  rawResponse: string;
}

async function testModelFeature(
  modelName: string,
  prompt: string,
): Promise<TestModelFeatureResult> {
  console.log(`\n🧪 Testing ${modelName}...`);
  console.log(`Prompt: ${prompt}\n`);

  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.log(`❌ Failed: ${response.status}`);
      return {
        model: modelName,
        success: false,
        responseStructure: null,
        specialFields: [],
        rawResponse: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    const rawResponse = JSON.stringify(data, null, 2);

    console.log("📋 Response Structure:");
    console.log(rawResponse);

    // Extract special fields
    const specialFields: string[] = [];
    if (data.choices?.[0]?.message?.reasoning) {
      specialFields.push("reasoning");
      console.log("\n✨ Found 'reasoning' field:");
      console.log(data.choices[0].message.reasoning);
    }
    if (data.choices?.[0]?.message?.content) {
      console.log("\n📝 Content:");
      console.log(data.choices[0].message.content);
    }
    if (data.choices?.[0]?.message?.audio) {
      specialFields.push("audio");
      console.log("\n🔊 Found 'audio' field");
    }
    if (data.search_results) {
      specialFields.push("search_results");
      console.log("\n🔍 Found 'search_results':");
      console.log(JSON.stringify(data.search_results, null, 2));
    }
    if (data.choices?.[0]?.message?.search_results) {
      specialFields.push("search_results_in_message");
      console.log("\n🔍 Found 'search_results' in message:");
      console.log(
        JSON.stringify(data.choices[0].message.search_results, null, 2),
      );
    }

    return {
      model: modelName,
      success: true,
      responseStructure: data,
      specialFields,
      rawResponse,
    };
  } catch (error) {
    console.log(`❌ Error: ${error}`);
    return {
      model: modelName,
      success: false,
      responseStructure: null,
      specialFields: [],
      rawResponse: String(error),
    };
  }
}

async function main() {
  console.log("🚀 Pollinations AI - Model Features Test");
  console.log("========================================\n");

  const tests = [
    {
      model: "openai-reasoning",
      prompt:
        "Solve this step by step: What is 25 * 4 + 10? Show your reasoning.",
      description: "Testing reasoning model",
    },
    {
      model: "gemini-search",
      prompt: "What are the latest AI developments in 2024?",
      description: "Testing search results",
    },
    {
      model: "openai-audio",
      prompt: "Say hello in a friendly voice",
      description: "Testing audio output",
    },
  ];

  const results: TestModelFeatureResult[] = [];

  for (const test of tests) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📌 ${test.description}`);
    console.log(`${"=".repeat(60)}`);

    const result = await testModelFeature(test.model, test.prompt);
    results.push(result);

    // Delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("📊 SUMMARY");
  console.log(`${"=".repeat(60)}\n`);

  results.forEach((r) => {
    console.log(`${r.model}:`);
    console.log(`  Success: ${r.success}`);
    console.log(`  Special Fields: ${r.specialFields.join(", ") || "None"}`);
    console.log("");
  });

  console.log("\n💡 Key Findings:");
  console.log("================\n");

  const reasoningResult = results.find((r) => r.model === "openai-reasoning");
  if (reasoningResult?.specialFields.includes("reasoning")) {
    console.log(
      "✅ openai-reasoning: Returns 'reasoning' field with step-by-step thinking",
    );
  } else {
    console.log(
      "⚠️  openai-reasoning: Check response structure for reasoning data",
    );
  }

  const searchResult = results.find((r) => r.model === "gemini-search");
  if (
    searchResult?.specialFields.includes("search_results") ||
    searchResult?.specialFields.includes("search_results_in_message")
  ) {
    console.log("✅ gemini-search: Returns search results");
  } else {
    console.log("⚠️  gemini-search: Check response structure for search data");
  }

  const audioResult = results.find((r) => r.model === "openai-audio");
  if (audioResult?.specialFields.includes("audio")) {
    console.log("✅ openai-audio: Returns 'audio' field with audio data");
  } else {
    console.log("⚠️  openai-audio: Check response structure for audio data");
  }
}

main().catch(console.error);
