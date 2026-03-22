import fs from "fs";
import path from "path";

async function stressTestNvidia() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error("❌ NVIDIA_API_KEY not found in environment.");
    return;
  }

  // Extract model IDs from the source file to be 100% accurate
  const srcPath = path.join(process.cwd(), "src/lib/ai/nvidia.ts");
  const content = fs.readFileSync(srcPath, "utf-8");

  // Simple regex to find the model strings
  const modelRegex = /"([^"]+\/[^"]+)"/g;
  let match;
  const modelIds: string[] = [];
  while ((match = modelRegex.exec(content)) !== null) {
    if (match[1].includes("/")) {
      modelIds.push(match[1]);
    }
  }

  console.log(`🚀 Starting audit for ${modelIds.length} NVIDIA models...`);
  console.log(`--------------------------------------------------`);

  const results = {
    working: 0,
    napping: 0,
    missing: 0,
    error: 0,
    failedIds: [] as string[],
  };

  // Test in batches of 5 to avoid overwhelming the network/API
  const batchSize = 10;
  for (let i = 0; i < modelIds.length; i += batchSize) {
    const batch = modelIds.slice(i, i + batchSize);
    const promises = batch.map(async (id) => {
      try {
        const res = await fetch(
          "https://integrate.api.nvidia.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: id,
              messages: [{ role: "user", content: "hi" }],
              max_tokens: 1,
            }),
            signal: AbortSignal.timeout(10000), // 10s timeout per model
          },
        );

        if (res.status === 200) {
          results.working++;
          console.log(`✅ ${id}: WORKS`);
        } else if (
          res.status === 503 ||
          res.status === 504 ||
          res.status === 429
        ) {
          results.napping++;
          results.failedIds.push(`${id} (${res.status} - Busy/Timeout)`);
          console.log(`🌙 ${id}: NAPPING (${res.status})`);
        } else if (res.status === 404) {
          results.missing++;
          results.failedIds.push(`${id} (404 - Not Found)`);
          console.log(`❓ ${id}: MISSING (404)`);
        } else {
          results.error++;
          const errText = await res.text();
          results.failedIds.push(
            `${id} (${res.status} - ${errText.slice(0, 50)})`,
          );
          console.log(`❌ ${id}: ERROR ${res.status}`);
        }
      } catch (err: any) {
        results.error++;
        results.failedIds.push(`${id} (Fetch Error: ${err.message})`);
        console.log(`⚠️ ${id}: FETCH FAILED (${err.message})`);
      }
    });

    await Promise.all(promises);
    console.log(`Progress: ${i + batch.length}/${modelIds.length}`);
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`📊 FINAL AUDIT REPORT:`);
  console.log(`✅ Working: ${results.working}`);
  console.log(`🌙 Napping: ${results.napping}`);
  console.log(`❓ Missing: ${results.missing}`);
  console.log(`❌ Errors: ${results.error}`);
  console.log(`TOTAL: ${modelIds.length}`);

  if (results.failedIds.length > 0) {
    console.log(`\nFailed Model Details:`);
    results.failedIds.forEach((f) => console.log(`- ${f}`));
  }
}

stressTestNvidia();
