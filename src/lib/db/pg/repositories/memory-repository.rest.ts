import { supabaseRest } from "../../supabase-rest";

/**
 * Memory repository using Supabase REST API
 * Replaces memory-repository.pg.ts to avoid direct DB connection issues
 */
export const memoryRepository = {
  async create(userId: string, content: string, tags: string[] = []) {
    console.log("[Memory REST] Creating memory for user:", userId);

    // insert returns data as array, we take first item
    const { data, error } = await supabaseRest
      .from("user_memory")
      .insert({
        user_id: userId,
        content,
        tags: tags || [], // Helper ensures array
      })
      .select()
      .single();

    if (error) {
      console.error("[Memory REST] create error:", error);
      throw new Error(error.message || "Failed to create memory");
    }

    // Map snake_case to camelCase entity
    return {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      tags: data.tags,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  async list(userId: string, limit = 50) {
    console.log("[Memory REST] Listing memories for user:", userId);

    const { data, error } = await supabaseRest
      .from("user_memory")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Memory REST] list error:", error);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      content: m.content,
      tags: m.tags,
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }));
  },

  async search(userId: string, query: string) {
    console.log("[Memory REST] Searching memories for user:", userId, query);

    // Using textSearch on content column or ilike fallback
    // Note: for simple 'ilike' behavior via REST:
    // .ilike('content', `%${query}%`)

    const { data, error } = await supabaseRest
      .from("user_memory")
      .select()
      .eq("user_id", userId)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[Memory REST] search error:", error);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      content: m.content,
      tags: m.tags,
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }));
  },

  async delete(userId: string, id: string) {
    console.log("[Memory REST] Deleting memory:", id);

    const { data, error } = await supabaseRest
      .from("user_memory")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[Memory REST] delete error:", error);
      throw new Error(error.message || "Failed to delete memory");
    }

    return {
      id: data.id,
    };
  },
};
