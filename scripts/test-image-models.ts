import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// New Model Tests
async function testFlux1Schnell(prompt: string) {
  try {
    const response = await fetch(
      `https://ai-images-proxy.llamai.workers.dev/?prompt=${encodeURIComponent(prompt)}`,
      { method: "POST" },
    );
    const text = await response.text();
    console.log(`FLUX.1 Schnell Response:`, text);
    let isOk = false;
    try {
      const data = JSON.parse(text);
      isOk = !!(data.url || data.image || data.image_url || data.imageUrl);
    } catch (_e) {
      isOk = text.includes("http") || text.includes("base64");
    }
    return {
      success: response.ok && isOk,
      error: response.ok ? undefined : `HTTP ${response.status}: ${text}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function testJuggernautXL(prompt: string) {
  try {
    const response = await fetch(
      `https://image-world-king-proxy.llamai.workers.dev/api/generate?prompt=${encodeURIComponent(prompt)}`,
      { method: "POST" },
    );
    const text = await response.text();
    console.log(`Juggernaut XL Response:`, text);
    return {
      success:
        response.ok && (text.includes("http") || text.includes("base64")),
      error: response.ok ? undefined : `HTTP ${response.status}: ${text}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function testFlux1Dev(prompt: string) {
  try {
    const response = await fetch(
      "https://runware-image-worker.llamai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, outputType: "URL" }),
      },
    );
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function testRealVisXL(prompt: string) {
  try {
    const response = await fetch(
      "https://mu-devs-image-worker.llamai.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      },
    );
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function testSD35(prompt: string) {
  try {
    const response = await fetch("https://aitubo.llamai.workers.dev/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, count: 1 }),
    });
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function testSeedream45(prompt: string) {
  try {
    const response = await fetch(
      "https://raphaelai.llamai.workers.dev/v1/images/generations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: "None" }),
      },
    );
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function testStableDiffusionXL(prompt: string) {
  try {
    const apiKey = process.env.STABLE_DIFFUSION_API_KEY || "At41rv-API-Image";
    const response = await fetch(
      "https://image-api.at41rvplayzz.workers.dev/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sdxl-1.0",
          prompt,
          size: "1024x1024",
        }),
      },
    );
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

const models = [
  { name: "flux-1-schnell", type: "new" },
  { name: "juggernaut-xl", type: "new" },
  { name: "flux-1-dev", type: "new" },
  { name: "realvisxl-v4", type: "new" },
  { name: "sd-3-5", type: "new" },
  { name: "seedream-4-5", type: "new" },
  { name: "sdxl-v1-0", type: "new" },
];

async function runTests() {
  const results = [];
  const prompt = "a small red apple";

  console.log(`Starting detailed tests for ${models.length} models...`);

  for (const model of models) {
    console.log(`Testing ${model.name}...`);
    let res;

    if (model.name === "flux-1-schnell") res = await testFlux1Schnell(prompt);
    else if (model.name === "juggernaut-xl")
      res = await testJuggernautXL(prompt);
    else if (model.name === "flux-1-dev") res = await testFlux1Dev(prompt);
    else if (model.name === "realvisxl-v4") res = await testRealVisXL(prompt);
    else if (model.name === "sd-3-5") res = await testSD35(prompt);
    else if (model.name === "seedream-4-5") res = await testSeedream45(prompt);
    else if (model.name === "sdxl-v1-0")
      res = await testStableDiffusionXL(prompt);

    results.push({
      name: model.name,
      status: res?.success ? "OK" : "FAILED",
      error: res?.error,
    });
    console.log(
      `${model.name}: ${res?.success ? "OK" : "FAILED"} ${res?.error || ""}`,
    );
  }

  fs.writeFileSync(
    "./image-model-test-results.json",
    JSON.stringify(results, null, 2),
  );
}

runTests();
