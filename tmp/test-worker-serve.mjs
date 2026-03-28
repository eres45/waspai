import fetch from "node:fetch";

const WORKER_URL = "https://telegram-upload-proxy.ronitshrimankar1.workers.dev";
const FILE_PATH = "photos/file_85.jpg"; // Path extracted from logs

async function testServe() {
  console.log(`Testing /serve endpoint for path: ${FILE_PATH}`);
  try {
    const url = `${WORKER_URL}/serve?path=${encodeURIComponent(FILE_PATH)}`;
    console.log(`URL: ${url}`);

    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get("content-type")}`);

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      console.log(`Successfully fetched ${buffer.byteLength} bytes`);
    } else {
      const text = await res.text();
      console.log(`Error Response: ${text}`);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testServe();
