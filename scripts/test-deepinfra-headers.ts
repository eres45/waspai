// Native fetch is available

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
];

const getRandomIP = () => {
  return Array.from(
    { length: 4 },
    () => Math.floor(Math.random() * 255) + 1,
  ).join(".");
};

async function testDeepInfra() {
  const url = "https://api.deepinfra.com/v1/chat/completions";

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "text/event-stream");
  headers.set("Origin", "https://deepinfra.com");
  headers.set("Referer", "https://deepinfra.com/");
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  headers.set("User-Agent", userAgent);
  headers.set("X-Deepinfra-Source", "web-page");
  const ip = getRandomIP();
  headers.set("X-Forwarded-For", ip);
  headers.set("Accept-Language", "en-US,en;q=0.9");
  headers.set("Accept-Encoding", "gzip, deflate, br");
  headers.set("Connection", "keep-alive");
  headers.set("Sec-Fetch-Dest", "empty");
  headers.set("Sec-Fetch-Mode", "cors");
  headers.set("Sec-Fetch-Site", "same-site");

  // Explicitly remove auth if it was somehow added (not needed here but replicating logic)
  headers.delete("Authorization");

  console.log("Testing DeepInfra with headers:");
  console.log("User-Agent:", userAgent);
  console.log("X-Forwarded-For:", ip);

  const body = JSON.stringify({
    model: "moonshotai/Kimi-K2-Thinking", // Testing Kimi K2 Thinking
    messages: [{ role: "user", content: "Hello, are you working?" }],
    stream: false,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    console.log(`Status Code: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);

    const text = await response.text();
    console.log("Response Body (first 500 chars):");
    console.log(text.substring(0, 500));

    if (response.status === 401 || response.status === 403) {
      console.log(
        "\nPossible patching detected: HTTP 401/403 Unauthorized/Forbidden",
      );
    } else if (response.ok) {
      console.log("\nSuccess! The spoofing method seems to still work.");
    } else {
      console.log("\nFailed with other error.");
    }
  } catch (error) {
    console.error("Error fetching:", error);
  }
}

testDeepInfra();
