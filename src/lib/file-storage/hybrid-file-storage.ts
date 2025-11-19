import type {
  FileStorage,
  UploadOptions,
  UploadUrl,
  UploadUrlOptions,
} from "./file-storage.interface";
import { createSnapzionFileStorage } from "./snapzion-file-storage";
import { createAnodropFileStorage } from "./anodrop-file-storage";

/**
 * Hybrid File Storage
 * Routes uploads to appropriate provider based on file type:
 * - Images & Videos → Snapzion
 * - Documents (PDF, Word, CSV, Text) → AnoDrop
 */
export const createHybridFileStorage = (): FileStorage => {
  const snapzionStorage = createSnapzionFileStorage();
  const anodropStorage = createAnodropFileStorage();

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
          `Hybrid Storage: Routing to AnoDrop for document: ${options.filename}`,
        );
        return anodropStorage.upload(content, options);
      } else if (isImageOrVideoType(options.contentType)) {
        console.log(
          `Hybrid Storage: Routing to Snapzion for media: ${options.filename}`,
        );
        return snapzionStorage.upload(content, options);
      } else {
        // Default to AnoDrop for unknown types
        console.log(
          `Hybrid Storage: Routing to AnoDrop for unknown type: ${options.filename}`,
        );
        return anodropStorage.upload(content, options);
      }
    },

    async createUploadUrl(
      _options: UploadUrlOptions,
    ): Promise<UploadUrl | null> {
      // Both providers don't support presigned URLs
      return null;
    },

    async download(key) {
      // Try AnoDrop first (for documents), then Snapzion
      try {
        return await anodropStorage.download(key);
      } catch {
        return await snapzionStorage.download(key);
      }
    },

    async delete(key) {
      // Try both providers
      await Promise.all([
        anodropStorage.delete(key).catch(() => {}),
        snapzionStorage.delete(key).catch(() => {}),
      ]);
    },

    async exists(key) {
      // Try both providers
      const [anodropExists, snapzionExists] = await Promise.all([
        anodropStorage.exists(key).catch(() => false),
        snapzionStorage.exists(key).catch(() => false),
      ]);
      return anodropExists || snapzionExists;
    },

    async getMetadata(key) {
      // Try both providers
      const anodropMeta = await anodropStorage
        .getMetadata(key)
        .catch(() => null);
      if (anodropMeta) return anodropMeta;

      return await snapzionStorage.getMetadata(key).catch(() => null);
    },

    async getSourceUrl(key) {
      // Try both providers
      const anodropUrl = await anodropStorage
        .getSourceUrl(key)
        .catch(() => null);
      if (anodropUrl) return anodropUrl;

      return await snapzionStorage.getSourceUrl(key).catch(() => null);
    },

    async getDownloadUrl(key) {
      // Try both providers
      const anodropUrl = await anodropStorage
        .getDownloadUrl?.(key)
        .catch(() => null);
      if (anodropUrl) return anodropUrl;

      return (
        (await snapzionStorage.getDownloadUrl?.(key).catch(() => null)) || null
      );
    },
  } satisfies FileStorage;
};
