"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const BASE_URL = process.env.API_URL || "http://localhost:3000";
const REPORT_DIR = path.join(process.cwd(), "test-reports");
// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}
// Test configurations
const tests = {
  // AI Models Tests
  aiModels: [
    {
      name: "OpenAI GPT-4o Mini",
      provider: "openai-free",
      model: "gpt-4o-mini",
      prompt: "What is TypeScript?",
    },
    {
      name: "Google Gemini",
      provider: "google",
      model: "gemini",
      prompt: "Explain React hooks",
    },
    {
      name: "Mistral",
      provider: "mistral",
      model: "mistral",
      prompt: "What is machine learning?",
    },
    {
      name: "Pollinations Gemini",
      provider: "pollinations",
      model: "gemini",
      prompt: "Explain REST APIs",
    },
  ],
  // Image Generation Tests
  imageGeneration: [
    {
      name: "Image Gen - img-cv",
      model: "img-cv",
      prompt: "A beautiful sunset over mountains",
    },
    {
      name: "Image Gen - flux-max",
      model: "flux-max",
      prompt: "A futuristic city at night",
    },
    {
      name: "Image Gen - gpt-imager",
      model: "gpt-imager",
      prompt: "A serene forest landscape",
    },
    {
      name: "Image Gen - nano-banana",
      model: "nano-banana",
      prompt: "A colorful abstract art piece",
    },
  ],
  // Video Generation Tests
  videoGeneration: [
    {
      name: "Video Gen - SORA",
      model: "sora",
      prompt: "A person walking through a park",
    },
  ],
  // Web Search Tests
  webSearch: [
    {
      name: "Web Search - Latest AI News",
      query: "latest AI news 2025",
    },
    {
      name: "Web Search - TypeScript Tutorial",
      query: "TypeScript tutorial for beginners",
    },
  ],
  // Document Generation Tests
  documentGeneration: [
    {
      name: "PDF Generation",
      type: "pdf",
      title: "Test Report",
      content: "This is a test PDF document",
    },
    {
      name: "Word Document Generation",
      type: "word",
      title: "Test Document",
      content: "This is a test Word document",
    },
    {
      name: "CSV Generation",
      type: "csv",
      title: "Test Data",
      content: "Name,Age,City\nJohn,25,NYC\nJane,30,LA",
    },
  ],
  // QR Code Tests
  qrCode: [
    {
      name: "QR Code Generation",
      content: "https://example.com",
    },
  ],
};
async function testAIModel(test) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: `test-${Date.now()}`,
        message: {
          id: `msg-${Date.now()}`,
          role: "user",
          parts: [
            {
              type: "text",
              text: test.prompt,
            },
          ],
        },
        chatModel: {
          provider: test.provider,
          model: test.model,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        name: test.name,
        category: "AI Models",
        status: "fail",
        responseTime,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      name: test.name,
      category: "AI Models",
      status: "pass",
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: test.name,
      category: "AI Models",
      status: error.name === "AbortError" ? "timeout" : "error",
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
async function testImageGeneration(test) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: `test-${Date.now()}`,
        message: {
          id: `msg-${Date.now()}`,
          role: "user",
          parts: [
            {
              type: "text",
              text: test.prompt,
            },
          ],
        },
        imageTool: {
          model: test.model,
        },
      }),
      signal: AbortSignal.timeout(60000),
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        name: test.name,
        category: "Image Generation",
        status: "fail",
        responseTime,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      name: test.name,
      category: "Image Generation",
      status: "pass",
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: test.name,
      category: "Image Generation",
      status: error.name === "AbortError" ? "timeout" : "error",
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
async function testVideoGeneration(test) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: `test-${Date.now()}`,
        message: {
          id: `msg-${Date.now()}`,
          role: "user",
          parts: [
            {
              type: "text",
              text: test.prompt,
            },
          ],
        },
        videoGenModel: test.model,
      }),
      signal: AbortSignal.timeout(120000),
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        name: test.name,
        category: "Video Generation",
        status: "fail",
        responseTime,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      name: test.name,
      category: "Video Generation",
      status: "pass",
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: test.name,
      category: "Video Generation",
      status: error.name === "AbortError" ? "timeout" : "error",
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
async function testWebSearch(test) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: `test-${Date.now()}`,
        message: {
          id: `msg-${Date.now()}`,
          role: "user",
          parts: [
            {
              type: "text",
              text: test.query,
            },
          ],
        },
        mentions: [
          {
            type: "defaultTool",
            name: "web-search",
            label: "Web Search",
          },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        name: test.name,
        category: "Web Search",
        status: "fail",
        responseTime,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      name: test.name,
      category: "Web Search",
      status: "pass",
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: test.name,
      category: "Web Search",
      status: error.name === "AbortError" ? "timeout" : "error",
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
async function testDocumentGeneration(test) {
  const startTime = Date.now();
  try {
    const toolName =
      test.type === "pdf"
        ? "generate-pdf"
        : test.type === "word"
          ? "generate-word-document"
          : "generate-csv";
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: `test-${Date.now()}`,
        message: {
          id: `msg-${Date.now()}`,
          role: "user",
          parts: [
            {
              type: "text",
              text: `Generate ${test.type}: ${test.title}`,
            },
          ],
        },
        mentions: [
          {
            type: "defaultTool",
            name: toolName,
            label: `Generate ${test.type.toUpperCase()}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        name: test.name,
        category: "Document Generation",
        status: "fail",
        responseTime,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      name: test.name,
      category: "Document Generation",
      status: "pass",
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: test.name,
      category: "Document Generation",
      status: error.name === "AbortError" ? "timeout" : "error",
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
async function testQRCode(test) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: `test-${Date.now()}`,
        message: {
          id: `msg-${Date.now()}`,
          role: "user",
          parts: [
            {
              type: "text",
              text: `Generate QR code for: ${test.content}`,
            },
          ],
        },
        mentions: [
          {
            type: "defaultTool",
            name: "generate-qr-code",
            label: "Generate QR Code",
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        name: test.name,
        category: "QR Code",
        status: "fail",
        responseTime,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      name: test.name,
      category: "QR Code",
      status: "pass",
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: test.name,
      category: "QR Code",
      status: error.name === "AbortError" ? "timeout" : "error",
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
async function runAllTests() {
  console.log("🚀 Starting comprehensive feature tests...\n");
  const results = [];
  // Test AI Models
  console.log("📝 Testing AI Models...");
  for (const test of tests.aiModels) {
    const result = await testAIModel(test);
    results.push(result);
    console.log(
      `  ${result.name}: ${result.status} (${result.responseTime}ms)`,
    );
  }
  // Test Image Generation
  console.log("\n🖼️  Testing Image Generation...");
  for (const test of tests.imageGeneration) {
    const result = await testImageGeneration(test);
    results.push(result);
    console.log(
      `  ${result.name}: ${result.status} (${result.responseTime}ms)`,
    );
  }
  // Test Video Generation
  console.log("\n🎬 Testing Video Generation...");
  for (const test of tests.videoGeneration) {
    const result = await testVideoGeneration(test);
    results.push(result);
    console.log(
      `  ${result.name}: ${result.status} (${result.responseTime}ms)`,
    );
  }
  // Test Web Search
  console.log("\n🔍 Testing Web Search...");
  for (const test of tests.webSearch) {
    const result = await testWebSearch(test);
    results.push(result);
    console.log(
      `  ${result.name}: ${result.status} (${result.responseTime}ms)`,
    );
  }
  // Test Document Generation
  console.log("\n📄 Testing Document Generation...");
  for (const test of tests.documentGeneration) {
    const result = await testDocumentGeneration(test);
    results.push(result);
    console.log(
      `  ${result.name}: ${result.status} (${result.responseTime}ms)`,
    );
  }
  // Test QR Code
  console.log("\n📱 Testing QR Code...");
  for (const test of tests.qrCode) {
    const result = await testQRCode(test);
    results.push(result);
    console.log(
      `  ${result.name}: ${result.status} (${result.responseTime}ms)`,
    );
  }
  // Generate report
  const report = generateReport(results);
  saveReport(report);
  printReport(report);
  return report;
}
function generateReport(results) {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const timeout = results.filter((r) => r.status === "timeout").length;
  const errors = results.filter((r) => r.status === "error").length;
  const byCategory = {};
  for (const result of results) {
    if (!byCategory[result.category]) {
      byCategory[result.category] = { total: 0, passed: 0, failed: 0 };
    }
    byCategory[result.category].total++;
    if (result.status === "pass") {
      byCategory[result.category].passed++;
    } else {
      byCategory[result.category].failed++;
    }
  }
  const responseTimes = results.map((r) => r.responseTime);
  const averageResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const sortedByTime = [...results].sort(
    (a, b) => b.responseTime - a.responseTime,
  );
  const slowestTest = sortedByTime[0];
  const fastestTest = sortedByTime[sortedByTime.length - 1];
  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed,
    timeout,
    errors,
    results,
    summary: {
      byCategory,
      averageResponseTime,
      slowestTest,
      fastestTest,
    },
  };
}
function saveReport(report) {
  const filename = `test-report-${Date.now()}.json`;
  const filepath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${filepath}`);
}
function printReport(report) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST REPORT");
  console.log("=".repeat(80));
  console.log(`\n⏱️  Timestamp: ${report.timestamp}`);
  console.log(`\n📈 Summary:`);
  console.log(`   Total Tests: ${report.totalTests}`);
  console.log(
    `   ✅ Passed: ${report.passed} (${((report.passed / report.totalTests) * 100).toFixed(1)}%)`,
  );
  console.log(`   ❌ Failed: ${report.failed}`);
  console.log(`   ⏳ Timeout: ${report.timeout}`);
  console.log(`   ⚠️  Errors: ${report.errors}`);
  console.log(`\n⚡ Performance:`);
  console.log(
    `   Average Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms`,
  );
  console.log(
    `   Fastest: ${report.summary.fastestTest.name} (${report.summary.fastestTest.responseTime}ms)`,
  );
  console.log(
    `   Slowest: ${report.summary.slowestTest.name} (${report.summary.slowestTest.responseTime}ms)`,
  );
  console.log(`\n📂 By Category:`);
  for (const [category, stats] of Object.entries(report.summary.byCategory)) {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(
      `   ${category}: ${stats.passed}/${stats.total} passed (${passRate}%)`,
    );
  }
  console.log(`\n❌ Failed Tests:`);
  const failedTests = report.results.filter((r) => r.status !== "pass");
  if (failedTests.length === 0) {
    console.log("   None! All tests passed! 🎉");
  } else {
    for (const test of failedTests) {
      console.log(`   - ${test.name}: ${test.status}`);
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    }
  }
  console.log("\n" + "=".repeat(80));
}
// Run tests
runAllTests().catch(console.error);
