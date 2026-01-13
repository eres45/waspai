async function testGLM() {
  console.log("\n--- Testing Zhipu GLM ---");
  const models = [
    {
      name: "GLM-4.7",
      url: "https://glm-4-7.chutperplexity.workers.dev/prompt=Hello",
    },
    {
      name: "GLM-4.5-air",
      url: "https://glm-4-5-air.chutperplexity.workers.dev/prompt=Hello",
    },
  ];

  for (const m of models) {
    try {
      const res = await fetch(m.url);
      console.log(`[${m.name}] Status: ${res.status}`);
      const text = await res.text();
      console.log(`[${m.name}] Response: ${text.substring(0, 100)}...`);
    } catch (e) {
      console.error(`[${m.name}] Error: ${e.message}`);
    }
  }
}

async function testGateway() {
  console.log("\n--- Testing Multi-Model AI Gateway ---");
  const baseUrl = "https://shaikhs-ai.rajageminiwala.workers.dev/";
  const models = ["claude-sonnet-4.5", "gpt-5", "grok-4", "gemini-2.5-pro"];

  for (const m of models) {
    try {
      // Assuming GET with query param or path? The prompt was "prompt={prompt}" for others.
      // Let's try path and query.
      const url = `${baseUrl}?prompt=Hello&model=${m}`;
      const res = await fetch(url);
      console.log(`[${m}] Status: ${res.status}`);
      const text = await res.text();
      console.log(`[${m}] Response: ${text.substring(0, 100)}...`);
    } catch (e) {
      console.error(`[${m}] Error: ${e.message}`);
    }
  }
}

async function testClaudeProxy() {
  console.log("\n--- Testing OpenAI Proxy (Claude 3.7/4.5) ---");
  const url =
    "https://real-slim-shady.riderdeath700.workers.dev/v1/chat/completions";
  const auth = "Bearer sk_qwhdoq8d3qreop3hropezy";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10,
      }),
    });
    console.log(`[Claude Proxy] Status: ${res.status}`);
    const data = await res.json();
    console.log(
      `[Claude Proxy] Response: ${JSON.stringify(data).substring(0, 100)}...`,
    );
  } catch (e) {
    console.error(`[Claude Proxy] Error: ${e.message}`);
  }
}

async function testImageGen() {
  console.log("\n--- Testing Image Gen API ---");
  const url =
    "https://image.itz-ashlynn.workers.dev/generate?prompt=A+blue+cat&model=FLUX";
  try {
    const res = await fetch(url);
    console.log(`[Image Gen] Status: ${res.status}`);
    console.log(`[Image Gen] Content-Type: ${res.headers.get("content-type")}`);
  } catch (e) {
    console.error(`[Image Gen] Error: ${e.message}`);
  }
}

async function testWormGPT() {
  console.log("\n--- Testing WormGPT ---");
  const url = "https://wormgpt.hello-kaiiddo.workers.dev/ask?ask=Hello&model=1";
  try {
    const res = await fetch(url);
    console.log(`[WormGPT] Status: ${res.status}`);
    const text = await res.text();
    console.log(`[WormGPT] Response: ${text.substring(0, 100)}...`);
  } catch (e) {
    console.error(`[WormGPT] Error: ${e.message}`);
  }
}

async function run() {
  await testGLM();
  await testGateway();
  await testClaudeProxy();
  await testImageGen();
  await testWormGPT();
}

run();
