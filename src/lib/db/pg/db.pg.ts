// import { Logger } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }

if (!process.env.POSTGRES_URL) {
  throw new Error(
    "POSTGRES_URL environment variable is not set. Please configure your database connection in environment variables.",
  );
}

export const pgDb = drizzlePg(process.env.POSTGRES_URL, {
  //   logger: new MyLogger(),
});
