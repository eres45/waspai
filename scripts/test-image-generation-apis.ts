/**
 * Test script to verify image generation APIs
 * Tests: Imagen-3, Nano-Banana, and Flux-Max
 */

const APIs = {
  "Imagen-3": {
    url: "https://sii3.top/api/imagen-3.php",
    params: {
      text: "a beautiful sunset over mountains",
      aspect_ratio: "1:1",
      style: "Auto",
    },
  },
  "Nano-Banana": {
    url: "https://sii3.top/api/nano-banana.php",
    params: {
      text: "a cute cat sitting on a tree",
    },
  },
  "Flux-Max": {
    url: "https://sii3.top/api/flux-max.php",
    params: {
      prompt: "Create a beautiful image with the words Flux Max in 3D",
    },
  },
  "GPT-Imager": {
    url: "https://sii3.top/api/gpt-img.php",
    params: {
      text: "Minecraft world with mountains and water",
    },
  },
  "Flux-Pro": {
    url: "https://sii3.top/api/flux-pro.php",
    params: {
      text: "a hyper-realistic cat with detailed fur",
    },
  },
  "IMG-BO": {
    url: "https://sii3.top/api/img-bo.php",
    params: {
      text: "cat with sunglasses",
      size: "1024x1024",
    },
  },
  "IMG-CV": {
    url: "https://sii3.top/api/img-cv.php",
    params: {
      text: "cat with sunglasses",
    },
  },
};

async function testImageGenerationAPI(
  name: string,
  url: string,
  params: Record<string, string>
): Promise<{
  name: string;
  status: "working" | "failed";
  responseTime: number;
  error?: string;
  imageUrl?: string;
}> {
  const startTime = Date.now();

  try {
    console.log(`\n🔄 Testing ${name}...`);
    console.log(`   URL: ${url}`);
    console.log(`   Params:`, params);

    // Build form data
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      console.error(`   ❌ HTTP Error: ${response.status}`);
      return {
        name,
        status: "failed",
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    console.log(`   Response:`, data);

    // Check if response contains image URL (handle different field names)
    const imageUrl = 
      data.url || 
      data.image_url || 
      data.result || 
      data.data || 
      data.image || 
      data.response;

    if (imageUrl) {
      console.log(`   ✅ SUCCESS! Image URL: ${imageUrl}`);
      return {
        name,
        status: "working",
        responseTime,
        imageUrl: typeof imageUrl === "string" ? imageUrl : JSON.stringify(imageUrl),
      };
    } else {
      console.log(`   ⚠️ Response received but no image URL found`);
      console.log(`   Available fields:`, Object.keys(data));
      return {
        name,
        status: "failed",
        responseTime,
        error: "No image URL in response",
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ Error: ${errorMessage}`);
    return {
      name,
      status: "failed",
      responseTime,
      error: errorMessage,
    };
  }
}

async function runTests() {
  console.log("🎨 Image Generation API Testing");
  console.log("================================\n");

  const results: Array<{
    name: string;
    status: "working" | "failed";
    responseTime: number;
    error?: string;
    imageUrl?: string;
  }> = [];

  for (const [name, config] of Object.entries(APIs)) {
    const result = await testImageGenerationAPI(name, config.url, config.params);
    results.push(result);
    // Add delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log("\n\n📊 Test Summary");
  console.log("================\n");

  const working = results.filter((r) => r.status === "working");
  const failed = results.filter((r) => r.status === "failed");

  console.log(`✅ Working: ${working.length}/${results.length}`);
  working.forEach((r) => {
    console.log(`   • ${r.name} (${r.responseTime}ms)`);
    if (r.imageUrl) {
      console.log(`     Image: ${r.imageUrl}`);
    }
  });

  console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
  failed.forEach((r) => {
    console.log(`   • ${r.name} - ${r.error} (${r.responseTime}ms)`);
  });

  console.log("\n\n📋 Detailed Results");
  console.log("===================\n");
  console.log(JSON.stringify(results, null, 2));
}

// Run tests
runTests().catch(console.error);
