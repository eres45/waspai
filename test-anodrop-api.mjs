/**
 * Test AnoDrop API to understand the response format
 */

const ANODROP_KEY = "1377679324043542622";
const ANODROP_URL = "https://anondrop.net";

async function testAnodropUpload() {
  console.log("🧪 Testing AnoDrop API\n");
  console.log("=".repeat(60));

  try {
    // Create a test PDF buffer
    const testContent = "This is a test PDF content for AnoDrop";
    const buffer = Buffer.from(testContent);

    // Create FormData
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "application/pdf" });
    formData.append("file", blob, "test-document.pdf");

    const uploadUrl = `${ANODROP_URL}/upload?key=${ANODROP_KEY}`;
    console.log(`📤 Uploading to: ${uploadUrl}\n`);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      redirect: "manual", // Don't follow redirects
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Status Text: ${response.statusText}`);
    console.log(`📊 Response URL: ${response.url}\n`);

    // Log all headers
    console.log("📋 Response Headers:");
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    console.log();

    // Get response body
    const responseText = await response.text();
    console.log(`📄 Response Body Length: ${responseText.length} bytes`);
    console.log(
      `📄 Response Body (first 500 chars):\n${responseText.substring(0, 500)}\n`,
    );

    // Try to extract file ID
    const locationHeader = response.headers.get("location");
    console.log(`🔗 Location Header: ${locationHeader}\n`);

    if (locationHeader) {
      const match = locationHeader.match(/\/([a-zA-Z0-9]+)(?:\?|$)/);
      const fileId = match ? match[1] : null;
      console.log(`✅ Extracted File ID from Location: ${fileId}`);
      console.log(`✅ Download URL: ${ANODROP_URL}/${fileId}\n`);
    } else {
      // Try to find file ID in body
      const bodyMatch = responseText.match(/\/([a-zA-Z0-9]{18,})/);
      if (bodyMatch) {
        console.log(`✅ Extracted File ID from Body: ${bodyMatch[1]}`);
        console.log(`✅ Download URL: ${ANODROP_URL}/${bodyMatch[1]}\n`);
      } else {
        console.log(`❌ Could not extract file ID from response\n`);
      }
    }

    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAnodropUpload();
