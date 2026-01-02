import { supabaseRest } from "lib/db/supabase-rest";
import type { MCPRepository } from "app-types/mcp";
import { generateUUID } from "lib/utils";

export const restMcpRepository: MCPRepository = {
  async save(server) {
    const { data, error } = await supabaseRest
      .from("mcp_server")
      .upsert({
        id: server.id ?? generateUUID(),
        name: server.name,
        config: server.config,
        user_id: server.userId,
        visibility: server.visibility ?? "private",
        enabled: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Map snake_case to camelCase if needed, but the interface seems to match schema mostly
    // We need to return McpServerSelect which matches the type.
    // Drizzle schema uses camelCase for keys in code, but snake_case in DB.
    // Supabase returns the DB column names usually.
    // Wait, Drizzle keys: id, name, config, userId...
    // Supabase response: id, name, config, user_id...
    // We need to map it back.

    return mapToDomain(data);
  },

  async selectById(id) {
    const { data, error } = await supabaseRest
      .from("mcp_server")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return mapToDomain(data);
  },

  async selectAll() {
    const { data, error } = await supabaseRest.from("mcp_server").select("*");
    if (error) throw error;
    return data.map(mapToDomain);
  },

  async selectAllForUser(userId) {
    // Join with user table to get name/avatar
    const { data, error } = await supabaseRest
      .from("mcp_server")
      .select("*, user:user_id(name, image)")
      .or(`user_id.eq.${userId},visibility.eq.public`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      ...mapToDomain(item),
      userName: item.user?.name,
      userAvatar: item.user?.image,
    }));
  },

  async updateVisibility(id, visibility) {
    const { error } = await supabaseRest
      .from("mcp_server")
      .update({ visibility, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  },

  async deleteById(id) {
    const { error } = await supabaseRest
      .from("mcp_server")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async selectByServerName(name) {
    const { data, error } = await supabaseRest
      .from("mcp_server")
      .select("*")
      .eq("name", name)
      .single();

    if (error) return null;
    return mapToDomain(data);
  },

  async existsByServerName(name) {
    const { count, error } = await supabaseRest
      .from("mcp_server")
      .select("id", { count: "exact", head: true })
      .eq("name", name);

    if (error) throw error;
    return (count || 0) > 0;
  },
};

function mapToDomain(item: any): any {
  if (!item) return item;
  return {
    id: item.id,
    name: item.name,
    config: item.config,
    enabled: item.enabled,
    userId: item.user_id,
    visibility: item.visibility,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}
