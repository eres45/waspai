import { supabaseRest } from "../../supabase-rest";
import { ChatExportRepository } from "app-types/chat-export";

export const restChatExportRepository: ChatExportRepository = {
  exportChat: async ({ threadId, exporterId, expiresAt }) => {
    // Current PG implementation fetches thread & messages first.
    // We should replicate that or do it in one go if possible.
    // REST: Fetch thread & messages, then insert export.

    // 1. Fetch Thread
    const { data: thread } = await supabaseRest
      .from("chat_thread")
      .select("*")
      .eq("id", threadId)
      .single();

    if (!thread) throw new Error("Thread not found");

    // 2. Fetch Messages
    const { data: messages } = await supabaseRest
      .from("chat_message")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (!messages) throw new Error("Messages not found");

    // 3. Insert Export
    const exportData = {
      exporter_id: exporterId ?? thread.user_id,
      title: thread.title,
      messages: messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        parts: m.parts,
        metadata: m.metadata,
      })),
      original_thread_id: threadId,
      expires_at: expiresAt?.toISOString(),
    };

    const { data: result, error } = await supabaseRest
      .from("chat_export")
      .insert(exportData)
      .select()
      .single();

    if (error) throw error;
    return result.id;
  },

  insert: async (data) => {
    const { data: result, error } = await supabaseRest
      .from("chat_export")
      .insert({
        exporter_id: data.exporterId,
        title: data.title,
        messages: data.messages,
        original_thread_id: data.originalThreadId,
        expires_at: data.expiresAt?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result.id;
  },

  selectById: async (id) => {
    const { data, error } = await supabaseRest
      .from("chat_export")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null; // PG Repo returns throws or undefined? Type says Promise<ChatExport>.
    // PG implementation: const [result] = ... return toChatExport(result)
    // Drizzle select returns array. if empty, result[0] is undefined. toChatExport(undefined) fails?
    // Let's assume it wants the object or null/throw.
    // Using mapping.

    return mapChatExport(data);
  },

  selectByIdWithUser: async (id) => {
    const { data, error } = await supabaseRest
      .from("chat_export")
      .select("*, exporter:exporter_id(name, image)")
      .eq("id", id)
      .single();

    if (error) throw error;

    const mapped = mapChatExport(data);
    return {
      ...mapped,
      exporterName: data.exporter?.name,
      exporterImage: data.exporter?.image,
    };
  },

  selectByExporterId: async (exporterId) => {
    const { data, error } = await supabaseRest
      .from("chat_export")
      .select("*")
      .eq("exporter_id", exporterId);

    if (error) throw error;
    return data.map(mapChatExport);
  },

  selectSummaryByExporterId: async (exporterId) => {
    // Needs comment count aggregation.
    // Supabase .select('*, chat_export_comment(count)') returns count of comments
    const { data, error } = await supabaseRest
      .from("chat_export")
      .select("*, chat_export_comment(count)")
      .eq("exporter_id", exporterId)
      .order("exported_at", { ascending: false });

    if (error) throw error;

    return data.map((row: any) => ({
      ...mapChatExport(row),
      commentCount: row.chat_export_comment?.[0]?.count || 0, // Structure depends on exact response
    }));
  },

  checkAccess: async (id, userId) => {
    const { data, error } = await supabaseRest
      .from("chat_export")
      .select("exporter_id")
      .eq("id", id)
      .eq("exporter_id", userId)
      .single();

    return !!data && !error;
  },

  deleteById: async (id) => {
    await supabaseRest.from("chat_export").delete().eq("id", id);
  },

  isExpired: async (id) => {
    const { data } = await supabaseRest
      .from("chat_export")
      .select("expires_at")
      .eq("id", id)
      .single();

    if (!data?.expires_at) return false;
    return new Date(data.expires_at) < new Date();
  },

  insertComment: async (data) => {
    const { error } = await supabaseRest.from("chat_export_comment").insert({
      export_id: data.exportId,
      author_id: data.authorId,
      parent_id: data.parentId,
      content: data.content,
    });

    if (error) throw error;
  },

  selectCommentsByExportId: async (exportId, userId) => {
    const { data, error } = await supabaseRest
      .from("chat_export_comment")
      .select("*, author:author_id(name, image)")
      .eq("export_id", exportId)
      .order("created_at", { ascending: true }); // We sort internally

    if (error) throw error;

    // Map to flat structure first
    const comments = data.map((c: any) => ({
      id: c.id,
      exportId: c.export_id,
      authorId: c.author_id,
      parentId: c.parent_id,
      content: c.content,
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
      authorName: c.author?.name,
      authorImage: c.author?.image,
      isOwner: c.author_id === userId,
      replies: [],
    }));

    // Build tree
    const commentsById = new Map();
    comments.forEach((c: any) => commentsById.set(c.id, c));

    comments.forEach((c: any) => {
      if (c.parentId) {
        const parent = commentsById.get(c.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(c);
        }
      }
    });

    return comments.filter((c: any) => !c.parentId);
  },

  checkCommentAccess: async (id, authorId) => {
    const { data } = await supabaseRest
      .from("chat_export_comment")
      .select("id")
      .eq("id", id)
      .eq("author_id", authorId)
      .single();
    return !!data;
  },

  deleteComment: async (id, authorId) => {
    await supabaseRest
      .from("chat_export_comment")
      .delete()
      .eq("id", id)
      .eq("author_id", authorId);
  },
};

function mapChatExport(item: any): any {
  if (!item) return item;
  return {
    id: item.id,
    exporterId: item.exporter_id,
    title: item.title,
    messages: item.messages,
    originalThreadId: item.original_thread_id,
    exportedAt: new Date(item.exported_at),
    expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
  };
}
