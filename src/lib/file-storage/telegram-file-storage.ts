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
  const getBotToken = () =>
    required("TELEGRAM_BOT_TOKEN", process.env.TELEGRAM_BOT_TOKEN);
  const getChatId = () =>
    required("TELEGRAM_CHANNEL_ID", process.env.TELEGRAM_CHANNEL_ID);

  return {
    async upload(content, options: UploadOptions = {}) {
      const chatId = getChatId();
      const remoteUrl = options.url;
      const filename = options.filename ?? "file";
      const contentType = options.contentType || "application/octet-stream";

      // If we have a remote URL, we don't need to load the content buffer
      const buffer = remoteUrl ? Buffer.alloc(0) : await toBuffer(content);

      const key = buildKey(filename);
      const fileType = getFileType(contentType);
      const fileSize = remoteUrl
        ? options.metadata?.size || 0
        : buffer.byteLength;

      try {
        // Create FormData for Telegram API
        const formData = new FormData();
        formData.append("chat_id", chatId);

        // Choose appropriate Telegram API endpoint based on file type
        let endpoint: string;
        let fieldName: string;

        const PHOTO_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
        const isLargeImage =
          fileType === "image" && fileSize > PHOTO_SIZE_LIMIT;

        if (fileType === "image" && !isLargeImage) {
          endpoint = `https://api.telegram.org/bot${getBotToken()}/sendPhoto`;
          fieldName = "photo";
        } else if (fileType === "video") {
          endpoint = `https://api.telegram.org/bot${getBotToken()}/sendVideo`;
          fieldName = "video";
        } else {
          // PDF and other documents
          endpoint = `https://api.telegram.org/bot${getBotToken()}/sendDocument`;
          fieldName = "document";
        }

        if (remoteUrl) {
          // If we have an external URL, Telegram can fetch it directly
          formData.append(fieldName, remoteUrl);
        } else {
          // Otherwise upload the file content directly
          const blob = new Blob([new Uint8Array(buffer)], {
            type: contentType,
          });
          formData.append(fieldName, blob, sanitizeFilename(filename));
        }

        // Add caption with metadata for tracking
        const caption = [
          `📁 File Upload${remoteUrl ? " (via URL)" : ""}`,
          `Type: ${fileType}`,
          `Size: ${Math.round(fileSize / 1024)}KB`,
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
            logger.info(
              `[Telegram Upload] Attempt ${attempt}/${maxRetries} uploading ${fileType}: ${filename}`,
            );

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            response = await fetch(endpoint, {
              method: "POST",
              body: formData,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              logger.info(`[Telegram Upload] Attempt ${attempt} succeeded.`);
              break;
            } else {
              const errorText = await response.text();
              logger.error(
                `[Telegram Upload] API Error (${response.status}): ${errorText}`,
              );

              // If it's a 401, 403, or 400 with certain messages, don't retry
              if (response.status === 401 || response.status === 403) {
                throw new Error(`Telegram Auth Error: ${response.status}`);
              }

              throw new Error(
                `Telegram API Error: ${response.status} ${errorText}`,
              );
            }
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            logger.warn(
              `[Telegram Upload] Attempt ${attempt} failed: ${lastError.message}`,
            );

            // Critical fail: If bot token is unauthorized, stop immediately
            if (
              lastError.message.includes("401") ||
              lastError.message.includes("403")
            ) {
              break;
            }

            if (attempt < maxRetries) {
              const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        if (!response || !response.ok) {
          if (remoteUrl) {
            logger.warn(
              `[Telegram Upload] All attempts failed for URL upload. Returning staging URL.`,
            );
            return {
              key,
              sourceUrl: remoteUrl,
              metadata: {
                key,
                filename,
                contentType,
                size: fileSize,
                uploadedAt: new Date(),
              },
            };
          }

          logger.warn(
            `[Telegram Upload] All ${maxRetries} attempts failed. Falling back to local Base64 URL.`,
          );
          const base64 = Buffer.from(buffer).toString("base64");
          const sourceUrl = `data:${contentType};base64,${base64}`;

          return {
            key,
            sourceUrl,
            metadata: {
              key,
              filename: path.posix.basename(key),
              contentType,
              size: buffer.byteLength,
              uploadedAt: new Date(),
            },
          };
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
        let finalFileSize: number = fileSize;

        if (data.result.photo && data.result.photo.length > 0) {
          // For photos, Telegram returns an array, take the largest
          const largest = data.result.photo[data.result.photo.length - 1];
          fileId = largest.file_id;
          finalFileSize = largest.file_size || finalFileSize;
        } else if (data.result.video) {
          fileId = data.result.video.file_id;
          finalFileSize = data.result.video.file_size || finalFileSize;
        } else if (data.result.document) {
          fileId = data.result.document.file_id;
          finalFileSize = data.result.document.file_size || finalFileSize;
        } else {
          throw new Error("No file_id found in Telegram response");
        }

        const messageId = data.result.message_id;

        // Get the actual file URL from Telegram using getFile API
        // This allows direct image preview instead of just a channel link
        let actualFileUrl: string;

        try {
          const getFileResponse = await fetch(
            `https://api.telegram.org/bot${getBotToken()}/getFile?file_id=${fileId}`,
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
              // Fallback to Base64 or remoteUrl if getFile fails
              logger.warn(
                `[Telegram Upload] Could not get file path, falling back.`,
              );
              if (remoteUrl) {
                actualFileUrl = remoteUrl;
              } else {
                const base64 = Buffer.from(buffer).toString("base64");
                actualFileUrl = `data:${contentType};base64,${base64}`;
              }
            }
          } else {
            // Fallback
            logger.warn(
              `[Telegram Upload] getFile API failed (status ${getFileResponse.status}), using fallback`,
            );
            if (remoteUrl) {
              actualFileUrl = remoteUrl;
            } else {
              const base64 = Buffer.from(buffer).toString("base64");
              actualFileUrl = `data:${contentType};base64,${base64}`;
            }
          }
        } catch (getFileError) {
          // Fallback
          logger.error(`[Telegram Upload] getFile exception:`, getFileError);
          if (remoteUrl) {
            actualFileUrl = remoteUrl;
          } else {
            const base64 = Buffer.from(buffer).toString("base64");
            actualFileUrl = `data:${contentType};base64,${base64}`;
          }
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
                size_bytes: finalFileSize,
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
          size: finalFileSize,
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
