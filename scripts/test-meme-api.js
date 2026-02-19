#!/usr/bin/env node

/**
 * Test script for Meme API
 * Tests the meme image generation endpoint
 */

const testText = "cat wearing sunglasses";

async function testMemeAPI() {
  console.log("🧪 Testing Meme API...\n");
  console.log(`📍 Endpoint: https://sii3.top/api/meme.php`);
  console.log(`📝 Text: ${testText}\n`);

  const payload = new URLSearchParams();
  payload.append("text", testText);

  console.log("📤 Sending POST request...\n");

  try {
    const startTime = Date.now();

    const response = await fetch("https://sii3.top/api/meme.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
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
      } else {
        console.log(`\n❌ ERROR: HTTP ${response.status}`);
        if (data.error) {
          console.log(`📝 Error message: ${data.error}`);
        }
      }
    } else if (contentType && contentType.includes("image/")) {
      console.log("✅ SUCCESS!");
      console.log(`🖼️  Response is an image (${contentType})`);
      console.log(
        `📊 Image size: ${response.headers.get("content-length")} bytes`,
      );
    } else {
      const text = await response.text();
      console.log("📦 Response Body:");
      console.log(text);

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

testMemeAPI();
