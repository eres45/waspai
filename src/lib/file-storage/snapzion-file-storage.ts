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

export const createSnapzionFileStorage = (): FileStorage => {
  const snapzionToken = required(
    "SNAPZION_API_TOKEN",
    process.env.SNAPZION_API_TOKEN,
  );
  const snapzionUrl = process.env.SNAPZION_API_URL || "https://upload.snapzion.com/api/public-upload";

  return {
    async upload(content, options: UploadOptions = {}) {
      const buffer = await toBuffer(content);
      const filename = options.filename ?? "file";
      const key = buildKey(filename);

      try {
        // Create FormData for Snapzion API
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(buffer)], {
          type: options.contentType || "application/octet-stream",
        });
        formData.append("file", blob, filename);

        const response = await fetch(snapzionUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${snapzionToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("Snapzion upload error:", error);
          throw new Error(`Snapzion upload failed: ${response.status}`);
        }

        const data = (await response.json()) as { url: string };
        const sourceUrl = data.url;

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
      } catch (err) {
        console.error("Snapzion upload exception:", err);
        throw new Error(`Failed to upload to Snapzion: ${err instanceof Error ? err.message : String(err)}`);
      }
    },

    async createUploadUrl(options: UploadUrlOptions): Promise<UploadUrl | null> {
      // Snapzion doesn't support presigned URLs, return null to use direct upload
      return null;
    },

    async download(key) {
      // Snapzion files are public, just return the URL
      throw new FileNotFoundError(key, new Error("Download not supported for Snapzion"));
    },

    async delete(key) {
      // Snapzion doesn't provide delete API
      console.warn(`Delete not supported for Snapzion key: ${key}`);
    },

    async exists(key) {
      // Can't check existence without direct access
      return false;
    },

    async getMetadata(key) {
      // Can't get metadata from Snapzion
      return null;
    },

    async getSourceUrl(key) {
      // Snapzion URLs are already public
      return null;
    },

    async getDownloadUrl(key) {
      // Snapzion URLs are already public
      return null;
    },
  } satisfies FileStorage;
};
