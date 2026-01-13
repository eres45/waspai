// Native fetch is available

const models = [
  "deepseek-ai/DeepSeek-V3.1-Terminus",
  "deepseek-ai/DeepSeek-R1-Turbo",
  "deepseek-ai/DeepSeek-R1",
  "moonshotai/Kimi-K2-Thinking",
  "google/gemma-2-9b-it",
  "google/gemma-2-12b-it",
  "Qwen/Qwen2-7B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.1",
  "mistralai/Mistral-7B-Instruct-v0.2",
  "mistralai/Mistral-Small-Instruct-2409",
  "MiniMaxAI/MiniMax-M2",
  "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
  "meta-llama/Llama-3.3-70B-Instruct",
  "meta-llama/Llama-3.1-8B-Instruct",
  "meta-llama/Llama-3.2-3B-Instruct",
  "meta-llama/Llama-3.2-1B-Instruct",
  "meta-llama/Llama-3-8B-Instruct",
];

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

async function testModel(modelId: string) {
  const url = "https://api.deepinfra.com/v1/chat/completions";
  console.log(`Testing ${modelId}...`);

  // Simple retry logic similar to what we implemented (simplified for test script)
  for (let i = 0; i < 3; i++) {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "text/event-stream");
    headers.set("Origin", "https://deepinfra.com");
    headers.set("Referer", "https://deepinfra.com/");
    headers.set(
      "User-Agent",
      userAgents[Math.floor(Math.random() * userAgents.length)],
    );
    headers.set("X-Deepinfra-Source", "web-page");
    headers.set("X-Forwarded-For", getRandomIP());
    // No Auth for this test to verify free tier specifically

    const body = JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: "Hi" }],
      stream: false,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
      });

      if (response.ok) {
        console.log(`✅ [${modelId}] Success (Attempt ${i + 1})`);
        return;
      } else if (response.status === 404) {
        const json = await response.json();
        // @ts-ignore
        if (json.error?.code === "model_not_found") {
          console.log(`❌ [${modelId}] Model Not Found (404)`);
          return; // Don't retry real 404s
        }
      }
    } catch (_e) {
      // ignore network error and retry
    }
  }
  console.log(`⚠️ [${modelId}] Failed after 3 attempts (Likely 403 Forbidden)`);
}

async function runAll() {
  console.log(
    "Starting comprehensive DeepInfra model test (Spoofing only)...\n",
  );
  for (const model of models) {
    await testModel(model);
    // Small delay to be nice
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log("\nTest complete.");
}

runAll();
