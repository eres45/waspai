import { supabaseRest } from "../../supabase-rest";
import type { MCPRepository } from "app-types/mcp";

export const mcpRepository: MCPRepository = {
  async save(server) {
    const id = server.id;
    const now = new Date().toISOString();

    const { data, error } = await supabaseRest
      .from("McpServer")
      .upsert({
        id: id,
        name: server.name,
        config: server.config,
        userId: server.userId,
        visibility: server.visibility ?? "private",
        enabled: true,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async selectById(id) {
    const { data, error } = await supabaseRest
      .from("McpServer")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return undefined;
      throw error;
    }
    return data;
  },

  async selectAll() {
    const { data, error } = await supabaseRest.from("McpServer").select("*");

    if (error) throw error;
    return data || [];
  },

  async selectAllForUser(userId) {
    const { data, error } = await supabaseRest
      .from("McpServer")
      .select(
        `
        id,
        name,
        config,
        enabled,
        userId,
        visibility,
        createdAt,
        updatedAt,
        User(name, image)
      `,
      )
      .or(`userId.eq.${userId},visibility.eq.public`)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return (data || []).map((server: any) => ({
      ...server,
      userName: server.User?.name,
      userAvatar: server.User?.image,
      User: undefined,
    }));
  },

  async updateVisibility(id, visibility) {
    const { error } = await supabaseRest
      .from("McpServer")
      .update({
        visibility,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  async deleteById(id) {
    const { error } = await supabaseRest
      .from("McpServer")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async selectByServerName(name) {
    const { data, error } = await supabaseRest
      .from("McpServer")
      .select("*")
      .eq("name", name)
      .single();

    if (error) {
      if (error.code === "PGRST116") return undefined;
      throw error;
    }
    return data;
  },

  async existsByServerName(name) {
    const { data, error } = await supabaseRest
      .from("McpServer")
      .select("id")
      .eq("name", name)
      .single();

    if (error) {
      if (error.code === "PGRST116") return false;
      throw error;
    }
    return !!data;
  },
};
