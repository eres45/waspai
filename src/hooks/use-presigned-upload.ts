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
  cloudflareAuthToken?: string;
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
      const cloudflareAuthToken = data?.cloudflareAuthToken;

      setIsUploading(true);
      try {
        // CASE 0: Cloudflare Worker direct upload (Primary bridge if configured)
        if (cloudflareWorkerUrl) {
          console.log(
            `[Upload] Using Cloudflare Worker for ${file.size} byte upload to ${cloudflareWorkerUrl}`,
          );

          const formData = new FormData();
          // Determine Telegram field
          const isPhoto = contentType.startsWith("image/");
          const isVideo = contentType.startsWith("video/");
          const fieldName = isPhoto ? "photo" : isVideo ? "video" : "document";

          formData.append(fieldName, file);
          formData.append("userId", data?.userId || "anonymous");
          formData.append("filename", filename);
          formData.append("fileSize", file.size.toString());

          const workerResponse = await fetch(
            `${cloudflareWorkerUrl}${cloudflareWorkerUrl.endsWith("/") ? "" : "/"}upload`,
            {
              method: "POST",
              headers: {
                "X-Auth-Token": cloudflareAuthToken || "",
              },
              body: formData,
            },
          );

          if (!workerResponse.ok) {
            const errorText = await workerResponse.text();
            throw new Error(
              `Cloudflare Worker upload failed: ${workerResponse.status} ${errorText}`,
            );
          }

          const tgResult = await workerResponse.json();
          if (!tgResult.ok) {
            throw new Error(
              `Telegram API via Worker failed: ${tgResult.description}`,
            );
          }

          // Use the proxied URL if provided by the worker
          const finalUrl =
            tgResult.proxied_url ||
            `tg://${fieldName}/${tgResult.result.message_id}`;

          const syncResponse = await fetch("/api/storage/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename,
              contentType,
              externalResult: {
                url: finalUrl,
                messageId: tgResult.result.message_id,
                size: file.size,
              },
            }),
          });

          const syncData = await syncResponse.json();
          return {
            pathname: syncData.key,
            url: syncData.url,
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
