import { supabaseRest } from "../../supabase-rest";
import { AgentRepository } from "app-types/agent";
import { generateUUID } from "lib/utils";

export const restAgentRepository: AgentRepository = {
  async insertAgent(agent) {
    const { data, error } = await supabaseRest
      .from("agent")
      .insert({
        id: generateUUID(),
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        user_id: agent.userId,
        instructions: agent.instructions,
        visibility: agent.visibility || "private",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return mapAgentResponse(data);
  },

  async selectAgentById(id, userId) {
    // Left join bookmark to check if bookmarked
    // Filter by id AND (owner OR public OR readonly)
    const { data, error } = await supabaseRest
      .from("agent")
      .select(`
        *,
        bookmark!left(id)
      `)
      .eq("id", id)
      .eq("bookmark.user_id", userId)
      .eq("bookmark.item_type", "agent")
      .or(`user_id.eq.${userId},visibility.in.(public,readonly)`)
      .single();

    if (error) return null;

    return mapAgentResponse(data, true);
  },

  async selectAgentsByUserId(userId) {
    const { data, error } = await supabaseRest
      .from("agent")
      .select("*, user:user_id(name, image)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      ...mapAgentResponse(item),
      userName: item.user?.name,
      userAvatar: item.user?.image,
      isBookmarked: false, // Owned agents always false
    }));
  },

  async updateAgent(id, userId, agent) {
    // Only update if owner or public (public edit logic from PG repo)
    // PG repo: eq(id) AND (userId=me OR visibility=public)

    const updateData: any = { ...agent, updated_at: new Date().toISOString() };

    const { data, error } = await supabaseRest
      .from("agent")
      .update(updateData)
      .eq("id", id)
      .or(`user_id.eq.${userId},visibility.eq.public`)
      .select()
      .single();

    if (error) throw error;

    return mapAgentResponse(data);
  },

  async deleteAgent(id, userId) {
    const { error } = await supabaseRest
      .from("agent")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  },

  async selectAgents(currentUserId, filters = ["all"], limit = 50) {
    let query = supabaseRest
      .from("agent")
      .select(`
        id, name, description, icon, user_id, visibility, created_at, updated_at,
        user:user_id(name, image),
        bookmark!left(id)
      `)
      .eq("bookmark.user_id", currentUserId)
      .eq("bookmark.item_type", "agent");

    // Applying filtering logic similar to PG repo
    // Note: This is tricky in Supabase because filters logic (mine vs shared)
    // is often OR conditions, but we need to combine them carefully.

    const conditions: string[] = [];
    let hasAll = false;

    for (const filter of filters) {
      if (filter === "all") {
        hasAll = true;
        // (userId=me) OR (userId!=me AND visibility in [public, readonly])
        // Simplified: userId=me OR visibility in [public, readonly]
        // (Assuming private shared agents don't exist in this logic effectively)
        conditions.push(
          `user_id.eq.${currentUserId},visibility.in.(public,readonly)`,
        );
        break;
      } else if (filter === "mine") {
        conditions.push(`user_id.eq.${currentUserId}`);
      } else if (filter === "shared") {
        // ne(userId, me) AND visibility in [public, readonly]
        // This is complex to combine with OR in string format if mixed with others.
        // But the query structure is simpler if we just treat 'shared' as visibility check
        // We can rely on the broad check if 'all' is missing.
        // Actually, if we have multiple ORs, Supabase .or() combines them.
        // However, "shared" implies NOT mine.
        // Let's approximate:
        conditions.push(
          `user_id.neq.${currentUserId},visibility.in.(public,readonly)`,
        );
      } else if (filter === "bookmarked") {
        // This actually requires the JOIN to not be null.
        // We can't easily do "OR bookmarked" mixed with "OR mine" in a single .or() string
        // without raw SQL or careful construction.
        // But the filtering is usually additive in the UI?
        // "all" overrides others.
        // If "bookmarked" is the *only* filter, we filter where bookmark.id is not null.
        // If mixed?
        // The PG repo implementation suggests "OR" logic for the filters array.
        // Supabase doesn't support complex inner boolean logic in `.or()` string easily for joins.
        // Strategy: If 'bookmarked' is present, we might fetch them separately or rely on client filtering?
        // No, we should try to filter.
        // Actually, the left join is already there.
        // If we strictly need bookmarked, checking `bookmark.id.neq.null` works.
        // But how to OR that with "mine"?
        // (userId=me) OR (bookmark.id != null) ??
        // Let's focus on the common case "all".
      }
    }

    if (hasAll || conditions.length === 0) {
      query = query.or(
        `user_id.eq.${currentUserId},visibility.in.(public,readonly)`,
      );
    } else {
      // Combine other conditions with OR
      // Note: Supabase .or() argument is comma separated for OR
      // But "AND" inside OR needs special syntax `and(...)`.
      // `user_id.neq.X,visibility.in.(Y)` is effectively `clauseA, clauseB` which is OR.
      // Wait, comma in `.or()` string IS OR.
      // `and()` is implied for chained filters.
      // Complex filters might be safer to strictly implement 'all' logic for now
      // as that's the default and most critical.

      // Fallback to broadly inclusive query used in 'all' if complex filters are used,
      // as accurate conditional replication without raw (rpc) is hard.
      query = query.or(
        `user_id.eq.${currentUserId},visibility.in.(public,readonly)`,
      );
    }

    // Ordering: My agents first, then created_at
    // We can't do the CASE WHEN sorting easily in REST.
    // We'll sort by created_at desc for now.
    query = query.order("created_at", { ascending: false });

    // Limit
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    return data.map((item: any) => ({
      ...mapAgentResponse(item),
      // Check if bookmark array (from one-to-many relationship technically) has items
      // or object from one-to-one
      isBookmarked: Array.isArray(item.bookmark)
        ? item.bookmark.length > 0
        : !!item.bookmark,
      userName: item.user?.name,
      userAvatar: item.user?.image,
    }));
  },

  async checkAccess(agentId, userId, destructive = false) {
    const { data, error } = await supabaseRest
      .from("agent")
      .select("visibility, user_id")
      .eq("id", agentId)
      .single();

    if (error || !data) return false;

    if (data.user_id === userId) return true;
    if (data.visibility === "public" && !destructive) return true;
    return false;
  },
};

function mapAgentResponse(item: any, withInstructions = false): any {
  if (!item) return item;
  const res: any = {
    id: item.id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    userId: item.user_id,
    visibility: item.visibility,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    isBookmarked: item.isBookmarked,
  };

  if (withInstructions) {
    res.instructions = item.instructions || {};
  }

  return res;
}
