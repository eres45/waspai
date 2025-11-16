interface APITest {
  name: string;
  url: string;
  prompt: string;
}

const apis: APITest[] = [
  {
    name: "SeaArt AI",
    url: "https://seaart-ai.apis-bj-devs.workers.dev/",
    prompt: "a cute boy",
  },
  {
    name: "Text to Image",
    url: "https://text-to-img.apis-bj-devs.workers.dev/",
    prompt: "cute girl",
  },
  {
    name: "Diffusion AI",
    url: "https://diffusion-ai.bjcoderx.workers.dev/",
    prompt: "a cute baby",
  },
];

async function testAPI(api: APITest) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${api.name}`);
  console.log(`URL: ${api.url}`);
  console.log(`Prompt: ${api.prompt}`);
  console.log("=".repeat(60));

  const startTime = Date.now();
  try {
    const url = new URL(api.url);
    url.searchParams.append("prompt", api.prompt);

    console.log(`Full URL: ${url.toString()}`);
    console.log("Sending request...");

    const response = await fetch(url.toString(), {
      method: "GET",
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);

    const contentType = response.headers.get("content-type");
    console.log(`📦 Content-Type: ${contentType}`);

    // Check if it's an image
    if (contentType?.includes("image")) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`✅ Image received: ${buffer.length} bytes`);
      console.log(`✅ Status: WORKING`);
    } else if (contentType?.includes("json")) {
      const json = await response.json();
      console.log(`📄 JSON Response:`, JSON.stringify(json, null, 2));
      
      // Check if it contains image URL
      if (json.url || json.image_url || json.data) {
        console.log(`✅ Image URL provided: ${json.url || json.image_url || json.data}`);
        console.log(`✅ Status: WORKING`);
      } else {
        console.log(`⚠️  Status: PARTIAL (JSON but no image)`);
      }
    } else {
      const text = await response.text();
      console.log(`📝 Response (first 200 chars): ${text.substring(0, 200)}`);
      console.log(`⚠️  Status: UNKNOWN FORMAT`);
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);
    console.log(`❌ Status: FAILED`);
  }
}

async function runTests() {
  console.log("\n🚀 Starting Image API Tests...\n");
  
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
