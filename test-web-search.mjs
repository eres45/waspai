/**
 * Test SearchFlox AI Web Search Integration
 */

console.log("🧪 Testing SearchFlox AI Web Search\n");
console.log("=".repeat(60));

// Test 1: Non-streaming search
async function testNonStreamingSearch() {
  console.log("\n📝 Test 1: Non-Streaming Search");
  console.log("-".repeat(60));

  const query = "latest AI news 2025";
  const searchUrl = "https://searchfloxai.vercel.app/api/search";

  try {
    console.log(`🔍 Searching for: "${query}"`);

    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    console.log(`📊 Response Status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
      return false;
    }

    const data = await response.json();

    console.log(`✅ Search successful!`);
    console.log(`📄 Query: ${data.query}`);
    console.log(`📊 Results length: ${data.text.length} characters`);
    console.log(`🔗 Sources found: ${data.sources?.length || 0}`);
    console.log(`⏰ Timestamp: ${new Date(data.timestamp).toLocaleString()}`);

    if (data.sources && data.sources.length > 0) {
      console.log(`\n📚 Top Sources:`);
      data.sources.slice(0, 3).forEach((source, i) => {
        console.log(`  ${i + 1}. ${source.title}`);
        console.log(`     ${source.url}`);
      });
    }

    console.log(`\n📝 Results Preview (first 200 chars):`);
    console.log(`   ${data.text.substring(0, 200)}...`);

    return true;
  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
    return false;
  }
}

// Test 2: Streaming search
async function testStreamingSearch() {
  console.log("\n📝 Test 2: Streaming Search");
  console.log("-".repeat(60));

  const query = "TypeScript tutorial";
  const encodedQuery = encodeURIComponent(query);
  const streamUrl = `https://searchfloxai.vercel.app/api/search/stream?q=${encodedQuery}`;

  try {
    console.log(`🔍 Streaming search for: "${query}"`);

    const response = await fetch(streamUrl);

    console.log(`📊 Response Status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ Error: ${response.status}`);
      return false;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.error(`❌ Failed to get reader`);
      return false;
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let chunkCount = 0;

    console.log(`\n📡 Streaming results:`);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "done") {
            console.log(`\n✅ Streaming complete!`);
            break;
          }

          try {
            const payload = JSON.parse(data);
            if (payload.type === "text") {
              fullText += payload.data;
              chunkCount++;
              process.stdout.write(payload.data);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    reader.releaseLock();

    console.log(`\n\n📊 Streaming Stats:`);
    console.log(`   Total chunks: ${chunkCount}`);
    console.log(`   Total characters: ${fullText.length}`);

    return true;
  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
    return false;
  }
}

// Test 3: Error handling
async function testErrorHandling() {
  console.log("\n📝 Test 3: Error Handling");
  console.log("-".repeat(60));

  const searchUrl = "https://searchfloxai.vercel.app/api/search";

  try {
    console.log(`🔍 Testing with empty query (should fail)`);

    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "" }),
    });

    console.log(`📊 Response Status: ${response.status}`);

    if (response.status === 400) {
      console.log(`✅ Correctly rejected empty query with 400 status`);
      return true;
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];

  results.push(await testNonStreamingSearch());
  results.push(await testStreamingSearch());
  results.push(await testErrorHandling());

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(
    `   ✅ Passed: ${results.filter((r) => r).length}/${results.length}`,
  );
  console.log(
    `   ❌ Failed: ${results.filter((r) => !r).length}/${results.length}`,
  );

  if (results.every((r) => r)) {
    console.log(`\n✅ All tests passed! SearchFlox integration is working!`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the output above.`);
  }
}

runAllTests().catch(console.error);
