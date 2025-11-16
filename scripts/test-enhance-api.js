import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test script to verify the Image Enhance API
 * Tests with a real image URL and checks the response
 */

async function testEnhanceAPI() {
  console.log("🔍 Testing Image Enhance API...\n");

  // Use a test image URL (Snapzion CDN)
  const testImageUrl =
    "https://cdn.snapzion.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/531b6193-2d4b-45fa-8779-ceed7be01455.png";

  console.log(`📸 Test Image URL: ${testImageUrl}\n`);

  try {
    // Step 1: Verify the original image is accessible
    console.log("Step 1: Checking if original image is accessible...");
    const originalResponse = await fetch(testImageUrl);
    if (!originalResponse.ok) {
      console.error(`❌ Original image not accessible: ${originalResponse.statusText}`);
      return;
    }
    const originalBuffer = await originalResponse.arrayBuffer();
    const originalSize = originalBuffer.byteLength;
    const originalMimeType = originalResponse.headers.get("content-type");
    console.log(`✅ Original image accessible`);
    console.log(`   - Size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   - MIME Type: ${originalMimeType}\n`);

    // Step 2: Call the enhance API
    console.log("Step 2: Calling Image Enhance API...");
    const enhanceApiUrl = `https://image-enhance.apis-bj-devs.workers.dev/?imageurl=${encodeURIComponent(testImageUrl)}`;
    console.log(`   API URL: ${enhanceApiUrl}\n`);

    const startTime = Date.now();
    const enhanceResponse = await fetch(enhanceApiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "better-chatbot/1.0",
      },
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Response Status: ${enhanceResponse.status} ${enhanceResponse.statusText}`);
    console.log(`Response Time: ${duration}ms`);
    console.log(`Response Headers:`);
    enhanceResponse.headers.forEach((value, key) => {
      console.log(`   - ${key}: ${value}`);
    });

    if (!enhanceResponse.ok) {
      console.error(`\n❌ Enhance API failed: ${enhanceResponse.statusText}`);
      const errorText = await enhanceResponse.text();
      console.error(`Error Response: ${errorText}`);
      return;
    }

    // Step 3: Check the response content
    console.log("\nStep 3: Analyzing enhanced image response...");
    const enhancedArrayBuffer = await enhanceResponse.arrayBuffer();
    const enhancedSize = enhancedArrayBuffer.byteLength;
    const enhancedMimeType = enhanceResponse.headers.get("content-type");

    console.log(`✅ Enhanced image received`);
    console.log(`   - Size: ${(enhancedSize / 1024).toFixed(2)} KB`);
    console.log(`   - MIME Type: ${enhancedMimeType}`);
    console.log(`   - Size Difference: ${((enhancedSize - originalSize) / 1024).toFixed(2)} KB`);

    // Step 4: Check if it's a valid image
    console.log("\nStep 4: Validating image format...");
    const buffer = Buffer.from(enhancedArrayBuffer);
    const header = buffer.slice(0, 8);

    // Check for common image signatures
    let imageType = "Unknown";
    if (header[0] === 0xff && header[1] === 0xd8) {
      imageType = "JPEG";
    } else if (header[0] === 0x89 && header[1] === 0x50) {
      imageType = "PNG";
    } else if (header[0] === 0x47 && header[1] === 0x49) {
      imageType = "GIF";
    } else if (header[0] === 0x42 && header[1] === 0x4d) {
      imageType = "BMP";
    } else if (header[0] === 0x52 && header[1] === 0x49) {
      imageType = "WebP";
    }

    console.log(`   - Detected Format: ${imageType}`);
    console.log(`   - Header Bytes: ${Array.from(header)
      .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
      .join(" ")}`);

    // Step 5: Save the enhanced image for inspection
    console.log("\nStep 5: Saving enhanced image for inspection...");
    const outputPath = path.join(process.cwd(), "enhanced-test-image.png");
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Enhanced image saved to: ${outputPath}`);

    // Step 6: Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ API Status: Working`);
    console.log(`✅ Response Time: ${duration}ms`);
    console.log(`✅ Image Format: ${imageType}`);
    console.log(`✅ Original Size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`✅ Enhanced Size: ${(enhancedSize / 1024).toFixed(2)} KB`);
    console.log(`✅ Valid Image: ${imageType !== "Unknown" ? "YES" : "NO"}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error during API test:", error);
  }
}

// Run the test
testEnhanceAPI();
