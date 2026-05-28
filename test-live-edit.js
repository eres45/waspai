async function main() {
  console.log("Testing image edits endpoint on live worker...");
  const imageUrl =
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"; // car image
  try {
    const res = await fetch(
      "https://unified-ai-worker.rutv.workers.dev/v1/images/edits",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          operation: "remove-background",
        }),
      },
    );
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    if (data.image && data.image.url) {
      console.log(
        `✅ Success! Received base64 image URL (length: ${data.image.url.length}) with mimeType: ${data.image.mimeType}`,
      );
    } else {
      console.log("Response:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
main();
