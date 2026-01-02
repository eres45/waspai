import { supabaseRest } from "../../supabase-rest";
import logger from "@/lib/logger";

export interface TelegramUpload {
  id: string;
  file_id: string;
  message_id: number;
  file_type: "image" | "video" | "pdf" | "document";
  user_id: string;
  filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
  telegram_url: string | null;
  created_at: Date;
}

export interface InsertTelegramUpload {
  file_id: string;
  message_id: number;
  file_type: "image" | "video" | "pdf" | "document";
  user_id: string;
  filename?: string;
  content_type?: string;
  size_bytes?: number;
  telegram_url?: string;
}

export const telegramUploadRepositoryRest = {
  async insertUpload(data: InsertTelegramUpload): Promise<TelegramUpload> {
    try {
      const { data: upload, error } = await supabaseRest
        .from("telegram_uploads")
        .insert({
          file_id: data.file_id,
          message_id: data.message_id,
          file_type: data.file_type,
          user_id: data.user_id,
          filename: data.filename || null,
          content_type: data.content_type || null,
          size_bytes: data.size_bytes || null,
          telegram_url: data.telegram_url || null,
        })
        .select()
        .single();

      if (error) {
        logger.error("[Telegram Upload Repo] Insert error:", error);
        throw error;
      }

      return {
        ...upload,
        created_at: new Date(upload.created_at),
      };
    } catch (error) {
      logger.error("[Telegram Upload Repo] insertUpload error:", error);
      throw error;
    }
  },

  async selectUploadsByUserId(userId: string): Promise<TelegramUpload[]> {
    try {
      const { data, error } = await supabaseRest
        .from("telegram_uploads")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("[Telegram Upload Repo] Select by user error:", error);
        throw error;
      }

      return (data || []).map((upload) => ({
        ...upload,
        created_at: new Date(upload.created_at),
      }));
    } catch (error) {
      logger.error(
        "[Telegram Upload Repo] selectUploadsByUserId error:",
        error,
      );
      throw error;
    }
  },

  async selectUploadByFileId(fileId: string): Promise<TelegramUpload | null> {
    try {
      const { data, error } = await supabaseRest
        .from("telegram_uploads")
        .select("*")
        .eq("file_id", fileId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          return null;
        }
        logger.error("[Telegram Upload Repo] Select by file_id error:", error);
        throw error;
      }

      return data
        ? {
            ...data,
            created_at: new Date(data.created_at),
          }
        : null;
    } catch (error) {
      logger.error("[Telegram Upload Repo] selectUploadByFileId error:", error);
      throw error;
    }
  },

  async deleteUpload(id: string): Promise<void> {
    try {
      const { error } = await supabaseRest
        .from("telegram_uploads")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("[Telegram Upload Repo] Delete error:", error);
        throw error;
      }
    } catch (error) {
      logger.error("[Telegram Upload Repo] deleteUpload error:", error);
      throw error;
    }
  },

  async selectRecentUploads(limit: number = 50): Promise<TelegramUpload[]> {
    try {
      const { data, error } = await supabaseRest
        .from("telegram_uploads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("[Telegram Upload Repo] Select recent error:", error);
        throw error;
      }

      return (data || []).map((upload) => ({
        ...upload,
        created_at: new Date(upload.created_at),
      }));
    } catch (error) {
      logger.error("[Telegram Upload Repo] selectRecentUploads error:", error);
      throw error;
    }
  },
};
