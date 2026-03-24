import fs from "fs";

async function testWorker() {
  const routes = [
    "/remove-background",
    "/remove-watermark",
    "/remove-object",
    "/enhance-image",
    "/ai-style-transfer",
    "/super-resolution",
    "/old-photo-restoration",
    "/background-blur",
  ];

  for (const r of routes) {
    const res = await fetch(`https://photogrid-proxy.llamai.workers.dev${r}`);
    const text = await res.text();
    console.log(`[${r}] ->`, text.substring(0, 150).replace(/\n/g, " "));
  }
}

testWorker();
