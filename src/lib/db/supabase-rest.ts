/**
 * Supabase REST API client for database operations
 * This replaces direct PostgreSQL connections with HTTP API calls
 */

import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is not set");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
}

export const supabaseRest = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Helper to execute queries with error handling
 */
export async function executeQuery<T>(
  query: Promise<{ data: T | null; error: any }>,
  context: string,
): Promise<T> {
  try {
    const { data, error } = await query;

    if (error) {
      console.error(`[Supabase REST] ${context} error:`, error);
      throw new Error(error.message || `${context} failed`);
    }

    return data as T;
  } catch (error) {
    console.error(`[Supabase REST] ${context} exception:`, error);
    throw error;
  }
}

/**
 * Helper to execute queries that return multiple rows
 */
export async function executeQueryList<T>(
  query: Promise<{ data: T[] | null; error: any }>,
  context: string,
): Promise<T[]> {
  try {
    const { data, error } = await query;

    if (error) {
      console.error(`[Supabase REST] ${context} error:`, error);
      throw new Error(error.message || `${context} failed`);
    }

    return (data as T[]) || [];
  } catch (error) {
    console.error(`[Supabase REST] ${context} exception:`, error);
    throw error;
  }
}
