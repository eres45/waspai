import fs from "fs";

async function testTgWorker() {
  console.log("Testing Cloudflare Worker (Local) -> Telegram Proxy...");

  const workerUrl = "http://127.0.0.1:8787/upload";
  const authToken = "my-local-secret";

  // Create a 15MB test file
  const filename = "big-test.bin";
  const content = fs.readFileSync("tmp/big-test.bin");
  const contentType = "application/octet-stream";

  const formData = new FormData();
  // Standard Telegram field for documents
  const blob = new Blob([content], { type: contentType });
  formData.append("document", blob, filename);
  formData.append("caption", "Test Upload via Cloudflare Worker Proxy 🚀");

  try {
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "X-Auth-Token": authToken,
      },
      body: formData,
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response Data:", JSON.stringify(data, null, 2));

    if (data.ok) {
      console.log("SUCCESS! Telegram received the file via Worker proxy.");
      console.log("Message ID:", data.result.message_id);
    } else {
      console.error("FAILED! Telegram returned error:", data.description);
    }
  } catch (err) {
    console.error("ERROR during test:", err);
  }
}

testTgWorker();
