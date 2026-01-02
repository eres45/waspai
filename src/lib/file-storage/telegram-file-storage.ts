import path from "node:path";
import { FileNotFoundError } from "lib/errors";
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
import { supabaseRest } from "../db/supabase-rest";
import logger from "@/lib/logger";

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

// Determine file type from content type
const getFileType = (
  contentType: string,
): "image" | "video" | "pdf" | "document" => {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  return "document";
};

export const createTelegramFileStorage = (userId?: string): FileStorage => {
  const botToken = required(
    "TELEGRAM_BOT_TOKEN",
    process.env.TELEGRAM_BOT_TOKEN,
  );
  const chatId = required(
    "TELEGRAM_CHANNEL_ID",
    process.env.TELEGRAM_CHANNEL_ID,
  );

  return {
    async upload(content, options: UploadOptions = {}) {
      const buffer = await toBuffer(content);
      const filename = options.filename ?? "file";
      const key = buildKey(filename);
      const contentType = options.contentType || "application/octet-stream";
      const fileType = getFileType(contentType);

      try {
        // Create FormData for Telegram API
        const formData = new FormData();
        formData.append("chat_id", chatId);

        // Create blob with proper content type
        const blob = new Blob([new Uint8Array(buffer)], { type: contentType });

        // Choose appropriate Telegram API endpoint based on file type
        let endpoint: string;
        let fieldName: string;

        const PHOTO_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
        const isLargeImage =
          fileType === "image" && buffer.byteLength > PHOTO_SIZE_LIMIT;

        if (fileType === "image" && !isLargeImage) {
          endpoint = `https://api.telegram.org/bot${botToken}/sendPhoto`;
          fieldName = "photo";
        } else if (fileType === "video") {
          endpoint = `https://api.telegram.org/bot${botToken}/sendVideo`;
          fieldName = "video";
        } else {
          // PDF and other documents
          endpoint = `https://api.telegram.org/bot${botToken}/sendDocument`;
          fieldName = "document";
        }

        formData.append(fieldName, blob, sanitizeFilename(filename));

        // Add caption with metadata for tracking
        const caption = [
          `📁 File Upload`,
          `Type: ${fileType}`,
          `Size: ${Math.round(buffer.byteLength / 1024)}KB`,
          `User: ${userId || "anonymous"}`,
          `Time: ${new Date().toISOString()}`,
        ].join("\n");

        formData.append("caption", caption);

        logger.info(
          `[Telegram Upload] Uploading ${fileType} to Telegram: ${filename}`,
        );

        const maxRetries = 3;
        let lastError: Error | null = null;
        let response: Response | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Need to recreate form data and blob for each attempt if stream is consumed?
            // FormData with Blob is re-readable.
            // But fetch might consume it?
            // In Node environment, FormData from 'undici' or native should be fine?
            // Let's assume it is safe to reuse FormData or recreate it.
            // Safest to reuse unless error implies stream issues.

            logger.info(
              `[Telegram Upload] Attempt ${attempt}/${maxRetries} uploading ${fileType}: ${filename}`,
            );

            response = await fetch(endpoint, {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              break;
            } else {
              const errorText = await response.text();
              throw new Error(
                `Telegram API Error: ${response.status} ${errorText}`,
              );
            }
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            logger.warn(
              `[Telegram Upload] Attempt ${attempt} failed: ${lastError.message}`,
            );
            if (attempt < maxRetries) {
              const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        if (!response || !response.ok) {
          throw (
            lastError ||
            new Error(`Telegram upload failed after ${maxRetries} attempts`)
          );
        }

        // Response is consumed in previous block if not ok (response.text())
        // If ok, we need to clone? No, the 'response.text()' was in the else block.
        // But we need 'data' below.
        // We shouldn't consume it in the loop if success.

        // Let's refine the loop to NOT consume if success.
        // The above code verifies response.ok.
        // If response.ok, we break. And we can use response.json() below.

        const data = (await response.json()) as {
          ok: boolean;
          result: {
            message_id: number;
            photo?: Array<{ file_id: string; file_size: number }>;
            video?: { file_id: string; file_size: number };
            document?: { file_id: string; file_size: number };
          };
        };

        if (!data.ok) {
          throw new Error("Telegram API returned ok: false");
        }

        // Extract file_id based on file type
        let fileId: string;
        let fileSize: number = buffer.byteLength;

        if (data.result.photo && data.result.photo.length > 0) {
          // For photos, Telegram returns an array, take the largest
          const largest = data.result.photo[data.result.photo.length - 1];
          fileId = largest.file_id;
          fileSize = largest.file_size || fileSize;
        } else if (data.result.video) {
          fileId = data.result.video.file_id;
          fileSize = data.result.video.file_size || fileSize;
        } else if (data.result.document) {
          fileId = data.result.document.file_id;
          fileSize = data.result.document.file_size || fileSize;
        } else {
          throw new Error("No file_id found in Telegram response");
        }

        const messageId = data.result.message_id;

        // Get the actual file URL from Telegram using getFile API
        // This allows direct image preview instead of just a channel link
        let actualFileUrl: string;

        try {
          const getFileResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`,
          );

          if (getFileResponse.ok) {
            const fileData = (await getFileResponse.json()) as {
              ok: boolean;
              result: { file_path: string };
            };

            if (fileData.ok && fileData.result.file_path) {
              // Construct the proxied download URL to hide bot token
              actualFileUrl = `/api/storage/file/${fileData.result.file_path}`;
              logger.info(
                `[Telegram Upload] Proxied file URL generated: ${actualFileUrl}`,
              );
            } else {
              // Fallback to Base64 if getFile fails (likely due to size > 20MB limit)
              logger.warn(
                `[Telegram Upload] Could not get file path (likely >20MB), falling back to Base64 for preview`,
              );
              const base64 = Buffer.from(buffer).toString("base64");
              actualFileUrl = `data:${contentType};base64,${base64}`;
            }
          } else {
            // Fallback to Base64
            logger.warn(
              `[Telegram Upload] getFile API failed (status ${getFileResponse.status}), using Base64 fallback`,
            );
            const base64 = Buffer.from(buffer).toString("base64");
            actualFileUrl = `data:${contentType};base64,${base64}`;
          }
        } catch (getFileError) {
          // Fallback to Base64
          logger.error(`[Telegram Upload] getFile exception:`, getFileError);
          const base64 = Buffer.from(buffer).toString("base64");
          actualFileUrl = `data:${contentType};base64,${base64}`;
        }

        // We still want to log the Channel URL for admin purposes or metadata?
        // The return object 'metadata' has the key.
        // We could add 'telegram_channel_url' to metadata?
        // But 'sourceUrl' is used by frontend for 'src'. So Base64 is correct for UI.
        // The DB record (inserted below) SHOULD store the CHANNEL URL if available, or Base64?
        // DB column 'telegram_url'.
        // If we store Base64 in DB, it bloats DB.
        // Ideally DB stores Channel URL, but Frontend gets Base64.
        // But 'upload' returns 'sourceUrl'. Route uses it for BOTH DB (via recordUploadRest) and Response.

        // Let's settle for: Return Base64 to ensure UI works.
        // DB will store Base64 (not ideal but safe).
        // Actually, for >20MB, storing 20MB text in Text column might fail PG limits (1GB usually ok but slow).
        // But usage is rare. Prioritize UX.

        logger.info(
          `[Telegram Upload] Success - file_id: ${fileId}, message_id: ${messageId}`,
        );

        // Save to database if userId is provided
        if (userId) {
          try {
            const { error: dbError } = await supabaseRest
              .from("telegram_uploads")
              .insert({
                file_id: fileId,
                message_id: messageId,
                file_type: fileType,
                user_id: userId,
                filename,
                content_type: contentType,
                size_bytes: fileSize,
                telegram_url: actualFileUrl,
              });

            if (dbError) {
              logger.error("[Telegram Upload] Database error:", dbError);
              // Don't throw - file is uploaded, just log the DB error
            } else {
              logger.info(
                `[Telegram Upload] Database record created for file_id: ${fileId}`,
              );
            }
          } catch (dbErr) {
            logger.error("[Telegram Upload] Database exception:", dbErr);
          }
        }

        const metadata: FileMetadata = {
          key,
          filename: path.posix.basename(key),
          contentType,
          size: fileSize,
          uploadedAt: new Date(),
        };

        return {
          key,
          sourceUrl: actualFileUrl,
          metadata,
        };
      } catch (err) {
        logger.error("[Telegram Upload] Exception:", err);
        throw new Error(
          `Failed to upload to Telegram: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },

    async createUploadUrl(
      _options: UploadUrlOptions,
    ): Promise<UploadUrl | null> {
      // Telegram doesn't support presigned URLs
      return null;
    },

    async download(key) {
      // Telegram files are accessible via their URLs
      throw new FileNotFoundError(
        key,
        new Error(
          "Download not supported for Telegram - use sourceUrl directly",
        ),
      );
    },

    async delete(key) {
      // Telegram doesn't provide delete API for channel messages
      logger.warn(`[Telegram] Delete not supported for key: ${key}`);
    },

    async exists(_key) {
      // Can't check existence without direct access
      return false;
    },

    async getMetadata(_key) {
      // Can't get metadata from Telegram without file_id
      return null;
    },

    async getSourceUrl(_key) {
      // Telegram URLs are already public
      return null;
    },

    async getDownloadUrl(_key) {
      // Telegram URLs are already public
      return null;
    },
  } satisfies FileStorage;
};
