async function testSonnetModels() {
  console.log("🧪 Testing Sonnet Free Models\n");

  const endpoints = [
    {
      name: "Reasoning",
      url: "https://sonnet3-5.free.nf/api/reasoning.php?text=من انت",
    },
    {
      name: "Chat",
      url: "https://sonnet3-5.free.nf/api/at.php?text=مرحبا",
    },
    {
      name: "Coder",
      url: "https://sonnet3-5.free.nf/api/coder.php?text=اكتب hello world",
    },
    {
      name: "Math",
      url: "https://sonnet3-5.free.nf/api/math.php?text=2+2",
    },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    console.log("-".repeat(80));

    try {
      const response = await fetch(endpoint.url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        console.log(`❌ Error: HTTP ${response.status}`);
        continue;
      }

      const contentType = response.headers.get("content-type");
      console.log(`Content-Type: ${contentType}`);

      if (contentType?.includes("application/json")) {
        const data = await response.json();
        console.log("✅ Status: Success (JSON)");
        console.log("\nResponse Data:");
        console.log(JSON.stringify(data, null, 2));

        // Try to extract model name from response
        if (data) {
          console.log("\n📋 Response Keys:");
          Object.keys(data).forEach((key) => {
            const value = JSON.stringify(data[key]).substring(0, 100);
            console.log(`   - ${key}: ${value}`);
          });
        }
      } else {
        const text = await response.text();
        console.log("⚠️ Status: Not JSON");
        console.log("\nResponse Text (first 500 chars):");
        console.log(text.substring(0, 500));
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✨ Sonnet Free Models Test Complete!");
  console.log("\nNext steps:");
  console.log("1. Check the response data above");
  console.log("2. Look for model name indicators in the responses");
  console.log("3. Update the model names in src/app/api/chat/models/route.ts");
}

testSonnetModels().catch(console.error);
