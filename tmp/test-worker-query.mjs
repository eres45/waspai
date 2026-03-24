import fs from "fs";

async function testWorker() {
  const imageUrl =
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"; // car image

  const queries = [
    `?img=${encodeURIComponent(imageUrl)}`,
    `?url=${encodeURIComponent(imageUrl)}`,
    `?image_url=${encodeURIComponent(imageUrl)}`,
    `?imageUrl=${encodeURIComponent(imageUrl)}`,
  ];

  for (const q of queries) {
    const url = `https://photogrid-proxy.llamai.workers.dev/api/ai/remove/background${q}`;
    console.log(`Testing POST ${url}...`);
    try {
      const res = await fetch(url, {
        method: "POST",
      });
      console.log("Status:", res.status);
      if (res.status === 200) {
        console.log("SUCCESS!!!");
        return;
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

testWorker();
