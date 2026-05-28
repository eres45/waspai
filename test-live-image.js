async function main() {
  console.log("Testing image gen endpoint...");
  try {
    const res = await fetch(
      "https://unified-ai-worker.rutv.workers.dev/v1/images/generations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "A cute flying cat",
          model: "flux-schnell",
        }),
      },
    );
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
main();
