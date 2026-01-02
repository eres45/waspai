import type {
  FileStorage,
  UploadOptions,
  UploadUrl,
  UploadUrlOptions,
} from "./file-storage.interface";
import { createTelegramFileStorage } from "./telegram-file-storage";
import { createVercelBlobStorage } from "./vercel-blob-storage";

/**
 * Hybrid File Storage
 * Routes uploads to appropriate provider based on file type:
 * - Images & Videos → Telegram Bot API
 * - Documents (PDF, Word, CSV, Text) → Vercel Blob (with 7-day auto-delete)
 */
export const createHybridFileStorage = (): FileStorage => {
  const telegramStorage = createTelegramFileStorage();
  const vercelBlobStorage = createVercelBlobStorage();

  const isDocumentType = (contentType?: string): boolean => {
    if (!contentType) return false;
    return (
      contentType === "application/pdf" ||
      contentType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      contentType === "text/csv" ||
      contentType === "text/plain"
    );
  };

  const isImageOrVideoType = (contentType?: string): boolean => {
    if (!contentType) return false;
    return contentType.startsWith("image/") || contentType.startsWith("video/");
  };

  return {
    async upload(content, options: UploadOptions = {}) {
      console.log(
        `Hybrid Storage: Uploading ${options.filename} with type ${options.contentType}`,
      );

      // Route to appropriate storage
      if (isDocumentType(options.contentType)) {
        console.log(
          `Hybrid Storage: Routing to Vercel Blob for document: ${options.filename}`,
        );
        // Add 7-day expiration metadata for documents
        return vercelBlobStorage.upload(content, {
          ...options,
          metadata: {
            expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
            uploadedAt: new Date().toISOString(),
          },
        });
      } else if (isImageOrVideoType(options.contentType)) {
        console.log(
          `Hybrid Storage: Routing to Telegram for media: ${options.filename}`,
        );
        return telegramStorage.upload(content, options);
      } else {
        // Default to Vercel Blob for unknown types
        console.log(
          `Hybrid Storage: Routing to Vercel Blob for unknown type: ${options.filename}`,
        );
        return vercelBlobStorage.upload(content, {
          ...options,
          metadata: {
            expiresIn: 7 * 24 * 60 * 60,
            uploadedAt: new Date().toISOString(),
          },
        });
      }
    },

    async createUploadUrl(
      options: UploadUrlOptions,
    ): Promise<UploadUrl | null> {
      // Vercel Blob supports presigned URLs
      return vercelBlobStorage.createUploadUrl?.(options) || null;
    },

    async download(key) {
      // Try Vercel Blob first (for documents), then Telegram
      try {
        return await vercelBlobStorage.download(key);
      } catch {
        return await telegramStorage.download(key);
      }
    },

    async delete(key) {
      // Try both providers
      await Promise.all([
        vercelBlobStorage.delete(key).catch(() => {}),
        telegramStorage.delete(key).catch(() => {}),
      ]);
    },

    async exists(key) {
      // Try both providers
      const [vercelBlobExists, telegramExists] = await Promise.all([
        vercelBlobStorage.exists(key).catch(() => false),
        telegramStorage.exists(key).catch(() => false),
      ]);
      return vercelBlobExists || telegramExists;
    },

    async getMetadata(key) {
      // Try both providers
      const vercelBlobMeta = await vercelBlobStorage
        .getMetadata(key)
        .catch(() => null);
      if (vercelBlobMeta) return vercelBlobMeta;

      return await telegramStorage.getMetadata(key).catch(() => null);
    },

    async getSourceUrl(key) {
      // Try both providers
      const vercelBlobUrl = await vercelBlobStorage
        .getSourceUrl(key)
        .catch(() => null);
      if (vercelBlobUrl) return vercelBlobUrl;

      return await telegramStorage.getSourceUrl(key).catch(() => null);
    },

    async getDownloadUrl(key) {
      // Try both providers
      const vercelBlobUrl = await vercelBlobStorage
        .getDownloadUrl?.(key)
        .catch(() => null);
      if (vercelBlobUrl) return vercelBlobUrl;

      return (
        (await telegramStorage.getDownloadUrl?.(key).catch(() => null)) || null
      );
    },
  } satisfies FileStorage;
};
