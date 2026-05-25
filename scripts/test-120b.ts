async function test120b() {
  const url = "https://nvidia-worker.revai.workers.dev/";
  console.log(`Sending GET request to ${url}...`);

  try {
    const res = await fetch(url);
    console.log(`Response status: ${res.status}`);
    const text = await res.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

test120b();
