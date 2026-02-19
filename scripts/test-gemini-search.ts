const TOKEN = "EICMZ46M8iT-61zv";

async function testGeminiSearch() {
  console.log("🧪 Testing gemini-search model directly\n");
  console.log("Query: What is the current BTC price?\n");

  try {
    const response = await fetch(
      "https://text.pollinations.ai/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          model: "gemini-search",
          messages: [
            {
              role: "user",
              content: "What is the current BTC price?",
            },
          ],
          max_tokens: 500,
          stream: false,
        }),
      },
    );

    console.log(`Status: ${response.status}\n`);

    if (!response.ok) {
      const error = await response.text();
      console.log("❌ Error response:");
      console.log(error);
      return;
    }

    const data = await response.json();

    console.log("✅ Response received!\n");
    console.log("📊 Response Structure:");
    console.log(`Model: ${data.model}`);
    console.log(`Provider: ${data.provider}`);
    console.log(`Tokens used: ${data.usage?.total_tokens}`);

    console.log("\n📝 Answer:");
    console.log(data.choices[0]?.message?.content);

    console.log("\n✨ Analysis:");
    if (
      data.choices[0]?.message?.content?.toLowerCase().includes("btc") ||
      data.choices[0]?.message?.content?.toLowerCase().includes("bitcoin") ||
      data.choices[0]?.message?.content?.toLowerCase().includes("price") ||
      data.choices[0]?.message?.content?.toLowerCase().includes("$")
    ) {
      console.log(
        "✅ Response contains BTC/price information - SEARCH WORKING!",
      );
    } else {
      console.log("⚠️  Response might not contain real-time data");
    }
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

testGeminiSearch().catch(console.error);
