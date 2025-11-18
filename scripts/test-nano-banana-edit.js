const apis = [
  {
    name: "Nano-Banana Edit API (GET)",
    url: "https://vetrex.x10.mx/api/nano_banana.php",
    method: "GET",
    prompt: "Make the image colorful",
    imageUrl: "https://vetrex.x10.mx/api/photo/test.jpg",
  },
  {
    name: "Nano-Banana Edit API (POST)",
    url: "https://vetrex.x10.mx/api/nano_banana.php",
    method: "POST",
    prompt: "Make the image more vibrant",
    imageUrl: "https://vetrex.x10.mx/api/photo/test.jpg",
  },
];

async function testAPI(api) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${api.name}`);
  console.log(`URL: ${api.url}`);
  console.log(`Method: ${api.method}`);
  console.log(`Prompt: ${api.prompt}`);
  console.log(`Image URL: ${api.imageUrl}`);
  console.log("=".repeat(60));

  const startTime = Date.now();
  try {
    let response;

    if (api.method === "GET") {
      const url = new URL(api.url);
      url.searchParams.append("prompt", api.prompt);
      url.searchParams.append("imageUrl", api.imageUrl);
      console.log(`Full URL: ${url.toString()}`);
      console.log("Sending GET request...");

      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    } else {
      const payload = {
        prompt: api.prompt,
        imageUrl: api.imageUrl,
      };
      console.log(`Payload: ${JSON.stringify(payload)}`);
      console.log("Sending POST request...");

      response = await fetch(api.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify(payload),
      });
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);

    const contentType = response.headers.get("content-type");
    console.log(`📦 Content-Type: ${contentType}`);

    // Try to get response body
    const text = await response.text();
    console.log(
      `📝 Response Body (first 500 chars):\n${text.substring(0, 500)}`,
    );

    if (response.ok) {
      if (contentType?.includes("image")) {
        console.log(`✅ Image received`);
      } else if (contentType?.includes("json")) {
        try {
          const json = JSON.parse(text);
          console.log(`📄 JSON Response:`, JSON.stringify(json, null, 2));

          if (json.image || json.url || json.result) {
            console.log(`✅ Image URL provided`);
          }
        } catch (_e) {
          console.log(`⚠️  Could not parse JSON`);
        }
      }
    } else {
      console.log(`❌ Error Status: ${response.status}`);
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.log(`⏱️  Response Time: ${responseTime}ms`);
  }
}

async function runTests() {
  console.log("\n🚀 Starting Nano-Banana Edit API Tests...\n");

  for (const api of apis) {
    await testAPI(api);
    // Wait 2 seconds between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ All tests completed!");
  console.log("=".repeat(60));
}

runTests().catch(console.error);
