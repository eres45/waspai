const TOKEN = "EICMZ46M8iT-61zv";

async function testGeminiSearchDetailed() {
  console.log("🧪 Testing gemini-search model - Detailed Response Analysis\n");

  const queries = [
    "What is the current BTC price?",
    "Latest AI news today",
    "Best weather in New York today",
  ];

  for (const query of queries) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📌 Query: "${query}"`);
    console.log(`${"=".repeat(70)}\n`);

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
                content: query,
              },
            ],
            max_tokens: 1000,
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        console.log(`❌ Error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";

      console.log("📝 Full Response:");
      console.log(content);

      console.log("\n🔍 Analysis:");

      // Check for links
      const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
      const urls = content.match(urlPattern) || [];
      if (urls.length > 0) {
        console.log(`✅ Contains ${urls.length} link(s):`);
        urls.forEach((url, i) => {
          console.log(`   ${i + 1}. ${url}`);
        });
      } else {
        console.log("❌ No direct links found");
      }

      // Check for website mentions
      const websiteMentions = content.match(
        /(?:website|site|link|url|visit|check out|go to|source|reference)/gi
      ) || [];
      if (websiteMentions.length > 0) {
        console.log(
          `✅ Contains ${websiteMentions.length} website reference(s)`
        );
      }

      // Check for citations/sources
      const citations = content.match(/(?:\[.*?\]|\(.*?source.*?\))/gi) || [];
      if (citations.length > 0) {
        console.log(`✅ Contains ${citations.length} citation(s):`);
        citations.forEach((citation, i) => {
          console.log(`   ${i + 1}. ${citation}`);
        });
      }

      // Check for structured data
      const hasStructure =
        content.includes("•") ||
        content.includes("-") ||
        content.includes("1.") ||
        content.includes("**");
      if (hasStructure) {
        console.log("✅ Contains structured formatting (lists, bold, etc.)");
      }

      // Check content length
      console.log(`\n📊 Content Stats:`);
      console.log(`   Length: ${content.length} characters`);
      console.log(`   Paragraphs: ${content.split("\n\n").length}`);
      console.log(`   Lines: ${content.split("\n").length}`);

      // Wait between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }

  console.log(`\n\n${"=".repeat(70)}`);
  console.log("📋 SUMMARY");
  console.log(`${"=".repeat(70)}\n`);

  console.log(`✅ What gemini-search provides:`);
  console.log(`   • Text-based answers with current information`);
  console.log(`   • Synthesized information from web search`);
  console.log(`   • Structured formatting (lists, bold text)`);
  console.log(`   • May include links or website references`);
  console.log(`   • Real-time data (prices, news, weather)`);

  console.log(`\n⚠️  Limitations:`);
  console.log(`   • Not all responses include direct links`);
  console.log(`   • Links are embedded in text, not separate`);
  console.log(`   • No separate metadata or source list`);
  console.log(`   • Information is synthesized, not raw`);

  console.log(`\n💡 Recommendation:`);
  console.log(`   For users who need links/sources, consider:`);
  console.log(`   1. Adding a note in system prompt to include sources`);
  console.log(`   2. Parsing responses to extract URLs`);
  console.log(`   3. Offering a "show sources" follow-up option`);
}

testGeminiSearchDetailed().catch(console.error);
