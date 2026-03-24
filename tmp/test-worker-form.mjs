// Using native fetch
import fs from "fs";

async function testWorker() {
  const imageUrl =
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"; // car image

  try {
    console.log("Downloading image buffer...");
    const imgRes = await fetch(imageUrl);
    const imgBuffer = await imgRes.arrayBuffer();

    fs.writeFileSync("temp.jpg", Buffer.from(imgBuffer));

    console.log("Testing POST /api/ai/remove/background with FormData...");

    const form = new FormData();
    form.append(
      "image",
      new Blob([imgBuffer], { type: "image/jpeg" }),
      "temp.jpg",
    );

    // Some APIs expect 'file'
    // form.append('file', new Blob([imgBuffer], { type: 'image/jpeg' }), 'temp.jpg');

    const res = await fetch(
      "https://photogrid-proxy.llamai.workers.dev/api/ai/remove/background",
      {
        method: "POST",
        body: form,
      },
    );

    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));

    if (res.headers.get("content-type")?.includes("image")) {
      console.log("Returns raw image buffer!");
    } else {
      const text = await res.text();
      console.log("Response Text:", text.substring(0, 500));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

testWorker();
