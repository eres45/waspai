#!/usr/bin/env node

/**
 * Test script for Remove Background API
 * Tests the background removal endpoint
 */

const testImageUrl = "https://sii3.top/DarkAI.jpg";

async function testRemoveBgAPI() {
  console.log("🧪 Testing Remove Background API...\n");
  console.log(`📍 Endpoint: https://sii3.top/api/remove-bg.php`);
  console.log(`📝 Image URL: ${testImageUrl}\n`);

  const params = new URLSearchParams();
  params.append("url", testImageUrl);

  const fullUrl = `https://sii3.top/api/remove-bg.php?${params.toString()}`;
  console.log(`📤 Sending GET request...\n`);
  console.log(`🔗 Full URL: ${fullUrl}\n`);

  try {
    const startTime = Date.now();

    const response = await fetch(fullUrl, {
      method: "GET",
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Response received in ${duration}ms\n`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get("content-type")}\n`);

    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("📦 Response Body:");
      console.log(JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log("\n✅ SUCCESS!");
        if (data.image) {
          console.log(`🖼️  Image URL: ${data.image}`);
        }
        if (data.url) {
          console.log(`🖼️  Image URL: ${data.url}`);
        }
        if (data.result) {
          console.log(`🖼️  Image URL: ${data.result}`);
        }
      } else {
        console.log(`\n❌ ERROR: HTTP ${response.status}`);
        if (data.error) {
          console.log(`📝 Error message: ${data.error}`);
        }
      }
    } else if (contentType && contentType.includes("image/")) {
      console.log("✅ SUCCESS!");
      console.log(`🖼️  Response is an image (${contentType})`);
      console.log(`📊 Image size: ${response.headers.get("content-length")} bytes`);
    } else {
      const text = await response.text();
      console.log("📦 Response Body:");
      console.log(text.substring(0, 500));
      
      if (response.ok) {
        console.log("\n✅ SUCCESS!");
      } else {
        console.log(`\n❌ ERROR: HTTP ${response.status}`);
      }
    }
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    console.log(`\n📋 Error details:`);
    console.log(error);
  }
}

testRemoveBgAPI();
