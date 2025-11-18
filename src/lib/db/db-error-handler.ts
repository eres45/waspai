/**
 * Database error handler for Vercel/Supabase free tier
 * Provides fallback responses when direct PostgreSQL connections fail
 */

export function isDatabaseConnectionError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || "";
  return (
    errorMessage.includes("enotfound") ||
    errorMessage.includes("enetunreach") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("getaddrinfo") ||
    errorMessage.includes("connect") ||
    errorMessage.includes("timeout") ||
    error?.code === "ENOTFOUND" ||
    error?.code === "ENETUNREACH" ||
    error?.code === "ECONNREFUSED"
  );
}

export function handleDatabaseError(error: any, context: string): never {
  console.error(`[DB Error] ${context}:`, error);

  if (isDatabaseConnectionError(error)) {
    throw new Error(
      `Database connection failed: ${error.message}. This is likely due to Vercel's free tier limitations with direct PostgreSQL connections. Please use Supabase HTTP API instead.`,
    );
  }

  throw error;
}
