const apis = [
  {
    name: "Nano-Banana API",
    url: "https://sii3.top/api/nano-banana.php",
    prompt: "a cute cat",
  },
];

async function testAPI(api) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${api.name}`);
  console.log(`URL: ${api.url}`);
  console.log(`Prompt: ${api.prompt}`);
  console.log("=".repeat(60));

  const startTime = Date.now();
  try {
    // Use POST with FormData for Nano-Banana
    const formData = new URLSearchParams();
    formData.append("text", api.prompt);

    console.log(`Sending POST request with text parameter...`);

    const response = await fetch(api.url, {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);

    const contentType = response.headers.get("content-type");
    console.log(`📦 Content-Type: ${contentType}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers));

    // Try to get response body
    const text = await response.text();
    console.log(`📝 Response Body (first 500 chars):\n${text.substring(0, 500)}`);

    if (response.ok) {
      if (contentType?.includes("image")) {
        console.log(`✅ Image received`);
      } else if (contentType?.includes("json")) {
        try {
          const json = JSON.parse(text);
          console.log(`📄 JSON Response:`, JSON.stringify(json, null, 2));
        } catch (e) {
          console.log(`⚠️  Could not parse JSON`);
        }
      }
    } else {
      console.log(`❌ Error Status: ${response.status}`);
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);
  }
}

async function runTests() {
  console.log("\n🚀 Starting Nano-Banana API Test...\n");
  
  for (const api of apis) {
    await testAPI(api);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ Test completed!");
  console.log("=".repeat(60));
}

runTests().catch(console.error);
