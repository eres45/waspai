const _fs = require("fs");
const _path = require("path");

async function testSii3Upload() {
  try {
    // Create a simple test PDF buffer
    const pdfContent = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n214\n%%EOF",
    );

    // Create FormData
    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", pdfContent, "test.pdf");

    console.log("📤 Testing sii3.top API with PDF...");
    console.log("File size:", pdfContent.length, "bytes");

    const response = await fetch("https://sii3.top/api/upload.php", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const text = await response.text();
    console.log("\n✅ Response Status:", response.status);
    console.log("📝 Response Body:", text);

    if (response.ok) {
      console.log("\n🎉 SUCCESS! sii3.top accepts PDF uploads");
      console.log("Upload URL:", text);
    } else {
      console.log("\n❌ FAILED! Status:", response.status);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSii3Upload();
