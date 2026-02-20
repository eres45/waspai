import { NextRequest, NextResponse } from "next/server";
import { customModelProvider } from "@/lib/ai/models";
import { ModelStatusTable, ModelStatusHistoryTable } from "@/lib/db/pg/schema.pg";
import { desc, gte } from "drizzle-orm";
import { pgDb } from "@/lib/db/pg/db.pg";
import { generateText } from "ai";

// Test a single model with a simple prompt
async function testModel(
  provider: string,
  modelId: string,
): Promise<{
  status: "operational" | "degraded" | "down" | "unknown";
  responseTime: number | null;
  error: string | null;
}> {
  const startTime = Date.now();
  const timeout = 15000; // 15 second timeout

  try {
    const model = customModelProvider.getModel({
      provider,
      model: modelId,
    });

    // Use generateText from AI SDK
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await generateText({
      model,
      prompt: "Say 'OK'",
      abortSignal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response && response.text) {
      return {
        status: responseTime < 5000 ? "operational" : "degraded",
        responseTime,
        error: null,
      };
    }

    return {
      status: "degraded",
      responseTime,
      error: "Empty response",
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes("abort") || errorMessage.includes("Timeout")) {
      return { status: "down", responseTime: null, error: "Timeout (15s)" };
    }
    if (errorMessage.includes("403") || errorMessage.includes("Unauthorized")) {
      return { status: "down", responseTime, error: "Auth failed" };
    }
    if (errorMessage.includes("429") || errorMessage.includes("rate")) {
      return { status: "degraded", responseTime, error: "Rate limited" };
    }
    if (errorMessage.includes("503") || errorMessage.includes("unavailable")) {
      return { status: "down", responseTime, error: "Service unavailable" };
    }

    return { status: "down", responseTime, error: errorMessage.slice(0, 100) };
  }
}

// GET - Retrieve current status
export async function GET() {
  try {
    // Get latest status for each model - handle empty case
    let latestStatuses: any[] = [];
    try {
      latestStatuses = await pgDb
        .select()
        .from(ModelStatusTable)
        .orderBy(desc(ModelStatusTable.testedAt))
        .limit(100);
    } catch (dbError) {
      console.log("Database error (tables may not exist):", dbError);
      // Return empty state - tables will be created on first POST
    }

    // If no data yet, return empty state
    if (latestStatuses.length === 0) {
      return NextResponse.json({
        systemStatus: "unknown",
        lastChecked: null,
        summary: {
          total: 0,
          operational: 0,
          degraded: 0,
          down: 0,
        },
        models: [],
      });
    }

    // Get uptime stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let history: any[] = [];
    try {
      history = await pgDb
        .select()
        .from(ModelStatusHistoryTable)
        .where(gte(ModelStatusHistoryTable.testedAt, thirtyDaysAgo))
        .orderBy(desc(ModelStatusHistoryTable.testedAt));
    } catch (dbError) {
      console.log("History table error:", dbError);
    }

    // Calculate uptime percentages per model
    const uptimeStats: Record<string, { total: number; operational: number }> =
      {};

    for (const record of history) {
      if (!uptimeStats[record.modelId]) {
        uptimeStats[record.modelId] = { total: 0, operational: 0 };
      }
      uptimeStats[record.modelId].total++;
      if (record.status === "operational") {
        uptimeStats[record.modelId].operational++;
      }
    }

    // Build response with uptime
    const modelsWithUptime = latestStatuses.map((s) => ({
      modelId: s.modelId,
      provider: s.provider,
      status: s.status,
      responseTime: s.responseTime,
      errorMessage: s.errorMessage,
      testedAt: s.testedAt,
      uptime:
        uptimeStats[s.modelId]?.total > 0
          ? Math.round(
              (uptimeStats[s.modelId].operational /
                uptimeStats[s.modelId].total) *
                100,
            )
          : 0,
    }));

    // Calculate overall system status
    const operationalCount = modelsWithUptime.filter(
      (s) => s.status === "operational",
    ).length;
    const degradedCount = modelsWithUptime.filter(
      (s) => s.status === "degraded",
    ).length;
    const downCount = modelsWithUptime.filter(
      (s) => s.status === "down",
    ).length;
    const total = modelsWithUptime.length;

    let systemStatus = "operational";
    if (downCount > total / 2) {
      systemStatus = "major_outage";
    } else if (downCount > 0 || degradedCount > total / 3) {
      systemStatus = "partial_outage";
    } else if (degradedCount > 0) {
      systemStatus = "degraded";
    }

    return NextResponse.json({
      systemStatus,
      lastChecked: modelsWithUptime[0]?.testedAt || null,
      summary: {
        total,
        operational: operationalCount,
        degraded: degradedCount,
        down: downCount,
      },
      models: modelsWithUptime,
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 },
    );
  }
}

// POST - Run tests (called by cron or manually)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const testSecret = "waspai_status_cron_2026";
    
    // Check if authorized (either via env secret or test secret)
    const isAuthorized = authHeader === `Bearer ${cronSecret}` || authHeader === `Bearer ${testSecret}`;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modelsInfo = customModelProvider.modelsInfo;
    const results: Array<{
      modelId: string;
      provider: string;
      status: string;
      responseTime: number | null;
      error: string | null;
    }> = [];

    // Test each model
    for (const providerInfo of modelsInfo) {
      for (const modelInfo of providerInfo.models) {
        const testResult = await testModel(providerInfo.provider, modelInfo.name);

        // Upsert current status
        await pgDb
          .insert(ModelStatusTable)
          .values({
            modelId: modelInfo.name,
            provider: providerInfo.provider,
            status: testResult.status,
            responseTime: testResult.responseTime,
            errorMessage: testResult.error,
            testedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: ModelStatusTable.modelId,
            set: {
              status: testResult.status,
              responseTime: testResult.responseTime,
              errorMessage: testResult.error,
              testedAt: new Date(),
            },
          });

        // Add to history
        await pgDb.insert(ModelStatusHistoryTable).values({
          modelId: modelInfo.name,
          status: testResult.status,
          responseTime: testResult.responseTime,
          errorMessage: testResult.error,
          testedAt: new Date(),
        });

        results.push({
          modelId: modelInfo.name,
          provider: providerInfo.provider,
          status: testResult.status,
          responseTime: testResult.responseTime,
          error: testResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      testedAt: new Date().toISOString(),
      totalTested: results.length,
      results,
    });
  } catch (error) {
    console.error("Error testing models:", error);
    return NextResponse.json(
      { error: "Failed to test models" },
      { status: 500 },
    );
  }
}
