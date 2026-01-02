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
