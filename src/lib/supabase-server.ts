import { createClient } from "@supabase/supabase-js";
import logger from "@/lib/logger";

let supabaseServerInstance: ReturnType<typeof createClient> | null = null;

function initializeSupabaseServer() {
  if (supabaseServerInstance) {
    return supabaseServerInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    logger.error("SUPABASE_URL environment variable is not set");
    throw new Error("SUPABASE_URL environment variable is not set");
  }

  if (!supabaseServiceRoleKey) {
    logger.error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is not set",
    );
  }

  supabaseServerInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseServerInstance;
}

export const supabaseServer = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_target, prop) => {
    return (initializeSupabaseServer() as any)[prop];
  },
});
