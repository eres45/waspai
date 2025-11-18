import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { serverFileStorage, storageDriver } from "lib/file-storage";
import { checkStorageAction } from "../actions";
import {
  checkDailyUploadLimitRest,
  recordUploadRest,
} from "@/lib/upload-limiter.rest";

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
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use 'file' field in FormData." },
        { status: 400 },
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try to upload to storage backend
    try {
      const result = await serverFileStorage.upload(buffer, {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });

      // Record upload
      await recordUploadRest(
        session.user.id,
        file.name,
        buffer.byteLength,
        file.type || "application/octet-stream",
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

      // Fallback: Convert to base64 and return as data URL
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "application/octet-stream";
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Record upload (base64)
      await recordUploadRest(
        session.user.id,
        file.name,
        buffer.byteLength,
        mimeType,
        dataUrl,
      );

      return NextResponse.json({
        success: true,
        key: `base64-${Date.now()}`,
        url: dataUrl,
        metadata: {
          key: `base64-${Date.now()}`,
          filename: file.name,
          contentType: mimeType,
          size: buffer.byteLength,
          uploadedAt: new Date(),
        },
        fallback: true,
      });
    }
  } catch (error) {
    console.error("Failed to upload file", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
