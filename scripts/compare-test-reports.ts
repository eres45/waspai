import * as fs from "fs";
import * as path from "path";

interface TestResult {
  name: string;
  category: string;
  status: "pass" | "fail" | "timeout" | "error";
  responseTime: number;
  error?: string;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  timeout: number;
  errors: number;
  results: TestResult[];
  summary: {
    byCategory: Record<
      string,
      { total: number; passed: number; failed: number }
    >;
    averageResponseTime: number;
    slowestTest: TestResult;
    fastestTest: TestResult;
  };
}

const REPORT_DIR = path.join(process.cwd(), "test-reports");

function getReports(): string[] {
  if (!fs.existsSync(REPORT_DIR)) {
    console.error("No test reports found!");
    process.exit(1);
  }

  return fs
    .readdirSync(REPORT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();
}

function loadReport(filename: string): TestReport {
  const filepath = path.join(REPORT_DIR, filename);
  const content = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(content);
}

function compareReports(current: TestReport, previous: TestReport): void {
  console.log("\n" + "=".repeat(80));
  console.log("📊 COMPARISON REPORT");
  console.log("=".repeat(80));

  console.log(`\n📅 Current Report: ${current.timestamp}`);
  console.log(`📅 Previous Report: ${previous.timestamp}`);

  // Overall statistics comparison
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Tests: ${previous.totalTests} → ${current.totalTests}`);
  console.log(
    `   ✅ Passed: ${previous.passed} → ${current.passed} (${current.passed > previous.passed ? "+" : ""}${current.passed - previous.passed})`,
  );
  console.log(
    `   ❌ Failed: ${previous.failed} → ${current.failed} (${current.failed > previous.failed ? "+" : ""}${current.failed - previous.failed})`,
  );
  console.log(
    `   ⏳ Timeout: ${previous.timeout} → ${current.timeout} (${current.timeout > previous.timeout ? "+" : ""}${current.timeout - previous.timeout})`,
  );
  console.log(
    `   ⚠️  Errors: ${previous.errors} → ${current.errors} (${current.errors > previous.errors ? "+" : ""}${current.errors - previous.errors})`,
  );

  // Performance comparison
  console.log(`\n⚡ Performance:`);
  const avgDiff =
    current.summary.averageResponseTime - previous.summary.averageResponseTime;
  const avgDiffPercent = (
    (avgDiff / previous.summary.averageResponseTime) *
    100
  ).toFixed(1);
  console.log(
    `   Average Response Time: ${previous.summary.averageResponseTime.toFixed(0)}ms → ${current.summary.averageResponseTime.toFixed(0)}ms (${avgDiff > 0 ? "+" : ""}${avgDiff.toFixed(0)}ms, ${avgDiffPercent}%)`,
  );

  // Category comparison
  console.log(`\n📂 By Category:`);
  const allCategories = new Set([
    ...Object.keys(previous.summary.byCategory),
    ...Object.keys(current.summary.byCategory),
  ]);

  for (const category of Array.from(allCategories).sort()) {
    const prevStats = previous.summary.byCategory[category] || {
      total: 0,
      passed: 0,
      failed: 0,
    };
    const currStats = current.summary.byCategory[category] || {
      total: 0,
      passed: 0,
      failed: 0,
    };

    const prevRate =
      prevStats.total > 0
        ? ((prevStats.passed / prevStats.total) * 100).toFixed(1)
        : "N/A";
    const currRate =
      currStats.total > 0
        ? ((currStats.passed / currStats.total) * 100).toFixed(1)
        : "N/A";

    console.log(`   ${category}:`);
    console.log(
      `     Previous: ${prevStats.passed}/${prevStats.total} (${prevRate}%)`,
    );
    console.log(
      `     Current:  ${currStats.passed}/${currStats.total} (${currRate}%)`,
    );

    if (currStats.passed > prevStats.passed) {
      console.log(
        `     ✅ Improvement: +${currStats.passed - prevStats.passed} tests now passing`,
      );
    } else if (currStats.passed < prevStats.passed) {
      console.log(
        `     ❌ Regression: -${prevStats.passed - currStats.passed} tests now failing`,
      );
    }
  }

  // Test-by-test comparison
  console.log(`\n🔍 Test-by-Test Changes:`);

  const currentMap = new Map(current.results.map((r) => [r.name, r]));
  const previousMap = new Map(previous.results.map((r) => [r.name, r]));

  let hasChanges = false;

  for (const [testName, currentResult] of currentMap) {
    const previousResult = previousMap.get(testName);

    if (!previousResult) {
      console.log(`   ✨ NEW: ${testName} - ${currentResult.status}`);
      hasChanges = true;
      continue;
    }

    if (currentResult.status !== previousResult.status) {
      console.log(`   🔄 CHANGED: ${testName}`);
      console.log(`      ${previousResult.status} → ${currentResult.status}`);
      hasChanges = true;
    }

    const timeDiff = currentResult.responseTime - previousResult.responseTime;
    if (Math.abs(timeDiff) > 100) {
      const direction = timeDiff > 0 ? "⬆️ Slower" : "⬇️ Faster";
      console.log(
        `   ${direction}: ${testName} (${previousResult.responseTime}ms → ${currentResult.responseTime}ms, ${timeDiff > 0 ? "+" : ""}${timeDiff}ms)`,
      );
      hasChanges = true;
    }
  }

  // Check for removed tests
  for (const [testName] of previousMap) {
    if (!currentMap.has(testName)) {
      console.log(`   ❌ REMOVED: ${testName}`);
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    console.log("   No significant changes detected");
  }

  console.log("\n" + "=".repeat(80));
}

function main(): void {
  const reports = getReports();

  if (reports.length === 0) {
    console.error("❌ No test reports found!");
    process.exit(1);
  }

  if (reports.length === 1) {
    console.log("⚠️  Only one report found. Cannot compare.");
    console.log(`Report: ${reports[0]}`);
    process.exit(0);
  }

  const currentReport = loadReport(reports[0]);
  const previousReport = loadReport(reports[1]);

  compareReports(currentReport, previousReport);

  // Show all available reports
  console.log(`\n📋 Available Reports (${reports.length} total):`);
  reports.forEach((report, index) => {
    console.log(`   ${index + 1}. ${report}`);
  });
}

main();
