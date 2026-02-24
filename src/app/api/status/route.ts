import { NextRequest, NextResponse } from "next/server";
import { customModelProvider } from "@/lib/ai/models";
import { supabaseRest } from "@/lib/db/supabase-rest";
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
  const timeout = 25000; // 25 second timeout

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

    const text = response?.text?.trim() ?? "";
    if (text) {
      return {
        status: responseTime < 5000 ? "operational" : "degraded",
        responseTime,
        error: null,
      };
    }

    return {
      status: "degraded",
      responseTime,
      error: `Empty response (${provider}:${modelId})`,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes("abort") || errorMessage.includes("Timeout")) {
      return {
        status: "degraded",
        responseTime: null,
        error: `Timeout (${Math.round(timeout / 1000)}s)`,
      };
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

    // Transient connectivity / upstream issues: treat as degraded rather than down
    if (
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("ECONNRESET") ||
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("EAI_AGAIN") ||
      errorMessage.includes("502") ||
      errorMessage.includes("Bad Gateway")
    ) {
      return {
        status: "degraded",
        responseTime,
        error: errorMessage.slice(0, 100),
      };
    }

    return { status: "down", responseTime, error: errorMessage.slice(0, 100) };
  }
}

// GET - Retrieve current status
export async function GET() {
  try {
    // Get current model IDs from code to filter out removed models
    const currentModelIds = new Set(
      customModelProvider.modelsInfo.flatMap((p) =>
        p.models.map((m) => m.name),
      ),
    );

    // Get latest status for each model using Supabase REST
    const { data: latestStatuses, error: statusError } = await supabaseRest
      .from("model_status")
      .select("*");

    if (statusError) {
      console.log("Database error:", statusError);
      // Return empty state
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

    // If no data yet, return empty state
    if (!latestStatuses || latestStatuses.length === 0) {
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

    const { data: history, error: historyError } = await supabaseRest
      .from("model_status_history")
      .select("*")
      .gte("tested_at", thirtyDaysAgo.toISOString())
      .order("tested_at", { ascending: false });

    // Calculate uptime percentages per model
    const uptimeStats: Record<string, { total: number; operational: number }> =
      {};

    if (history && !historyError) {
      for (const record of history) {
        if (!uptimeStats[record.model_id]) {
          uptimeStats[record.model_id] = { total: 0, operational: 0 };
        }
        uptimeStats[record.model_id].total++;
        if (record.status === "operational") {
          uptimeStats[record.model_id].operational++;
        }
      }
    }

    // Filter out removed models and build response with uptime (snake_case to camelCase)
    const modelsWithUptime = latestStatuses
      .filter((s: any) => currentModelIds.has(s.model_id))
      .map((s: any) => ({
        modelId: s.model_id,
        provider: s.provider,
        status: s.status,
        responseTime: s.response_time,
        errorMessage: s.error_message,
        testedAt: s.tested_at,
        uptime:
          uptimeStats[s.model_id]?.total > 0
            ? Math.round(
                (uptimeStats[s.model_id].operational /
                  uptimeStats[s.model_id].total) *
                  100,
              )
            : 0,
      }));

    const lastChecked = modelsWithUptime.reduce<string | null>((latest, m) => {
      if (!m.testedAt) return latest;
      if (!latest) return m.testedAt;
      return new Date(m.testedAt) > new Date(latest) ? m.testedAt : latest;
    }, null);

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
      lastChecked,
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

// POST - Run tests (called manually from UI)
export async function POST(_request: NextRequest) {
  try {
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
        const testResult = await testModel(
          providerInfo.provider,
          modelInfo.name,
        );

        // Upsert current status using Supabase REST
        const { error: upsertError } = await supabaseRest
          .from("model_status")
          .upsert(
            {
              model_id: modelInfo.name,
              provider: providerInfo.provider,
              status: testResult.status,
              response_time: testResult.responseTime,
              error_message: testResult.error,
              tested_at: new Date().toISOString(),
            },
            {
              onConflict: "model_id",
            },
          );

        if (upsertError) {
          console.error("Failed to upsert status:", upsertError);
        }

        // Add to history using Supabase REST
        const { error: historyError } = await supabaseRest
          .from("model_status_history")
          .insert({
            model_id: modelInfo.name,
            status: testResult.status,
            response_time: testResult.responseTime,
            error_message: testResult.error,
            tested_at: new Date().toISOString(),
          });

        if (historyError) {
          console.error("Failed to insert history:", historyError);
        }

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
