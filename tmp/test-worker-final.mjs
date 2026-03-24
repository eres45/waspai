import fs from "fs";

async function testWorker() {
  const imageUrl =
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"; // car image

  // 1. Get features
  console.log("--- FETCHING FEATURES ---");
  const featRes = await fetch(
    "https://photogrid-proxy.llamai.workers.dev/features",
  );
  const featData = await featRes.json();
  console.log(JSON.stringify(featData, null, 2));

  // 2. Test a known endpoint
  console.log("\n--- TESTING WATERMARK REMOVAL ---");
  const waterRes = await fetch(
    "https://photogrid-proxy.llamai.workers.dev/api/ai/remove/watermark",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    },
  );

  console.log("Status:", waterRes.status);
  console.log("Content-Type:", waterRes.headers.get("content-type"));

  if (waterRes.headers.get("content-type")?.includes("image")) {
    console.log("✅ Success! Returned binary image buffer directly.");
  } else {
    console.log(
      "Response text:",
      await waterRes
        .text()
        .catch((e) => e.message)
        .then((t) => t.substring(0, 200)),
    );
  }

  // 3. Test background removal (guessing endpoint)
  console.log("\n--- TESTING BACKGROUND REMOVAL ---");
  const bgRes = await fetch(
    "https://photogrid-proxy.llamai.workers.dev/api/ai/remove/background",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    },
  );
  console.log("BG Status:", bgRes.status);
  console.log("BG Content-Type:", bgRes.headers.get("content-type"));
  if (!bgRes.headers.get("content-type")?.includes("image")) {
    console.log(
      "BG Response:",
      await bgRes
        .text()
        .catch((_e) => "")
        .then((t) => t.substring(0, 200)),
    );
  } else {
    console.log("✅ Background removal works!");
  }
}

testWorker();
