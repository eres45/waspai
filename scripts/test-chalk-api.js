#!/usr/bin/env node

/**
 * Test script for Chalk Name Style API
 * Tests the chalk text generation endpoint
 */

const testText = "BETTER-CHATBOT";

async function testChalkAPI() {
  console.log("🧪 Testing Chalk Name Style API...\n");
  console.log(`📍 Endpoint: https://vetrex.x10.mx/api/chalk.php`);
  console.log(`📝 Text: ${testText}\n`);

  const payload = {
    text: testText,
  };

  console.log("📤 Sending POST request...\n");

  try {
    const startTime = Date.now();

    const response = await fetch("https://vetrex.x10.mx/api/chalk.php", {
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
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);
    console.log(`\n📋 Error details:`);
    console.log(error);
  }
}

testChalkAPI();
