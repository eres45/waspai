// import { Logger } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { isDatabaseConnectionError } from "../db-error-handler";

// Force unset PGHOST to prevent 'getaddrinfo ENOTFOUND postgres' error
// caused by system environment variable conflict
if (process.env.PGHOST === "postgres") {
  delete process.env.PGHOST;
}

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }

let pgDbInstance: ReturnType<typeof drizzlePg> | null = null;
let connectionError: Error | null = null;

export const pgDb = new Proxy({} as ReturnType<typeof drizzlePg>, {
  get: (_target, prop) => {
    if (connectionError) {
      throw connectionError;
    }

    if (!pgDbInstance) {
      if (!process.env.POSTGRES_URL) {
        const error = new Error(
          "POSTGRES_URL environment variable is not set. Please configure your database connection in environment variables.",
        );
        connectionError = error;
        throw error;
      }

      try {
        // Explicitly create a Pool to ensure connection string is respected
        // and to facilitate ignoring conflicting env vars if needed
        const pool = new Pool({
          connectionString: process.env.POSTGRES_URL,
          // Force SSL if it's supposed to be required (Supabase usually needs it)
          // ssl: { rejectUnauthorized: false }
        });

        pgDbInstance = drizzlePg(pool, {
          //   logger: new MyLogger(),
        });
        console.log("[DB] PostgreSQL connection initialized");
      } catch (error) {
        console.error(
          "[DB] Failed to initialize PostgreSQL connection:",
          error,
        );
        if (isDatabaseConnectionError(error)) {
          connectionError = new Error(
            `[DB] Cannot connect to PostgreSQL. Original error: ${(error as any)?.message}`,
          );
        } else {
          connectionError = error as Error;
        }
        throw connectionError;
      }
    }
    return (pgDbInstance as any)[prop];
  },
});
