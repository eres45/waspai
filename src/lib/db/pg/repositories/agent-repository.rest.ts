import { Agent, AgentRepository, AgentSummary } from "app-types/agent";
import { supabaseRest } from "../../supabase-rest";
import { generateUUID } from "lib/utils";

export const agentRepository: AgentRepository = {
  async insertAgent(agent) {
    const id = generateUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabaseRest
      .from("agent")
      .insert({
        id,
        name: agent.name,
        description: agent.description || null,
        icon: agent.icon || null,
        userId: agent.userId,
        instructions: agent.instructions || {},
        visibility: agent.visibility || "private",
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      description: data.description ?? undefined,
      icon: data.icon ?? undefined,
      instructions: data.instructions ?? {},
    };
  },

  async selectAgentById(id, userId): Promise<Agent | null> {
    const { data, error } = await supabaseRest
      .from("agent")
      .select(
        `
        id,
        name,
        description,
        icon,
        userId,
        instructions,
        visibility,
        createdAt,
        updatedAt,
        Bookmark(id)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    if (!data) return null;

    // Check access
    const isOwner = data.userId === userId;
    const isPublic =
      data.visibility === "public" || data.visibility === "readonly";

    if (!isOwner && !isPublic) return null;

    return {
      ...data,
      description: data.description ?? undefined,
      icon: data.icon ?? undefined,
      instructions: data.instructions ?? {},
      isBookmarked: (data.Bookmark?.length ?? 0) > 0,
    };
  },

  async selectAgents(userId, _filters, limit = 10): Promise<AgentSummary[]> {
    const query = supabaseRest
      .from("agent")
      .select(
        `
        id,
        name,
        description,
        icon,
        userId,
        visibility,
        createdAt,
        updatedAt,
        Bookmark(id)
      `,
      )
      .or(`userId.eq.${userId},visibility.eq.public,visibility.eq.readonly`)
      .order("createdAt", { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description ?? undefined,
      icon: agent.icon ?? undefined,
      userId: agent.userId,
      visibility: agent.visibility,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      isBookmarked: (agent.Bookmark?.length ?? 0) > 0,
    }));
  },

  async updateAgent(id, userId, updates) {
    // Check access first
    const hasAccess = await agentRepository.checkAccess(id, userId, true);
    if (!hasAccess) throw new Error("Access denied");

    const { data, error } = await supabaseRest
      .from("agent")
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      description: data.description ?? undefined,
      icon: data.icon ?? undefined,
      instructions: data.instructions ?? {},
    };
  },

  async deleteAgent(id, userId) {
    // Check access first
    const hasAccess = await agentRepository.checkAccess(id, userId, true);
    if (!hasAccess) throw new Error("Access denied");

    const { error } = await supabaseRest.from("agent").delete().eq("id", id);

    if (error) throw error;
  },

  async checkAccess(agentId, userId, destructive = false): Promise<boolean> {
    const { data, error } = await supabaseRest
      .from("agent")
      .select("userId, visibility")
      .eq("id", agentId)
      .single();

    if (error || !data) return false;

    // Owner always has access
    if (data.userId === userId) return true;

    // For destructive operations, only owner can do it
    if (destructive) return false;

    // For read operations, public/readonly agents are accessible
    return data.visibility === "public" || data.visibility === "readonly";
  },

  async selectAgentsByUserId(userId): Promise<Agent[]> {
    const { data, error } = await supabaseRest
      .from("agent")
      .select(
        `
        id,
        name,
        description,
        icon,
        userId,
        instructions,
        visibility,
        createdAt,
        updatedAt,
        Bookmark(id)
      `,
      )
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return (data || []).map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description ?? undefined,
      icon: agent.icon ?? undefined,
      userId: agent.userId,
      instructions: agent.instructions ?? {},
      visibility: agent.visibility,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      isBookmarked: (agent.Bookmark?.length ?? 0) > 0,
    }));
  },
};
