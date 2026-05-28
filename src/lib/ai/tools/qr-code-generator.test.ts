import { describe, it, expect, vi } from "vitest";
import { qrCodeGeneratorTool } from "./qr-code-generator";

// Mock the file storage to avoid actual uploads during testing
vi.mock("lib/file-storage", () => {
  return {
    serverFileStorage: {
      upload: vi.fn().mockResolvedValue({
        sourceUrl: "https://example.com/test-qrcode.png",
      }),
    },
  };
});

describe("QR Code Generator Tool", () => {
  it("generates a QR code successfully (happy path)", async () => {
    const result = await qrCodeGeneratorTool.execute(
      {
        content: "https://wasp-ai.com",
        size: 300,
        filename: "wasp-qr",
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toBe("https://example.com/test-qrcode.png");
    expect(result.filename).toBe("wasp-qr.png");
    expect(result.qrSize).toBe(300);
    expect(result.contentEncoded).toBe("https://wasp-ai.com");
  });

  it("handles extreme sizes by adjusting them within range (100-1000)", async () => {
    const resultTooSmall = await qrCodeGeneratorTool.execute(
      {
        content: "https://wasp-ai.com",
        size: 50, // too small
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );
    expect(resultTooSmall.qrSize).toBe(100);

    const resultTooLarge = await qrCodeGeneratorTool.execute(
      {
        content: "https://wasp-ai.com",
        size: 2000, // too large
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );
    expect(resultTooLarge.qrSize).toBe(1000);
  });
});
