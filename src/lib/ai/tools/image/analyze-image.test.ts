import { describe, it, expect, vi } from "vitest";
import { analyzeImageTool } from "./analyze-image";

// Mock the ocr-service dependencies to isolate tool behavior
vi.mock("@/lib/ocr/ocr-service", () => {
  return {
    getImageData: vi.fn().mockImplementation((url: string) => {
      if (url === "invalid-url") return null;
      return new Uint8Array([1, 2, 3]);
    }),
    extractTextFromImageViaAI: vi
      .fn()
      .mockImplementation((_url: string, _data: any, prompt?: string) => {
        if (prompt) {
          return `Custom Prompt response: ${prompt}`;
        }
        return "Default detailed visual description and OCR text.";
      }),
  };
});

describe("Analyze Image Tool", () => {
  it("analyzes an image successfully (happy path)", async () => {
    const result = await (analyzeImageTool.execute as any)(
      {
        imageUrl: "https://example.com/image.png",
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );

    expect(result.success).toBe(true);
    expect(result.analysis).toBe(
      "Default detailed visual description and OCR text.",
    );
    expect(result.guide).toContain(
      "Successfully analyzed image using Groq Vision",
    );
  });

  it("applies a custom prompt successfully", async () => {
    const result = await (analyzeImageTool.execute as any)(
      {
        imageUrl: "https://example.com/image.png",
        prompt: "Transcribe the handwriting",
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );

    expect(result.success).toBe(true);
    expect(result.analysis).toBe(
      "Custom Prompt response: Transcribe the handwriting",
    );
  });

  it("handles image download failures gracefully (failure mode)", async () => {
    const result = await (analyzeImageTool.execute as any)(
      {
        imageUrl: "invalid-url",
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Failed to download or parse image data from the provided URL.",
    );
  });
});
