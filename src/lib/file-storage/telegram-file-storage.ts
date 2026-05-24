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
import logger from "@/lib/logger";

const STORAGE_PREFIX = resolveStoragePrefix();

const buildKey = (filename: string) => {
  const safeName = sanitizeFilename(filename || "file");
  const id = generateUUID();
  const prefix = STORAGE_PREFIX ? `${STORAGE_PREFIX}/` : "";
  return path.posix.join(prefix, `${id}-${safeName}`);
};

const getWorkerUrl = () => {
  const url = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL;
  if (!url)
    throw new Error("Missing required env: NEXT_PUBLIC_CLOUDFLARE_WORKER_URL");
  return url.replace(/\/$/, ""); // strip trailing slash
};

const getAuthToken = () => {
  const token = process.env.CLOUDFLARE_WORKER_AUTH_TOKEN;
  if (!token)
    throw new Error("Missing required env: CLOUDFLARE_WORKER_AUTH_TOKEN");
  return token;
};

/**
 * File storage that routes all uploads through the Cloudflare Worker proxy.
 * The worker securely holds the Telegram Bot Token + Chat ID internally —
 * the Next.js server never touches those credentials directly.
 *
 * Upload:  POST {WORKER}/upload  (multipart/form-data, X-Auth-Token header)
 * Serve:   GET  {WORKER}/serve?path={file_path}
 */
export const createTelegramFileStorage = (userId?: string): FileStorage => {
  return {
    async upload(content, options: UploadOptions = {}) {
      const workerUrl = getWorkerUrl();
      const authToken = getAuthToken();
      const remoteUrl = options.url;
      const filename = options.filename ?? "file";
      const contentType = options.contentType || "application/octet-stream";

      const key = buildKey(filename);

      logger.info(
        `[CloudflareStorage] Uploading via worker: ${filename} (${contentType})`,
      );

      try {
        const formData = new FormData();
        formData.append("userId", userId || "anonymous");
        formData.append("filename", sanitizeFilename(filename));
        formData.append("contentType", contentType);

        // Determine field name for Telegram routing in the worker
        let fieldName = "document";
        if (contentType.startsWith("image/")) fieldName = "photo";
        else if (contentType.startsWith("video/")) fieldName = "video";

        if (remoteUrl) {
          // Pass the remote URL as a string — worker fetches it directly
          formData.append(fieldName, remoteUrl);
          formData.append("fileSize", String(options.metadata?.size || 0));
        } else {
          // Upload raw bytes
          const buffer = await toBuffer(content);
          const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
          formData.append(fieldName, blob, sanitizeFilename(filename));
          formData.append("fileSize", String(buffer.byteLength));
        }

        const response = await fetch(`${workerUrl}/upload`, {
          method: "POST",
          headers: {
            "X-Auth-Token": authToken,
          },
          body: formData,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(
            `Worker upload failed (${response.status}): ${errText}`,
          );
        }

        const data = (await response.json()) as {
          ok: boolean;
          file_path?: string;
          proxied_url?: string;
          result?: {
            photo?: Array<{ file_id: string; file_size: number }>;
            video?: { file_id: string; file_size: number };
            document?: { file_id: string; file_size: number };
          };
        };

        if (!data.ok) {
          throw new Error("Worker returned ok: false");
        }

        // Build the permanent serve URL via the worker's /serve endpoint
        let sourceUrl: string;
        if (data.file_path) {
          // Construct the permanent CDN URL through the worker
          sourceUrl = `${workerUrl}/serve?path=${encodeURIComponent(data.file_path)}`;
        } else if (remoteUrl) {
          // Fallback: the remote URL itself (e.g. AI-generated image URL)
          sourceUrl = remoteUrl;
        } else {
          throw new Error("Worker did not return a file_path or proxied_url");
        }

        logger.info(`[CloudflareStorage] Upload success → ${sourceUrl}`);

        const fileSize =
          data.result?.photo?.at(-1)?.file_size ||
          data.result?.video?.file_size ||
          data.result?.document?.file_size ||
          options.metadata?.size ||
          0;

        const metadata: FileMetadata = {
          key,
          filename: sanitizeFilename(filename),
          contentType,
          size: fileSize,
          uploadedAt: new Date(),
        };

        return { key, sourceUrl, metadata };
      } catch (err) {
        logger.error("[CloudflareStorage] Upload exception:", err);
        throw new Error(
          `Failed to upload via Cloudflare Worker: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },

    async createUploadUrl(
      _options: UploadUrlOptions,
    ): Promise<UploadUrl | null> {
      // Presigned URLs not supported — all uploads go through the worker
      return null;
    },

    async download(key) {
      // Files are served via worker /serve endpoint, not downloaded server-side
      throw new FileNotFoundError(
        key,
        new Error("Download not supported — use sourceUrl directly"),
      );
    },

    async delete(key) {
      // Telegram does not expose a public delete API
      logger.warn(`[CloudflareStorage] Delete not supported for key: ${key}`);
    },

    async exists(_key) {
      return false;
    },

    async getMetadata(_key) {
      return null;
    },

    async getSourceUrl(_key) {
      return null;
    },

    async getDownloadUrl(_key) {
      return null;
    },
  } satisfies FileStorage;
};
