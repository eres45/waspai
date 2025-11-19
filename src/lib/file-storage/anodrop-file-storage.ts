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

export const createAnodropFileStorage = (): FileStorage => {
  const anodropKey = required("ANODROP_API_KEY", process.env.ANODROP_API_KEY);
  const anodropUrl = process.env.ANODROP_API_URL || "https://anondrop.net";

  return {
    async upload(content, options: UploadOptions = {}) {
      const buffer = await toBuffer(content);
      const filename = options.filename ?? "file";
      const key = buildKey(filename);

      try {
        // Ensure filename has proper extension based on contentType
        let finalFilename = filename;
        if (
          options.contentType === "application/pdf" &&
          !filename.endsWith(".pdf")
        ) {
          finalFilename = `${filename}.pdf`;
        } else if (
          options.contentType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
          !filename.endsWith(".docx")
        ) {
          finalFilename = `${filename}.docx`;
        } else if (
          options.contentType === "text/csv" &&
          !filename.endsWith(".csv")
        ) {
          finalFilename = `${filename}.csv`;
        } else if (
          options.contentType === "text/plain" &&
          !filename.endsWith(".txt")
        ) {
          finalFilename = `${filename}.txt`;
        }

        // Create FormData for AnoDrop API
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(buffer)], {
          type: options.contentType || "application/octet-stream",
        });
        formData.append("file", blob, finalFilename);

        // Upload to AnoDrop
        const uploadUrl = `${anodropUrl}/upload?key=${anodropKey}`;
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("AnoDrop upload error:", error);
          throw new Error(`AnoDrop upload failed: ${response.status}`);
        }

        // Parse response to get file ID
        const responseText = await response.text();
        // AnoDrop returns HTML, we need to extract the file ID from the response
        // The response typically contains a link like /FILE_ID
        const fileIdMatch = responseText.match(/\/([a-zA-Z0-9]+)/);
        const fileId = fileIdMatch ? fileIdMatch[1] : null;

        if (!fileId) {
          throw new Error("Failed to extract file ID from AnoDrop response");
        }

        const sourceUrl = `${anodropUrl}/${fileId}`;

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
        console.error("AnoDrop upload exception:", err);
        throw new Error(
          `Failed to upload to AnoDrop: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },

    async createUploadUrl(
      _options: UploadUrlOptions,
    ): Promise<UploadUrl | null> {
      // AnoDrop doesn't support presigned URLs, return null to use direct upload
      return null;
    },

    async download(key) {
      // AnoDrop files are public, just return the URL
      throw new FileNotFoundError(
        key,
        new Error("Download not supported for AnoDrop"),
      );
    },

    async delete(key) {
      // AnoDrop supports delete via API
      try {
        const fileId = key.split("/").pop();
        if (!fileId) return;

        const anodropKey = process.env.ANODROP_API_KEY;
        const anodropUrl =
          process.env.ANODROP_API_URL || "https://anondrop.net";

        const deleteUrl = `${anodropUrl}/delete/${fileId}?key=${anodropKey}`;
        await fetch(deleteUrl, { method: "POST" });
      } catch (err) {
        console.warn(`Delete failed for AnoDrop key: ${key}`, err);
      }
    },

    async exists(_key) {
      // Can't check existence without direct access
      return false;
    },

    async getMetadata(_key) {
      // Can't get metadata from AnoDrop
      return null;
    },

    async getSourceUrl(_key) {
      // AnoDrop URLs are already public
      return null;
    },

    async getDownloadUrl(_key) {
      // AnoDrop URLs are already public
      return null;
    },
  } satisfies FileStorage;
};
