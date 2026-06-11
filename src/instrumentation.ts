import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // Force unset PGHOST to prevent conflicts with POSTGRES_URL connection string
      // This fixes 'getaddrinfo ENOTFOUND postgres' if configured in system env
      delete process.env.PGHOST;

      // run DB migration
      console.log("DEBUG: POSTGRES_URL seen by app:", process.env.POSTGRES_URL);
      const runMigrate = await import("./lib/db/pg/migrate.pg").then(
        (m) => m.runMigrate,
      );
      await runMigrate().catch((e) => {
        console.error(
          "⚠️  Database migration failed, continuing without database:",
          e.message,
        );
        // Don't exit, allow app to run without database in dev mode
      });
      const initMCPManager = await import("./lib/ai/mcp/mcp-manager").then(
        (m) => m.initMCPManager,
      );
      await initMCPManager();
    }
  }
}

export async function onRequestError(
  err: any,
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
  context: {
    routerKind: "pages" | "app";
    routeType: "render" | "route" | "action" | "middleware";
  },
) {
  // Only execute when Supabase config is available to prevent crashes during tests or headless builds
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  try {
    const { errorRepositoryRest } = await import(
      "./lib/db/pg/repositories/error-repository.rest"
    );

    const metadata: Record<string, any> = {
      routerKind: context.routerKind,
      routeType: context.routeType,
      digest: err.digest || null,
    };

    // Log the error to the database using the REST client
    await errorRepositoryRest.insertError({
      errorName: err.name || "Error",
      errorMessage: err.message || String(err),
      errorStack: err.stack || null,
      path: request.path,
      method: request.method,
      statusCode: err.status || err.statusCode || 500,
      metadata,
    });
  } catch (logError) {
    // Direct console.error to avoid recursion loops
    console.error(
      "[onRequestError] Failed to log system error to database:",
      logError,
    );
  }
}
