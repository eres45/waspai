// import { Logger } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { isDatabaseConnectionError } from "../db-error-handler";

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
        pgDbInstance = drizzlePg(process.env.POSTGRES_URL, {
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
            `[DB] Cannot connect to PostgreSQL on Vercel free tier. This is a known limitation. Please migrate to Supabase HTTP API. Original error: ${(error as any)?.message}`,
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
