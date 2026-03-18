import { NextRequest, NextResponse } from "next/server";
import { customModelProvider, allModels } from "@/lib/ai/models";
import { supabaseRest } from "@/lib/db/supabase-rest";
import { streamText } from "ai";

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
  const timeout = 60000; // 60 second timeout for rate limits

  try {
    const model = customModelProvider.getModel({
      provider,
      model: modelId,
    });

    // Use streamText to match chat behavior
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const result = await streamText({
      model,
      messages: [
        {
          role: "user",
          content: "Hello, just say 'ready' if you are up and running.",
        },
      ],
      abortSignal: controller.signal,
    });

    // Read first chunk to verify it works
    const reader = result.textStream.getReader();
    const { value, done } = await reader.read();
    reader.releaseLock();

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Be more lenient with vision/large models
    const isVision =
      modelId.toLowerCase().includes("vision") ||
      modelId.toLowerCase().includes("multimodal");
    const operationalThreshold = isVision ? 15000 : 10000;

    if (value || done) {
      return {
        status:
          responseTime < operationalThreshold ? "operational" : "degraded",
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

    // If it's a JSON parse error, perform a diagnostic manual fetch to see the raw body
    if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
      console.error(
        `[Status Check Fail] ${provider}:${modelId}: ${errorMessage}`,
      );

      try {
        // Attempt a manual fetch to see what the worker is actually sending
        // This helps us debug "Invalid JSON response" errors
        const selectedModel: any = allModels[provider]?.[modelId];

        if (selectedModel && selectedModel.clientOptions) {
          const { baseURL } = selectedModel.clientOptions;
          if (baseURL) {
            const diagRes = await fetch(`${baseURL}/chat/completions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: selectedModel.modelId || modelId,
                messages: [{ role: "user", content: "Say OK" }],
                stream: false,
              }),
            });
            const diagBody = await diagRes.text();
            console.error(
              `[Diagnostics] ${provider}:${modelId} Raw Body (${diagRes.status}):`,
              diagBody.slice(0, 500),
            );
          }
        }
      } catch (diagErr) {
        console.error(
          `[Diagnostics] Failed to collect body for ${modelId}:`,
          diagErr,
        );
      }
    }

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

    // Build final list: combine DB data with current configuration
    const modelsWithUptime = Array.from(currentModelIds).map((modelId) => {
      // Find latest status in DB
      const dbStatus = latestStatuses?.find((s: any) => s.model_id === modelId);

      // Find provider from config
      const provider =
        customModelProvider.modelsInfo.find((p) =>
          p.models.some((m) => m.name === modelId),
        )?.provider || "Unknown";

      return {
        modelId,
        provider,
        status: dbStatus?.status || "operational", // Default to operational instead of unknown
        responseTime: dbStatus?.response_time || null,
        errorMessage: dbStatus?.error_message || null,
        testedAt: dbStatus?.tested_at || null,
        uptime:
          uptimeStats[modelId]?.total > 0
            ? Math.round(
                (uptimeStats[modelId].operational /
                  uptimeStats[modelId].total) *
                  100,
              )
            : 100, // Default to 100% uptime for new models
      };
    });

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
    const allModelsToTest = modelsInfo.flatMap((p) =>
      p.models.map((m) => ({ provider: p.provider, modelName: m.name })),
    );

    const results: any[] = [];
    const BATCH_SIZE = 15; // Increased batch size for faster parallel testing

    for (let i = 0; i < allModelsToTest.length; i += BATCH_SIZE) {
      const batch = allModelsToTest.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async ({ provider, modelName }) => {
          const testResult = await testModel(provider, modelName);

          // Upsert current status using Supabase REST
          try {
            await supabaseRest.from("model_status").upsert(
              {
                model_id: modelName,
                provider: provider,
                status: testResult.status,
                response_time: testResult.responseTime,
                error_message: testResult.error,
                tested_at: new Date().toISOString(),
              },
              { onConflict: "model_id" },
            );

            await supabaseRest.from("model_status_history").insert({
              model_id: modelName,
              status: testResult.status,
              response_time: testResult.responseTime,
              error_message: testResult.error,
              tested_at: new Date().toISOString(),
            });
          } catch (dbErr) {
            console.error(`DB Error for ${modelName}:`, dbErr);
          }

          return {
            modelId: modelName,
            provider: provider,
            status: testResult.status,
            responseTime: testResult.responseTime,
            error: testResult.error,
          };
        }),
      );

      results.push(...batchResults);
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
