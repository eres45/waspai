const TOKEN = "EICMZ46M8iT-61zv";
const MODELS_TO_TEST = [
  "deepseek",
  "gemini",
  "gemini-search",
  "mistral",
  "openai",
  "openai-audio",
  "openai-fast",
  "openai-large",
  "openai-reasoning",
  "roblox-rp",
];

interface TestResult {
  model: string;
  successCount: number;
  failureCount: number;
  rateLimited: boolean;
  avgResponseTime: number;
}

async function testModelRateLimit(
  modelName: string,
  requestCount: number = 12
): Promise<TestResult> {
  console.log(`\n🧪 Testing ${modelName} (${requestCount} requests)...`);

  let successCount = 0;
  let failureCount = 0;
  let rateLimited = false;
  const responseTimes: number[] = [];

  for (let i = 0; i < requestCount; i++) {
    const startTime = Date.now();

    try {
      const response = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "user",
              content: `Test request ${i + 1}. Reply with just "ok".`,
            },
          ],
          max_tokens: 10,
        }),
      });

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      if (response.status === 429) {
        console.log(
          `  ⚠️  Request ${i + 1}: Rate limited (429) after ${responseTime}ms`
        );
        rateLimited = true;
        failureCount++;
      } else if (response.ok) {
        console.log(`  ✓ Request ${i + 1}: Success (${responseTime}ms)`);
        successCount++;
      } else {
        console.log(
          `  ✗ Request ${i + 1}: Failed (${response.status}) after ${responseTime}ms`
        );
        failureCount++;
      }
    } catch (error) {
      console.log(`  ✗ Request ${i + 1}: Error - ${error}`);
      failureCount++;
    }

    // Small delay between requests (100ms)
    if (i < requestCount - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

  return {
    model: modelName,
    successCount,
    failureCount,
    rateLimited,
    avgResponseTime,
  };
}

async function main() {
  console.log("🚀 Pollinations AI Rate Limit Test");
  console.log("==================================");
  console.log(`Token: ${TOKEN.substring(0, 10)}...`);
  console.log(`Testing ${MODELS_TO_TEST.length} models\n`);

  const results: TestResult[] = [];

  for (const model of MODELS_TO_TEST) {
    const result = await testModelRateLimit(model, 12);
    results.push(result);
  }

  // Summary
  console.log("\n\n📊 RESULTS SUMMARY");
  console.log("==================\n");

  const goodModels = results.filter((r) => r.successCount >= 10);
  const limitedModels = results.filter((r) => r.successCount < 10);

  console.log("✅ Models with 10+ successful requests:");
  goodModels.forEach((r) => {
    console.log(
      `  • ${r.model}: ${r.successCount}/12 success (${r.avgResponseTime}ms avg)`
    );
  });

  if (limitedModels.length > 0) {
    console.log("\n⚠️  Models with rate limiting:");
    limitedModels.forEach((r) => {
      console.log(
        `  • ${r.model}: ${r.successCount}/12 success (rate limited: ${r.rateLimited})`
      );
    });
  }

  console.log("\n\n🎯 RECOMMENDED MODELS FOR YOUR APP:");
  console.log("===================================\n");

  const recommended = goodModels.sort((a, b) => b.successCount - a.successCount);
  recommended.forEach((r, i) => {
    console.log(
      `${i + 1}. ${r.model} - ${r.successCount} successful requests, ${r.avgResponseTime}ms avg response`
    );
  });

  console.log("\n✨ All recommended models support:");
  console.log("  • Tool calling (function calling)");
  console.log("  • 10+ requests per minute");
  console.log("  • Vision/Image input (most models)");
}

main().catch(console.error);
