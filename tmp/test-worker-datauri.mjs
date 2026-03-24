// Using native fetch
import fs from "fs";

async function testWorker() {
  const imageUrl =
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"; // car image

  try {
    console.log("Downloading image buffer...");
    const imgRes = await fetch(imageUrl);
    const imgBuffer = await imgRes.arrayBuffer();

    // Create Data URI
    const base64 = Buffer.from(imgBuffer).toString("base64");
    const dataUri = `data:image/jpeg;base64,${base64}`;

    console.log("Testing POST /api/ai/remove/background with JSON data URI...");

    // Let's also test another endpoint to be sure
    const endpoints = [
      "https://photogrid-proxy.llamai.workers.dev/api/ai/remove/background",
      "https://photogrid-proxy.llamai.workers.dev/api/ai/remove/watermark",
    ];

    for (const url of endpoints) {
      console.log(`Testing ${url}...`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUri }), // also testing base64_image
      });

      console.log("Status:", res.status);
      console.log("Content-Type:", res.headers.get("content-type"));

      if (res.headers.get("content-type")?.includes("image")) {
        console.log("Returns raw image buffer!");
      } else {
        const text = await res.text();
        console.log("Response Text:", text.substring(0, 500));
      }
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

testWorker();
