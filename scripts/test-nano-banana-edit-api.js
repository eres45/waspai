#!/usr/bin/env node

/**
 * Test script for Nano-Banana Edit API
 * Tests the image editing endpoint
 */

const testImageUrl = "https://vetrex.x10.mx/api/photo/test.jpg";
const editPrompt = "Make the image more colorful";

async function testNanoBananaEditAPI() {
  console.log("🧪 Testing Nano-Banana Edit API...\n");
  console.log(`📍 Endpoint: https://vetrex.x10.mx/api/nano_banana.php`);
  console.log(`📝 Prompt: ${editPrompt}`);
  console.log(`🖼️  Image URL: ${testImageUrl}\n`);

  const payload = {
    prompt: editPrompt,
    imageUrl: testImageUrl,
  };

  console.log("📤 Sending POST request...\n");

  try {
    const startTime = Date.now();

    const response = await fetch("https://vetrex.x10.mx/api/nano_banana.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Response received in ${duration}ms\n`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get("content-type")}\n`);

    const data = await response.json();

    console.log("📦 Response Body:");
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ SUCCESS!");
      if (data.url) {
        console.log(`🖼️  Edited image URL: ${data.url}`);
      }
    } else {
      console.log(`\n❌ ERROR: HTTP ${response.status}`);
      if (data.error) {
        console.log(`📝 Error message: ${data.error}`);
      }
    }
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    console.log(`\n📋 Error details:`);
    console.log(error);
  }
}

testNanoBananaEditAPI();
