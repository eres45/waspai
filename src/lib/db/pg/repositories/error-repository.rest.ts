import { supabaseRest } from "../../supabase-rest";

export interface SystemErrorInsertInput {
  userId?: string | null;
  errorName: string;
  errorMessage: string;
  errorStack?: string | null;
  path?: string | null;
  method?: string | null;
  statusCode?: number | null;
  metadata?: Record<string, any> | null;
}

export const errorRepositoryRest = {
  async insertError(error: SystemErrorInsertInput): Promise<void> {
    const { error: dbError } = await supabaseRest.from("system_error").insert({
      user_id: error.userId || null,
      error_name: error.errorName,
      error_message: error.errorMessage,
      error_stack: error.errorStack || null,
      path: error.path || null,
      method: error.method || null,
      status_code: error.statusCode || null,
      metadata: error.metadata || null,
    });

    if (dbError) {
      // Direct console.error to avoid logger recursion loop
      console.error(
        "[errorRepositoryRest] failed to log system error to database:",
        dbError,
      );
      throw dbError;
    }
  },

  async selectErrors(options: {
    page?: number;
    limit?: number;
    search?: string;
    errorName?: string;
    method?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabaseRest
      .from("system_error")
      .select("*, user(id, name, email)", { count: "exact" });

    if (options.errorName) {
      query = query.eq("error_name", options.errorName);
    }
    if (options.method) {
      query = query.eq("method", options.method);
    }
    if (options.search) {
      query = query.or(
        `error_message.ilike.%${options.search}%,error_name.ilike.%${options.search}%,path.ilike.%${options.search}%`,
      );
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(
        "[errorRepositoryRest] failed to select system errors:",
        error,
      );
      throw error;
    }

    return {
      errors: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      page,
      limit,
    };
  },

  async deleteError(id: string): Promise<void> {
    const { error } = await supabaseRest
      .from("system_error")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        `[errorRepositoryRest] failed to delete error ${id}:`,
        error,
      );
      throw error;
    }
  },

  async clearAllErrors(): Promise<void> {
    const { error } = await supabaseRest
      .from("system_error")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error(
        "[errorRepositoryRest] failed to clear system errors:",
        error,
      );
      throw error;
    }
  },
};
export type ErrorRepositoryRest = typeof errorRepositoryRest;
