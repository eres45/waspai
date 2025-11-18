/**
 * Chat repository using Supabase REST API
 */

import { ChatMessage, ChatRepository, ChatThread } from "app-types/chat";
import { supabaseRest } from "../../supabase-rest";

export const chatRepository: ChatRepository = {
  insertThread: async (
    thread: Omit<ChatThread, "createdAt">,
  ): Promise<ChatThread> => {
    console.log("[Chat REST] Inserting thread:", thread.id);

    const { data, error } = await supabaseRest
      .from("chat_thread")
      .insert({
        id: thread.id,
        title: thread.title,
        userId: thread.userId,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Chat REST] insertThread error:", error);
      throw new Error(error.message || "Failed to insert thread");
    }

    return data as ChatThread;
  },

  deleteChatMessage: async (id: string): Promise<void> => {
    console.log("[Chat REST] Deleting message:", id);

    const { error } = await supabaseRest
      .from("chat_message")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[Chat REST] deleteChatMessage error:", error);
      throw new Error(error.message || "Failed to delete message");
    }
  },

  selectThread: async (id: string): Promise<ChatThread | null> => {
    console.log("[Chat REST] Selecting thread:", id);

    try {
      const { data, error } = await supabaseRest
        .from("chat_thread")
        .select()
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data as ChatThread | null;
    } catch (error) {
      console.error("[Chat REST] selectThread error:", error);
      return null;
    }
  },

  selectThreadDetails: async (id: string) => {
    console.log("[Chat REST] Selecting thread details:", id);

    if (!id) {
      return null;
    }

    try {
      // Get thread
      const { data: threadData, error: threadError } = await supabaseRest
        .from("chat_thread")
        .select(
          `
          id,
          title,
          userId,
          createdAt,
          user:userId (
            preferences
          )
        `,
        )
        .eq("id", id)
        .single();

      if (threadError && threadError.code !== "PGRST116") {
        throw threadError;
      }

      if (!threadData) {
        return null;
      }

      // Get messages
      const { data: messagesData, error: messagesError } = await supabaseRest
        .from("chat_message")
        .select()
        .eq("threadId", id)
        .order("createdAt", { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      return {
        id: threadData.id,
        title: threadData.title,
        userId: threadData.userId,
        createdAt: threadData.createdAt,
        userPreferences: (threadData.user as any)?.preferences || undefined,
        messages: (messagesData || []) as ChatMessage[],
      };
    } catch (error) {
      console.error("[Chat REST] selectThreadDetails error:", error);
      return null;
    }
  },

  selectMessagesByThreadId: async (
    threadId: string,
  ): Promise<ChatMessage[]> => {
    console.log("[Chat REST] Selecting messages for thread:", threadId);

    try {
      const { data, error } = await supabaseRest
        .from("chat_message")
        .select()
        .eq("threadId", threadId)
        .order("createdAt", { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as ChatMessage[];
    } catch (error) {
      console.error("[Chat REST] selectMessagesByThreadId error:", error);
      return [];
    }
  },

  selectThreadsByUserId: async (
    userId: string,
  ): Promise<
    (ChatThread & {
      lastMessageAt: number;
    })[]
  > => {
    console.log("[Chat REST] Selecting threads for user:", userId);

    try {
      const { data: threads, error: threadsError } = await supabaseRest
        .from("chat_thread")
        .select()
        .eq("userId", userId)
        .order("createdAt", { ascending: false });

      if (threadsError) {
        throw threadsError;
      }

      // Get last message timestamp for each thread
      const result = await Promise.all(
        (threads || []).map(async (thread) => {
          const { data: messages, error: messagesError } = await supabaseRest
            .from("chat_message")
            .select("createdAt")
            .eq("threadId", thread.id)
            .order("createdAt", { ascending: false })
            .limit(1);

          if (messagesError) {
            console.error(
              "[Chat REST] Error getting last message:",
              messagesError,
            );
            return {
              ...thread,
              lastMessageAt: new Date(thread.createdAt).getTime(),
            };
          }

          const lastMessage = messages?.[0];
          const lastMessageAt = lastMessage
            ? new Date(lastMessage.createdAt).getTime()
            : new Date(thread.createdAt).getTime();

          return {
            ...thread,
            lastMessageAt,
          };
        }),
      );

      // Sort by lastMessageAt descending
      return result.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    } catch (error) {
      console.error("[Chat REST] selectThreadsByUserId error:", error);
      return [];
    }
  },

  updateThread: async (
    id: string,
    thread: Partial<Omit<ChatThread, "id" | "createdAt">>,
  ): Promise<ChatThread> => {
    console.log("[Chat REST] Updating thread:", id);

    const { data, error } = await supabaseRest
      .from("chat_thread")
      .update({ title: thread.title })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Chat REST] updateThread error:", error);
      throw new Error(error.message || "Failed to update thread");
    }

    return data as ChatThread;
  },

  upsertThread: async (
    thread: Omit<ChatThread, "createdAt">,
  ): Promise<ChatThread> => {
    console.log("[Chat REST] Upserting thread:", thread.id);

    const { data, error } = await supabaseRest
      .from("chat_thread")
      .upsert({
        id: thread.id,
        title: thread.title,
        userId: thread.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("[Chat REST] upsertThread error:", error);
      throw new Error(error.message || "Failed to upsert thread");
    }

    return data as ChatThread;
  },

  deleteThread: async (id: string): Promise<void> => {
    console.log("[Chat REST] Deleting thread:", id);

    try {
      // Delete messages first
      const { error: messagesError } = await supabaseRest
        .from("chat_message")
        .delete()
        .eq("threadId", id);

      if (messagesError) {
        throw messagesError;
      }

      // Remove from archives
      const { error: archiveError } = await supabaseRest
        .from("archive_item")
        .delete()
        .eq("itemId", id);

      if (archiveError) {
        throw archiveError;
      }

      // Delete thread
      const { error: threadError } = await supabaseRest
        .from("chat_thread")
        .delete()
        .eq("id", id);

      if (threadError) {
        throw threadError;
      }
    } catch (error) {
      console.error("[Chat REST] deleteThread error:", error);
      throw error;
    }
  },

  insertMessage: async (
    message: Omit<ChatMessage, "createdAt">,
  ): Promise<ChatMessage> => {
    console.log("[Chat REST] Inserting message:", message.id);

    const { data, error } = await supabaseRest
      .from("chat_message")
      .insert({
        id: message.id,
        threadId: message.threadId,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Chat REST] insertMessage error:", error);
      throw new Error(error.message || "Failed to insert message");
    }

    return data as ChatMessage;
  },

  upsertMessage: async (
    message: Omit<ChatMessage, "createdAt">,
  ): Promise<ChatMessage> => {
    console.log("[Chat REST] Upserting message:", message.id);

    const { data, error } = await supabaseRest
      .from("chat_message")
      .upsert({
        id: message.id,
        threadId: message.threadId,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata,
      })
      .select()
      .single();

    if (error) {
      console.error("[Chat REST] upsertMessage error:", error);
      throw new Error(error.message || "Failed to upsert message");
    }

    return data as ChatMessage;
  },

  deleteMessagesByChatIdAfterTimestamp: async (
    messageId: string,
  ): Promise<void> => {
    console.log("[Chat REST] Deleting messages after timestamp:", messageId);

    try {
      // Get the message
      const { data: messageData, error: messageError } = await supabaseRest
        .from("chat_message")
        .select()
        .eq("id", messageId)
        .single();

      if (messageError || !messageData) {
        return;
      }

      // Delete messages in same thread created at or after this message
      const { error: deleteError } = await supabaseRest
        .from("chat_message")
        .delete()
        .eq("threadId", messageData.threadId)
        .gte("createdAt", messageData.createdAt);

      if (deleteError) {
        throw deleteError;
      }
    } catch (error) {
      console.error(
        "[Chat REST] deleteMessagesByChatIdAfterTimestamp error:",
        error,
      );
      throw error;
    }
  },

  deleteAllThreads: async (userId: string): Promise<void> => {
    console.log("[Chat REST] Deleting all threads for user:", userId);

    try {
      // Get all thread IDs
      const { data: threads, error: threadsError } = await supabaseRest
        .from("chat_thread")
        .select("id")
        .eq("userId", userId);

      if (threadsError) {
        throw threadsError;
      }

      // Delete each thread
      await Promise.all(
        (threads || []).map((thread) => chatRepository.deleteThread(thread.id)),
      );
    } catch (error) {
      console.error("[Chat REST] deleteAllThreads error:", error);
      throw error;
    }
  },

  deleteUnarchivedThreads: async (userId: string): Promise<void> => {
    console.log("[Chat REST] Deleting unarchived threads for user:", userId);

    try {
      // Get archived thread IDs
      const { data: archivedItems, error: archivedError } = await supabaseRest
        .from("archive_item")
        .select("itemId");

      if (archivedError) {
        throw archivedError;
      }

      const archivedIds = new Set(
        (archivedItems || []).map((item) => item.itemId),
      );

      // Get all thread IDs for user
      const { data: threads, error: threadsError } = await supabaseRest
        .from("chat_thread")
        .select("id")
        .eq("userId", userId);

      if (threadsError) {
        throw threadsError;
      }

      // Delete unarchived threads
      const unarchivedThreads = (threads || []).filter(
        (thread) => !archivedIds.has(thread.id),
      );

      await Promise.all(
        unarchivedThreads.map((thread) =>
          chatRepository.deleteThread(thread.id),
        ),
      );
    } catch (error) {
      console.error("[Chat REST] deleteUnarchivedThreads error:", error);
      throw error;
    }
  },

  insertMessages: async (messages: any[]): Promise<ChatMessage[]> => {
    console.log("[Chat REST] Inserting messages:", messages.length);

    try {
      const { data, error } = await supabaseRest
        .from("chat_message")
        .insert(
          messages.map((msg) => ({
            ...msg,
            createdAt: msg.createdAt || new Date().toISOString(),
          })),
        )
        .select();

      if (error) {
        throw error;
      }

      return (data || []) as ChatMessage[];
    } catch (error) {
      console.error("[Chat REST] insertMessages error:", error);
      throw error;
    }
  },

  checkAccess: async (id: string, userId: string): Promise<boolean> => {
    console.log("[Chat REST] Checking access:", id, userId);

    try {
      const { data, error } = await supabaseRest
        .from("chat_thread")
        .select("userId")
        .eq("id", id)
        .eq("userId", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return Boolean(data);
    } catch (error) {
      console.error("[Chat REST] checkAccess error:", error);
      return false;
    }
  },
};
