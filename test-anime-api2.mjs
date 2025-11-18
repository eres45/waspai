import https from "https";

async function testAnimeAPI() {
  // Try with a smaller image
  const imageUrl = "https://via.placeholder.com/200x200";
  const apiUrl = `https://sii3.top/api/anime.php?img=${encodeURIComponent(imageUrl)}`;

  console.log("Testing Anime API with smaller image...");
  console.log("URL:", apiUrl);
  console.log("");

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get(apiUrl, { timeout: 60000 }, (res) => {
        let data = Buffer.alloc(0);

        console.log("Status:", res.statusCode);
        console.log("Content-Type:", res.headers["content-type"]);
        console.log("");

        res.on("data", (chunk) => {
          data = Buffer.concat([data, chunk]);
        });

        res.on("end", () => {
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
    });

    const contentType = response.headers["content-type"] || "";

    if (contentType.includes("image")) {
      console.log("✓ API returned image directly");
      console.log("Image size:", response.data.length, "bytes");
    } else {
      console.log("Response is not an image");
      const text = response.data.toString(
        "utf-8",
        0,
        Math.min(2000, response.data.length),
      );
      console.log("Response content:");
      console.log(text);

      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        console.log("");
        console.log("Parsed JSON:");
        console.log(JSON.stringify(json, null, 2));
      } catch (_e) {
        console.log("Not valid JSON");
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAnimeAPI();
