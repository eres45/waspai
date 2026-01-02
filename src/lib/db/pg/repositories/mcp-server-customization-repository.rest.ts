import { supabaseRest } from "../../supabase-rest";
import { McpServerCustomizationRepository } from "app-types/mcp";

export const restMcpServerCustomizationRepository: McpServerCustomizationRepository =
  {
    async selectByUserIdAndMcpServerId({ userId, mcpServerId }) {
      const { data, error } = await supabaseRest
        .from("mcp_server_custom_instructions")
        .select("*, mcp_server:mcp_server_id(name)")
        .eq("user_id", userId)
        .eq("mcp_server_id", mcpServerId)
        .single();

      if (error) return null;

      return {
        ...mapMcpServerCustomization(data),
        serverName: data.mcp_server?.name,
      };
    },

    async selectByUserId(userId) {
      const { data, error } = await supabaseRest
        .from("mcp_server_custom_instructions")
        .select("*, mcp_server:mcp_server_id(name)")
        .eq("user_id", userId);

      if (error) throw error;

      return data.map((item: any) => ({
        ...mapMcpServerCustomization(item),
        serverName: item.mcp_server?.name,
      }));
    },

    async upsertMcpServerCustomization(data) {
      const customData = {
        user_id: data.userId,
        mcp_server_id: data.mcpServerId,
        prompt: data.prompt,
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabaseRest
        .from("mcp_server_custom_instructions")
        .upsert(customData, { onConflict: "user_id, mcp_server_id" })
        .select()
        .single();

      if (error) throw error;
      return mapMcpServerCustomization(result);
    },

    async deleteMcpServerCustomizationByMcpServerIdAndUserId(key) {
      const { error } = await supabaseRest
        .from("mcp_server_custom_instructions")
        .delete()
        .eq("user_id", key.userId)
        .eq("mcp_server_id", key.mcpServerId);

      if (error) throw error;
    },
  };

function mapMcpServerCustomization(item: any): any {
  if (!item) return item;
  return {
    id: item.id,
    userId: item.user_id,
    mcpServerId: item.mcp_server_id,
    prompt: item.prompt,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}
