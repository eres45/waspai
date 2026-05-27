"use client";

import { useCallback, useState } from "react";
import { upload as uploadToVercelBlob } from "@vercel/blob/client";
import useSWR from "swr";
import { toast } from "sonner";
import { getStorageInfoAction } from "@/app/api/storage/actions";

// Types
interface StorageInfo {
  type:
    | "local"
    | "vercel-blob"
    | "s3"
    | "supabase"
    | "snapzion"
    | "hybrid"
    | string;
  supportsDirectUpload: boolean;
  canStageByBlob: boolean;
  cloudflareWorkerUrl?: string;
  userId?: string;
}

interface UploadOptions {
  filename?: string;
  contentType?: string;
}

interface UploadResult {
  pathname: string;
  url: string;
  contentType?: string;
  size?: number;
}

// Helpers

/**
 * Hook for uploading files to storage.
 *
 * Automatically uses the optimal upload method based on storage backend:
 * - Vercel Blob: Direct upload from browser (fast)
 * - S3: Presigned URL (future)
 * - Local FS: Server upload (fallback)
 *
 * @example
 * ```tsx
 * function FileUpload() {
 *   const { upload, isUploading } = useFileUpload();
 *
 *   const handleFile = async (file: File) => {
 *     const result = await upload(file);
 *     console.log('Public URL:', result.url);
 *   };
 *
 *   return <input type="file" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />;
 * }
 * ```
 */
export function useFileUpload() {
  const { data, isLoading: isLoadingStorageInfo } = useSWR<StorageInfo>(
    "storage-info",
    getStorageInfoAction,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const storageType = data?.type;
  const supportsDirectUpload = data?.supportsDirectUpload ?? false;
  const canStageByBlob = data?.canStageByBlob ?? false;

  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (
      file: File,
      uploadOptions: UploadOptions = {},
    ): Promise<UploadResult | undefined> => {
      if (!(file instanceof File)) {
        toast.error("Upload expects a File instance");
        return;
      }

      const filename = uploadOptions.filename ?? file.name;
      const contentType =
        uploadOptions.contentType || file.type || "application/octet-stream";

      // Wait for storage info to load
      if (isLoadingStorageInfo || !storageType) {
        toast.error("Storage is still loading. Please try again.");
        return;
      }

      const cloudflareWorkerUrl = data?.cloudflareWorkerUrl;

      setIsUploading(true);
      try {
        // ALL uploads go through our Next.js API (/api/storage/upload) which
        // forwards to the Cloudflare worker server-side — no CORS issues.
        // The auth token never needs to leave the server.
        if (cloudflareWorkerUrl) {
          console.log(
            `[Upload] Routing ${file.size} byte upload through Next.js API proxy`,
          );

          const formData = new FormData();
          formData.append("file", file, filename);

          const response = await fetch("/api/storage/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(
              errorBody.error ||
                errorBody.message ||
                `Upload failed: ${response.status}`,
            );
          }

          const result = await response.json();
          return {
            pathname: result.key,
            url: result.url,
            contentType,
            size: file.size,
          };
        }

        // CASE 1: Vercel Blob direct upload (or staging for Telegram)
        const isTelegramLargeFile =
          storageType === "telegram" &&
          canStageByBlob &&
          file.size > 3 * 1024 * 1024;

        if (storageType === "vercel-blob" || isTelegramLargeFile) {
          const blob = await uploadToVercelBlob(filename, file, {
            access: "public",
            handleUploadUrl: "/api/storage/upload-url",
            contentType,
          });

          if (isTelegramLargeFile) {
            // Tell the server to ingest this URL into Telegram
            const serverUploadResponse = await fetch("/api/storage/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: blob.url,
                filename,
                contentType,
                size: file.size,
                stagingType: "vercel-blob",
              }),
            });

            if (!serverUploadResponse.ok) {
              const errorBody = await serverUploadResponse
                .json()
                .catch(() => ({}));
              const errorMessage =
                errorBody.error || errorBody.message || "Server staging failed";
              throw new Error(errorMessage);
            }

            const result = await serverUploadResponse.json();
            return {
              pathname: result.key,
              url: result.url,
              contentType: result.metadata?.contentType || contentType,
              size: result.metadata?.size || file.size,
            };
          }

          return {
            pathname: blob.pathname,
            url: blob.url,
            contentType: blob.contentType,
            size: file.size,
          };
        }

        // S3 or other direct upload (future)
        if (supportsDirectUpload && storageType === "s3") {
          // ...
          // Request presigned URL
          const uploadUrlResponse = await fetch("/api/storage/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, contentType }),
          });

          if (!uploadUrlResponse.ok) {
            const errorBody = await uploadUrlResponse.json().catch(() => ({}));

            // Display detailed error with solution if available
            if (errorBody.solution) {
              toast.error(errorBody.error || "Failed to get upload URL", {
                description: errorBody.solution,
                duration: 10000, // Show for 10 seconds
              });
            } else {
              toast.error(errorBody.error || "Failed to get upload URL");
            }
            return;
          }

          const uploadUrlData = await uploadUrlResponse.json();

          // Upload to presigned URL
          const uploadResponse = await fetch(uploadUrlData.url, {
            method: uploadUrlData.method || "PUT",
            headers: uploadUrlData.headers || { "Content-Type": contentType },
            body: file,
          });

          if (!uploadResponse.ok) {
            toast.error(`Upload failed: ${uploadResponse.status}`);
            return;
          }

          return {
            pathname: uploadUrlData.key,
            // Use server-provided public source URL (not the presigned PUT URL)
            url: uploadUrlData.sourceUrl ?? uploadUrlData.url,
            contentType,
            size: file.size,
          };
        }

        // CASE 1: Fallback: Standard server upload
        if (storageType === "telegram" && !cloudflareWorkerUrl) {
          console.warn(
            "[Upload] Cloudflare Worker URL not found, falling back to server upload. This will fail for files > 4.5MB.",
          );
        }

        const formData = new FormData();
        formData.append("file", file);

        const serverUploadResponse = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });

        if (!serverUploadResponse.ok) {
          const errorBody = await serverUploadResponse.json().catch(() => ({}));
          const errorMessage =
            errorBody.error || errorBody.message || "Server upload failed";

          // Display detailed error with solution if available
          if (errorBody.solution) {
            toast.error(errorMessage, {
              description: errorBody.solution,
              duration: 10000, // Show for 10 seconds
            });
          } else {
            toast.error(errorMessage);
          }
          return;
        }

        const result = await serverUploadResponse.json();

        return {
          pathname: result.key,
          url: result.url,
          contentType: result.metadata?.contentType,
          size: result.metadata?.size,
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(message);
        return;
      } finally {
        setIsUploading(false);
      }
    },
    [storageType, supportsDirectUpload, isLoadingStorageInfo],
  );

  return {
    upload,
    isUploading: isUploading || isLoadingStorageInfo,
  };
}

// Alias for backward compatibility
export const usePresignedUpload = useFileUpload;
