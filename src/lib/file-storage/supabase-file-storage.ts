import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { FileNotFoundError } from "lib/errors";
import https from "node:https";
import type {
  FileMetadata,
  FileStorage,
  UploadOptions,
  UploadUrl,
  UploadUrlOptions,
} from "./file-storage.interface";
import {
  resolveStoragePrefix,
  sanitizeFilename,
  toBuffer,
} from "./storage-utils";
import { generateUUID } from "lib/utils";

const STORAGE_PREFIX = resolveStoragePrefix();

const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
};

const buildKey = (filename: string) => {
  const safeName = sanitizeFilename(filename || "file");
  const id = generateUUID();
  const prefix = STORAGE_PREFIX ? `${STORAGE_PREFIX}/` : "";
  return path.posix.join(prefix, `${id}-${safeName}`);
};

export const createSupabaseFileStorage = (): FileStorage => {
  const supabaseUrl = required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const supabaseKey = required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const bucketName = process.env.FILE_STORAGE_SUPABASE_BUCKET || "uploads";

  // Create a custom fetch that handles SSL certificate issues
  const customFetch = async (input: RequestInfo | URL, options?: RequestInit) => {
    try {
      return await fetch(input, options);
    } catch (error: any) {
      // If SSL certificate error, try with verification disabled (development only)
      if (error?.cause?.code === "CERT_HAS_EXPIRED" || error?.message?.includes("certificate")) {
        console.warn("SSL certificate issue detected, retrying with verification disabled");
        const agent = new https.Agent({
          rejectUnauthorized: false,
        });
        return await fetch(input, {
          ...options,
          agent,
        } as any);
      }
      throw error;
    }
  };

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: customFetch,
    },
  });
  const storage = supabase.storage.from(bucketName);

  return {
    async upload(content, options: UploadOptions = {}) {
      const buffer = await toBuffer(content);
      const filename = options.filename ?? "file";
      const key = buildKey(filename);

      try {
        const { error } = await storage.upload(key, buffer, {
          contentType: options.contentType,
          upsert: false,
        });

        if (error) {
          console.error("Supabase upload error:", error);
          throw new Error(`Failed to upload to Supabase: ${error.message}`);
        }
      } catch (err) {
        console.error("Supabase upload exception:", err);
        throw new Error(`Failed to upload to Supabase: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Get public URL
      const { data } = storage.getPublicUrl(key);
      const sourceUrl = data.publicUrl;

      const metadata: FileMetadata = {
        key,
        filename: path.posix.basename(key),
        contentType: options.contentType || "application/octet-stream",
        size: buffer.byteLength,
        uploadedAt: new Date(),
      };

      return {
        key,
        sourceUrl,
        metadata,
      };
    },

    async createUploadUrl(options: UploadUrlOptions): Promise<UploadUrl | null> {
      const key = buildKey(options.filename);
      const expiresInSeconds = options.expiresInSeconds || 3600;

      const { data, error } = await storage.createSignedUploadUrl(key, {
        upsert: false,
      });

      if (error || !data) {
        return null;
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

      return {
        key,
        url: data.signedUrl,
        method: "PUT",
        expiresAt,
        headers: {
          "Content-Type": options.contentType,
        },
      };
    },

    async download(key) {
      const { data, error } = await storage.download(key);

      if (error) {
        if (error.message.includes("not found")) {
          throw new FileNotFoundError(key, error);
        }
        throw new Error(`Failed to download from Supabase: ${error.message}`);
      }

      if (!data) {
        throw new FileNotFoundError(key);
      }

      return Buffer.from(await data.arrayBuffer());
    },

    async delete(key) {
      const { error } = await storage.remove([key]);

      if (error) {
        throw new Error(`Failed to delete from Supabase: ${error.message}`);
      }
    },

    async exists(key) {
      try {
        const { data, error } = await storage.list(
          path.posix.dirname(key),
          {
            limit: 1,
            search: path.posix.basename(key),
          },
        );

        if (error) return false;
        return data && data.length > 0;
      } catch {
        return false;
      }
    },

    async getMetadata(key) {
      try {
        const { data, error } = await storage.list(
          path.posix.dirname(key),
          {
            limit: 1,
            search: path.posix.basename(key),
          },
        );

        if (error || !data || data.length === 0) {
          return null;
        }

        const file = data[0];
        return {
          key,
          filename: file.name,
          contentType: file.metadata?.mimetype || "application/octet-stream",
          size: file.metadata?.size || 0,
          uploadedAt: file.created_at ? new Date(file.created_at) : undefined,
        };
      } catch {
        return null;
      }
    },

    async getSourceUrl(key) {
      try {
        const { data } = storage.getPublicUrl(key);
        return data.publicUrl;
      } catch {
        return null;
      }
    },

    async getDownloadUrl(key) {
      try {
        const { data } = storage.getPublicUrl(key);
        return data.publicUrl;
      } catch {
        return null;
      }
    },
  } satisfies FileStorage;
};
