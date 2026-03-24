import fetch from "node-fetch";

async function probe() {
  const baseUrl = "https://photogrid-proxy.llamai.workers.dev";

  // Test categories and styles
  console.log("--- Categories ---");
  const catRes = await fetch(`${baseUrl}/categories`);
  console.log(await catRes.text());

  console.log("\n--- Status for Features ---");
  const features = ["remove-watermark", "remove-object"];

  for (const f of features) {
    const res = await fetch(`${baseUrl}/${f}`);
    console.log(`${f}:`, await res.text());
  }
}

probe();
