"use server";

import { storageDriver } from "lib/file-storage";
import { IS_VERCEL_ENV } from "lib/const";

/**
 * Get storage configuration info.
 * Used by clients to determine upload strategy.
 */
export async function getStorageInfoAction() {
  return {
    type: storageDriver,
    supportsDirectUpload:
      storageDriver === "vercel-blob" || storageDriver === "s3" || storageDriver === "supabase" || storageDriver === "snapzion",
  };
}

interface StorageCheckResult {
  isValid: boolean;
  error?: string;
  solution?: string;
}

/**
 * Check if storage is properly configured.
 * Returns detailed error messages with solutions.
 */
export async function checkStorageAction(): Promise<StorageCheckResult> {
  // 1. Check Vercel Blob configuration
  if (storageDriver === "vercel-blob") {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        isValid: false,
        error: "BLOB_READ_WRITE_TOKEN is not set",
        solution:
          "Please add Vercel Blob to your project:\n" +
          "1. Go to your Vercel Dashboard\n" +
          "2. Navigate to Storage tab\n" +
          "3. Create a new Blob Store\n" +
          "4. Connect it to your project\n" +
          (IS_VERCEL_ENV
            ? "5. Redeploy your application"
            : "5. Run 'vercel env pull' to get the token locally"),
      };
    }
  }

  // 2. Check S3 configuration
  if (storageDriver === "s3") {
    const missing: string[] = [];
    if (!process.env.FILE_STORAGE_S3_BUCKET)
      missing.push("FILE_STORAGE_S3_BUCKET");
    if (!process.env.FILE_STORAGE_S3_REGION && !process.env.AWS_REGION) {
      missing.push("FILE_STORAGE_S3_REGION or AWS_REGION");
    }

    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Missing S3 configuration: ${missing.join(", ")}`,
        solution:
          "Add required env vars for S3 file storage:\n" +
          "- FILE_STORAGE_TYPE=s3\n" +
          "- FILE_STORAGE_S3_BUCKET=your-bucket\n" +
          "- FILE_STORAGE_S3_REGION=your-region (e.g., us-east-1)\n" +
          "(Optional) FILE_STORAGE_S3_PUBLIC_BASE_URL=https://cdn.example.com\n" +
          "(Optional) FILE_STORAGE_S3_ENDPOINT for S3-compatible stores (e.g., MinIO)\n" +
          "(Optional) FILE_STORAGE_S3_FORCE_PATH_STYLE=1 for path-style endpoints",
      };
    }

    // Warn if neither a public base URL nor a public bucket policy is set.
    // We can't reliably detect bucket policy here; we just pass validation.
    return { isValid: true };
  }

  // 3. Check Supabase configuration
  if (storageDriver === "supabase") {
    const missing: string[] = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
      missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      missing.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Missing Supabase configuration: ${missing.join(", ")}`,
        solution:
          "Add required env vars for Supabase file storage:\n" +
          "- FILE_STORAGE_TYPE=supabase\n" +
          "- NEXT_PUBLIC_SUPABASE_URL=your-supabase-url\n" +
          "- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n" +
          "(Optional) FILE_STORAGE_SUPABASE_BUCKET=uploads (defaults to 'uploads')",
      };
    }

    return { isValid: true };
  }

  // 4. Check Snapzion configuration
  if (storageDriver === "snapzion") {
    if (!process.env.SNAPZION_API_TOKEN) {
      return {
        isValid: false,
        error: "SNAPZION_API_TOKEN is not set",
        solution:
          "Add Snapzion API token for file uploads:\n" +
          "- FILE_STORAGE_TYPE=snapzion\n" +
          "- SNAPZION_API_TOKEN=your-api-token\n" +
          "(Optional) SNAPZION_API_URL=https://upload.snapzion.com/api/public-upload",
      };
    }

    return { isValid: true };
  }

  // 5. Validate storage driver
  if (!["vercel-blob", "s3", "supabase", "snapzion"].includes(storageDriver)) {
    return {
      isValid: false,
      error: `Invalid storage driver: ${storageDriver}`,
      solution:
        "FILE_STORAGE_TYPE must be one of:\n" +
        "- 'vercel-blob' (default)\n" +
        "- 's3'\n" +
        "- 'supabase'\n" +
        "- 'snapzion'",
    };
  }

  return {
    isValid: true,
  };
}
