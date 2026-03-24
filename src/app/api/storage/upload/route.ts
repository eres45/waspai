import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { serverFileStorage, storageDriver } from "lib/file-storage";
import { checkStorageAction } from "../actions";
import {
  checkDailyUploadLimitRest,
  recordUploadRest,
} from "@/lib/upload-limiter.rest";

import { del } from "@vercel/blob";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check daily upload limit
  const uploadLimit = await checkDailyUploadLimitRest(session.user.id);
  if (!uploadLimit.allowed) {
    return NextResponse.json(
      {
        error: "Daily upload limit reached",
        message: `You have reached your daily limit of ${uploadLimit.limit} uploads. Please try again tomorrow.`,
        remaining: uploadLimit.remaining,
        limit: uploadLimit.limit,
        resetTime: uploadLimit.resetTime,
      },
      { status: 429 },
    );
  }

  // Check storage configuration first
  const storageCheck = await checkStorageAction();
  if (!storageCheck.isValid) {
    return NextResponse.json(
      {
        error: storageCheck.error,
        solution: storageCheck.solution,
        storageDriver,
      },
      { status: 500 },
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let uploadBuffer: Buffer;
    let filename: string;
    let mimeType: string;
    let stagingUrl: string | undefined;
    let stagingType: string | undefined;
    let stagingSize: number | undefined;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      uploadBuffer = Buffer.alloc(0);
      filename = body.filename || "file";
      mimeType = body.contentType || "application/octet-stream";
      stagingUrl = body.url;
      stagingType = body.stagingType;
      stagingSize = body.size;

      if (!stagingUrl) {
        return NextResponse.json(
          { error: "Staging URL is required for JSON upload" },
          { status: 400 },
        );
      }
    } else {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided. Use 'file' field in FormData." },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      uploadBuffer = Buffer.from(arrayBuffer);
      filename = file.name;
      mimeType = file.type || "application/octet-stream";
    }

    const fileSize = stagingUrl ? stagingSize || 0 : uploadBuffer.byteLength;

    // Try to upload to storage backend
    try {
      const result = await serverFileStorage.upload(uploadBuffer, {
        filename,
        contentType: mimeType,
        url: stagingUrl,
        metadata: { size: fileSize },
      });

      // Cleanup staging if successful
      if (stagingUrl && stagingType === "vercel-blob") {
        try {
          await del(stagingUrl);
          console.log(`[Upload] Deleted staging blob: ${stagingUrl}`);
        } catch (delError) {
          console.error(`[Upload] Failed to delete staging blob:`, delError);
        }
      }

      // Record upload
      await recordUploadRest(
        session.user.id,
        filename,
        result.metadata.size || fileSize,
        mimeType,
        result.sourceUrl,
      );

      return NextResponse.json({
        success: true,
        key: result.key,
        url: result.sourceUrl,
        metadata: result.metadata,
      });
    } catch (storageError) {
      console.error(
        "Storage upload failed, falling back to base64:",
        storageError,
      );

      console.log("[DEBUG] Storage Upload Staging Params:", {
        stagingUrl,
        filename,
        mimeType,
        stagingSize,
      });

      if (stagingUrl) {
        // If we were staging, we can't easily fallback to base64 here
        // because we don't have the buffer on the server.
        // Return the staging URL as a temporary source if possible,
        // or just throw.
        throw storageError;
      }

      // Fallback: Convert to base64 and return as data URL
      const base64 = uploadBuffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Record upload (base64)
      await recordUploadRest(
        session.user.id,
        filename,
        uploadBuffer.byteLength,
        mimeType,
        dataUrl,
      );

      return NextResponse.json({
        success: true,
        key: `base64-${Date.now()}`,
        url: dataUrl,
        metadata: {
          key: `base64-${Date.now()}`,
          filename,
          contentType: mimeType,
          size: uploadBuffer.byteLength,
          uploadedAt: new Date(),
        },
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error("Failed to upload file", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file" },
      { status: 500 },
    );
  }
}
