import { supabaseRest } from "../../supabase-rest";
import { McpOAuthRepository, McpOAuthSession } from "app-types/mcp";

export const restMcpOAuthRepository: McpOAuthRepository = {
  async getAuthenticatedSession(mcpServerId) {
    const { data, error } = await supabaseRest
      .from("mcp_oauth_session")
      .select("*")
      .eq("mcp_server_id", mcpServerId)
      .not("tokens", "is", null) // Supabase Rest filter for NOT NULL
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) return undefined;
    return mapOAuthSession(data);
  },

  async getSessionByState(state) {
    if (!state) return undefined;
    const { data, error } = await supabaseRest
      .from("mcp_oauth_session")
      .select("*")
      .eq("state", state)
      .single();

    if (error) return undefined;
    return mapOAuthSession(data);
  },

  async createSession(mcpServerId, data) {
    const sessionData = {
      ...mapOAuthSessionToDb(data as McpOAuthSession),
      mcp_server_id: mcpServerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabaseRest
      .from("mcp_oauth_session")
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return mapOAuthSession(result) as McpOAuthSession; // Cast safely
  },

  async updateSessionByState(state, data) {
    const updateData = {
      ...mapOAuthSessionToDb(data as McpOAuthSession),
      updated_at: new Date().toISOString(),
    };

    // Remove undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const { data: result, error } = await supabaseRest
      .from("mcp_oauth_session")
      .update(updateData)
      .eq("state", state)
      .select()
      .single();

    if (error) throw new Error(`Session with state ${state} not found`);
    return mapOAuthSession(result) as McpOAuthSession;
  },

  async saveTokensAndCleanup(state, mcpServerId, data) {
    const session = await this.updateSessionByState(state, data);

    await supabaseRest
      .from("mcp_oauth_session")
      .delete()
      .eq("mcp_server_id", mcpServerId)
      .filter("tokens", "is", null)
      .neq("state", state);

    return session;
  },

  async deleteByState(state) {
    await supabaseRest.from("mcp_oauth_session").delete().eq("state", state);
  },
};

function mapOAuthSession(item: any): McpOAuthSession | undefined {
  if (!item) return undefined;
  return {
    id: item.id,
    mcpServerId: item.mcp_server_id,
    serverUrl: item.server_url,
    clientInfo: item.client_info,
    tokens: item.tokens,
    codeVerifier: item.code_verifier,
    state: item.state,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

function mapOAuthSessionToDb(session: Partial<McpOAuthSession>): any {
  const db: any = {};
  if (session.id) db.id = session.id;
  if (session.mcpServerId) db.mcp_server_id = session.mcpServerId;
  if (session.serverUrl) db.server_url = session.serverUrl;
  if (session.clientInfo) db.client_info = session.clientInfo;
  if (session.tokens) db.tokens = session.tokens;
  if (session.codeVerifier) db.code_verifier = session.codeVerifier;
  if (session.state) db.state = session.state;
  return db;
}
