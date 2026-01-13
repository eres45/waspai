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

const getSpoofHeaders = () => {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Origin", "https://deepinfra.com");
  headers.set("Referer", "https://deepinfra.com/");
  headers.set(
    "User-Agent",
    userAgents[Math.floor(Math.random() * userAgents.length)],
  );
  headers.set("X-Deepinfra-Source", "web-page");
  headers.set("X-Forwarded-For", getRandomIP());
  return headers;
};

async function testModel(modelId: string) {
  const url = "https://api.deepinfra.com/v1/chat/completions";
  for (let i = 0; i < 2; i++) {
    // Reduced retries for speed
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
      if (response.ok) return true;
    } catch (_e) {}
  }
  return false;
}

async function testImageModel(modelId: string) {
  const url = "https://api.deepinfra.com/v1/openai/images/generations";
  for (let i = 0; i < 2; i++) {
    const headers = getSpoofHeaders();
    headers.set("Content-Type", "application/json");
    const body = JSON.stringify({
      model: modelId,
      prompt: "A simple red dot",
      n: 1,
      size: "256x256",
    });
    try {
      const response = await fetch(url, { method: "POST", headers, body });
      if (response.ok) return true;
    } catch (_e) {}
  }
  return false;
}

async function fetchAllModelsDetailed() {
  console.log("Fetching full model list from DeepInfra...");
  const url = "https://api.deepinfra.com/v1/models";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getSpoofHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (_e) {
    return [];
  }
}

function inferType(m: any) {
  const id = (m.model_name || m.id || "").toLowerCase();
  const type = (m.type || "").toLowerCase();
  if (type === "text-generation" || type === "chat") return "chat";
  if (
    type === "text-to-image" ||
    id.includes("flux") ||
    id.includes("sdxl") ||
    id.includes("stable-diffusion")
  )
    return "image";
  if (id.includes("whisper") || id.includes("audio") || id.includes("speech"))
    return "audio";
  if (
    id.includes("instruct") ||
    id.includes("chat") ||
    id.includes("llama") ||
    id.includes("mistral") ||
    id.includes("qwen") ||
    id.includes("deepseek") ||
    id.includes("gemini") ||
    id.includes("claude") ||
    id.includes("gpt")
  ) {
    if (
      !id.includes("embedding") &&
      !id.includes("vision") &&
      !id.includes("vl")
    )
      return "chat";
  }
  return type || "other";
}

async function runAudit() {
  const rawModels = await fetchAllModelsDetailed();
  console.log(`Found ${rawModels.length} models.`);

  if (rawModels.length > 0) {
    console.log("SAMPLE METADATA:", JSON.stringify(rawModels[0], null, 2));
  }

  const categories: Record<string, any[]> = {};
  rawModels.forEach((m) => {
    const type = inferType(m);
    if (!categories[type]) categories[type] = [];
    categories[type].push(m);
  });

  console.log("\n=== CATEGORIES ===");
  Object.keys(categories).forEach((t) =>
    console.log(`- ${t}: ${categories[t].length}`),
  );

  const working: string[] = [];
  for (const type of Object.keys(categories)) {
    console.log(`\n--- Auditing ${type} ---`);
    for (const model of categories[type].slice(0, 15)) {
      // Test more text/image ones
      const mId = model.model_name || model.id;
      let success = false;

      if (type === "chat") success = await testModel(mId);
      else if (type === "image" || type === "text-to-image")
        success = await testImageModel(mId);
      else {
        console.log(`ℹ️ [Skipping] ${mId}`);
        continue;
      }

      if (success) {
        console.log(`✅ [${type}] ${mId}`);
        working.push(`${mId} (${type})`);
      } else {
        console.log(`❌ [${type}] ${mId}`);
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log("\n=== WORKING MODELS ===");
  console.log(JSON.stringify(working, null, 2));
}

runAudit();
