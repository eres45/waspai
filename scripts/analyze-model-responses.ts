const TOKEN = "EICMZ46M8iT-61zv";

async function analyzeModel(modelName: string, prompt: string) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🔍 Analyzing: ${modelName}`);
  console.log(`Prompt: "${prompt}"`);
  console.log(`${"=".repeat(70)}\n`);

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
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.log(`❌ Error: HTTP ${response.status}`);
      const errorText = await response.text();
      console.log(`Error details: ${errorText}`);
      return;
    }

    const data = await response.json();

    // Analyze structure
    console.log("📊 Response Structure Analysis:\n");

    console.log("Top-level keys:");
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (typeof value === "object" && value !== null) {
        console.log(`  • ${key}: [object]`);
      } else if (Array.isArray(value)) {
        console.log(`  • ${key}: [array with ${value.length} items]`);
      } else {
        console.log(`  • ${key}: ${typeof value}`);
      }
    });

    console.log("\n📨 Message Structure:");
    if (data.choices?.[0]?.message) {
      const msg = data.choices[0].message;
      console.log("Message keys:");
      Object.keys(msg).forEach((key) => {
        const value = msg[key];
        if (key === "content") {
          console.log(`  • ${key}: "${value?.substring(0, 100)}..."`);
        } else if (key === "reasoning") {
          console.log(`  • ${key}: "${value?.substring(0, 100)}..."`);
        } else if (typeof value === "object") {
          console.log(
            `  • ${key}: ${JSON.stringify(value).substring(0, 100)}...`,
          );
        } else {
          console.log(`  • ${key}: ${value}`);
        }
      });
    }

    console.log("\n🔍 Special Fields Check:");
    let _hasReasoning = false;
    let _hasSearchResults = false;
    let _hasAudio = false;

    // Check for reasoning
    if (data.choices?.[0]?.message?.reasoning) {
      _hasReasoning = true;
      console.log("✅ Found 'reasoning' in message");
      console.log(
        `   Content: "${data.choices[0].message.reasoning.substring(0, 150)}..."`,
      );
    }

    // Check for search results at different levels
    if (data.search_results) {
      _hasSearchResults = true;
      console.log("✅ Found 'search_results' at top level");
      console.log(
        `   Type: ${Array.isArray(data.search_results) ? "array" : "object"}`,
      );
      if (Array.isArray(data.search_results)) {
        console.log(`   Count: ${data.search_results.length} results`);
        if (data.search_results[0]) {
          console.log(
            `   First result keys: ${Object.keys(data.search_results[0]).join(", ")}`,
          );
        }
      }
    }

    if (data.choices?.[0]?.message?.search_results) {
      _hasSearchResults = true;
      console.log("✅ Found 'search_results' in message");
      console.log(
        `   Type: ${Array.isArray(data.choices[0].message.search_results) ? "array" : "object"}`,
      );
    }

    // Check for audio
    if (data.choices?.[0]?.message?.audio) {
      _hasAudio = true;
      console.log("✅ Found 'audio' in message");
      const audio = data.choices[0].message.audio;
      console.log(`   Type: ${typeof audio}`);
      if (typeof audio === "object") {
        console.log(`   Keys: ${Object.keys(audio).join(", ")}`);
      }
    }

    if (data.audio) {
      _hasAudio = true;
      console.log("✅ Found 'audio' at top level");
      console.log(`   Type: ${typeof data.audio}`);
    }

    console.log("\n📝 Full Response (first 1000 chars):");
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

async function main() {
  console.log("🚀 Pollinations AI - Response Structure Analysis");
  console.log("================================================\n");

  // Test reasoning model
  await analyzeModel(
    "openai-reasoning",
    "What is 15 * 8 + 25? Show step by step.",
  );

  // Wait between requests
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test search model
  await analyzeModel("gemini-search", "What are the top AI news in 2024?");

  // Wait between requests
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test audio model (might fail, but let's see the error)
  await analyzeModel("openai-audio", "Say hello");

  console.log("\n\n" + "=".repeat(70));
  console.log("📋 SUMMARY");
  console.log("=".repeat(70));
  console.log(`
✅ openai-reasoning:
   - Returns standard OpenAI chat completion format
   - Check if 'reasoning' field is in message object
   - May need to parse reasoning from content

✅ gemini-search:
   - Returns standard OpenAI chat completion format
   - Check if 'search_results' field is present
   - May include search context in content

⚠️  openai-audio:
   - Requires special audio input format
   - May need different request structure
   - Check Pollinations API docs for audio support
  `);
}

main().catch(console.error);
