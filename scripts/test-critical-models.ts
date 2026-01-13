const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
];

const getRandomIP = () => {
  return Array.from(
    { length: 4 },
    () => Math.floor(Math.random() * 255) + 1,
  ).join(".");
};

const getSpoofHeaders = () => {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Origin", "https://deepinfra.com");
  headers.set("Referer", "https://deepinfra.com/");
  headers.set("User-Agent", userAgents[0]);
  headers.set("X-Deepinfra-Source", "web-page");
  headers.set("X-Forwarded-For", getRandomIP());
  return headers;
};

async function test(modelId: string) {
  const url = "https://api.deepinfra.com/v1/chat/completions";
  const headers = getSpoofHeaders();
  headers.set("Content-Type", "application/json");
  const body = JSON.stringify({
    model: modelId,
    messages: [{ role: "user", content: "Hi" }],
    stream: false,
    max_tokens: 5,
  });
  try {
    const response = await fetch(url, { method: "POST", headers, body });
    console.log(
      `Model: ${modelId} | Status: ${response.status} | OK: ${response.ok}`,
    );
    if (!response.ok) {
      const text = await response.text();
      console.log(`Response: ${text}`);
    }
  } catch (e) {
    console.log(`Model: ${modelId} | Error: ${e}`);
  }
}

async function run() {
  await test("google/gemma-2-9b-it");
  await test("MiniMaxAI/MiniMax-M2");
}

run();
