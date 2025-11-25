# Comprehensive Testing Guide

This guide explains how to use the testing scripts to validate all features of the chatbot.

## Overview

The testing suite includes:
- **test-all-features.ts** - Comprehensive test runner for all features
- **compare-test-reports.ts** - Compare test reports over time to track improvements

## Features Tested

### 1. AI Models
- OpenAI GPT-4o Mini
- Google Gemini
- Mistral
- Pollinations Gemini

### 2. Image Generation
- img-cv (fastest, ultra-realistic)
- flux-max (fast, high quality)
- gpt-imager (good quality)
- nano-banana (detailed)

### 3. Video Generation
- SORA

### 4. Web Search
- Latest AI News
- TypeScript Tutorial

### 5. Document Generation
- PDF Generation
- Word Document Generation
- CSV Generation

### 6. QR Code
- QR Code Generation

## Setup

### Prerequisites
```bash
# Install dependencies
pnpm install

# Ensure environment variables are set
# Copy .env.example to .env and fill in required values
```

### Configuration

Set the API URL in your environment:
```bash
export API_URL=http://localhost:3000
# or
export API_URL=https://your-production-url.com
```

## Running Tests

### Run All Tests
```bash
# Development
pnpm ts-node scripts/test-all-features.ts

# Or compile and run
pnpm tsc scripts/test-all-features.ts
node scripts/test-all-features.js
```

### Compare Reports
```bash
# Compare latest two reports
pnpm ts-node scripts/compare-test-reports.ts

# Or
pnpm tsc scripts/compare-test-reports.ts
node scripts/compare-test-reports.js
```

## Understanding the Report

### Summary Section
```
📈 Summary:
   Total Tests: 20
   ✅ Passed: 18 (90%)
   ❌ Failed: 1
   ⏳ Timeout: 1
   ⚠️  Errors: 0
```

### Performance Section
```
⚡ Performance:
   Average Response Time: 2450ms
   Fastest: AI Model Test (450ms)
   Slowest: Video Generation (8500ms)
```

### Category Breakdown
```
📂 By Category:
   AI Models: 4/4 passed (100%)
   Image Generation: 4/4 passed (100%)
   Video Generation: 0/1 passed (0%)
   Web Search: 2/2 passed (100%)
   Document Generation: 3/3 passed (100%)
   QR Code: 1/1 passed (100%)
```

### Failed Tests Details
```
❌ Failed Tests:
   - Video Generation - SORA: timeout
     Error: Request timeout after 120000ms
```

## Comparison Report

The comparison script shows:
- **Overall changes** in pass/fail rates
- **Performance improvements/regressions**
- **Category-by-category comparison**
- **Test-by-test changes** (new, removed, status changed, timing changed)

Example output:
```
📊 COMPARISON REPORT

📈 Overall Statistics:
   Total Tests: 20 → 20
   ✅ Passed: 18 → 19 (+1)
   ❌ Failed: 1 → 0 (-1)
   ⏳ Timeout: 1 → 1 (0)
   ⚠️  Errors: 0 → 0 (0)

⚡ Performance:
   Average Response Time: 2450ms → 2380ms (-70ms, -2.9%)

🔍 Test-by-Test Changes:
   🔄 CHANGED: Video Generation - SORA
      timeout → pass
   ⬇️ Faster: AI Model Test (1200ms → 950ms, -250ms)
```

## Report Storage

Reports are automatically saved to:
```
test-reports/test-report-{timestamp}.json
```

Each report contains:
- Timestamp of test run
- All test results with response times
- Summary statistics
- Category breakdown
- Performance metrics

## Interpreting Results

### Status Codes
- **pass** - Test completed successfully
- **fail** - Test failed (HTTP error or validation error)
- **timeout** - Test exceeded time limit
- **error** - Test encountered an exception

### Response Time Guidelines
- **< 1000ms** - Excellent
- **1000-3000ms** - Good
- **3000-5000ms** - Acceptable
- **> 5000ms** - Slow (investigate)

### Pass Rate Targets
- **AI Models** - Target: 100%
- **Image Generation** - Target: 100%
- **Video Generation** - Target: 100% (may timeout occasionally)
- **Web Search** - Target: 95%+ (may fail due to rate limiting)
- **Document Generation** - Target: 100%
- **QR Code** - Target: 100%

## Troubleshooting

### Tests Timing Out
- Check if services are running
- Increase timeout values in the script
- Check network connectivity
- Review server logs

### All Tests Failing
- Verify API_URL is correct
- Check if server is running
- Verify authentication/session
- Check environment variables

### Performance Degradation
- Check server resources (CPU, memory)
- Review recent code changes
- Check for database issues
- Monitor network latency

## Adding New Tests

To add new tests:

1. Add test configuration to the `tests` object
2. Create a test function (e.g., `testNewFeature`)
3. Add test execution in `runAllTests()`
4. Update this documentation

Example:
```typescript
// Add to tests object
musicGeneration: [
  {
    name: "Music Gen - Test",
    prompt: "Generate upbeat pop music",
  },
],

// Add test function
async function testMusicGeneration(test: any): Promise<TestResult> {
  // Implementation
}

// Add to runAllTests
console.log("\n🎵 Testing Music Generation...");
for (const test of tests.musicGeneration) {
  const result = await testMusicGeneration(test);
  results.push(result);
  console.log(`  ${result.name}: ${result.status} (${result.responseTime}ms)`);
}
```

## Continuous Testing

To run tests periodically:

```bash
# Run every hour
watch -n 3600 'pnpm ts-node scripts/test-all-features.ts'

# Or use cron (Linux/Mac)
0 * * * * cd /path/to/project && pnpm ts-node scripts/test-all-features.ts
```

## Analyzing Trends

Track improvements over time:
1. Run tests regularly (daily/weekly)
2. Compare reports using `compare-test-reports.ts`
3. Look for patterns in failures
4. Identify performance trends
5. Make targeted improvements

## Support

For issues or questions:
1. Check the test report for specific errors
2. Review server logs
3. Check environment configuration
4. Verify API keys and credentials
