import { supabaseRest } from "../../supabase-rest";
import { McpToolCustomizationRepository } from "app-types/mcp";

export const restMcpToolCustomizationRepository: McpToolCustomizationRepository =
  {
    async select(key) {
      const { data, error } = await supabaseRest
        .from("mcp_server_tool_custom_instructions")
        .select("*")
        .eq("user_id", key.userId)
        .eq("mcp_server_id", key.mcpServerId)
        .eq("tool_name", key.toolName)
        .single();

      if (error) return null;
      return mapMcpToolCustomization(data);
    },

    async selectByUserIdAndMcpServerId(key) {
      const { data, error } = await supabaseRest
        .from("mcp_server_tool_custom_instructions")
        .select("*")
        .eq("user_id", key.userId)
        .eq("mcp_server_id", key.mcpServerId);

      if (error) throw error;
      return data.map(mapMcpToolCustomization);
    },

    async selectByUserId(userId) {
      const { data, error } = await supabaseRest
        .from("mcp_server_tool_custom_instructions")
        .select("*, mcp_server:mcp_server_id(name)")
        .eq("user_id", userId);

      if (error) throw error;

      return data.map((item: any) => ({
        ...mapMcpToolCustomization(item),
        serverName: item.mcp_server?.name,
      }));
    },

    async upsertToolCustomization(data) {
      const customData = {
        user_id: data.userId,
        tool_name: data.toolName,
        mcp_server_id: data.mcpServerId,
        prompt: data.prompt,
        updated_at: new Date().toISOString(),
      };

      // onConflict inferred from constraints if not specified, or explicit
      const { data: result, error } = await supabaseRest
        .from("mcp_server_tool_custom_instructions")
        .upsert(customData, { onConflict: "user_id, tool_name, mcp_server_id" })
        .select()
        .single();

      if (error) throw error;
      return mapMcpToolCustomization(result);
    },

    async deleteToolCustomization(key) {
      const { error } = await supabaseRest
        .from("mcp_server_tool_custom_instructions")
        .delete()
        .eq("user_id", key.userId)
        .eq("mcp_server_id", key.mcpServerId)
        .eq("tool_name", key.toolName);

      if (error) throw error;
    },
  };

function mapMcpToolCustomization(item: any): any {
  if (!item) return item;
  return {
    id: item.id,
    userId: item.user_id,
    toolName: item.tool_name,
    mcpServerId: item.mcp_server_id,
    prompt: item.prompt,
  };
}
