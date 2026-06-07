import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverFileStorage } from "lib/file-storage";

// Mock mammoth to avoid docx zip parsing errors
vi.mock("mammoth", () => {
  return {
    extractRawText: vi
      .fn()
      .mockResolvedValue({ value: "Sample text from Word file" }),
  };
});

// Mock jspdf
vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => {
      return {
        internal: {
          pageSize: {
            height: 297,
            width: 210,
          },
        },
        setFont: vi.fn(),
        setFontSize: vi.fn(),
        text: vi.fn(),
        splitTextToSize: vi
          .fn()
          .mockReturnValue(["Sample text from Word file"]),
        addPage: vi.fn(),
        output: vi.fn().mockReturnValue(new ArrayBuffer(123)),
      };
    }),
  };
});

import { fileConverterTool } from "./file-converter";

describe("File Converter Tool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Spy on upload and mock its implementation
    vi.spyOn(serverFileStorage, "upload").mockResolvedValue({
      key: "test-key",
      sourceUrl: "https://example.com/test-converted-file",
      metadata: {
        key: "test-key",
        filename: "converted-mydoc.pdf",
        contentType: "application/pdf",
        size: 123,
      },
    });
  });

  it("converts a DOCX file to PDF successfully", async () => {
    // Mock global fetch to download a dummy buffer
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(50),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await (fileConverterTool.execute as any)(
      {
        fileUrl: "https://example.com/mydoc.docx",
        targetFormat: "pdf",
        filename: "converted-mydoc",
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );

    expect(result.success).toBe(true);
    expect(result.sourceFilename).toBe("mydoc.docx");
    expect(result.sourceType).toBe("docx");
    expect(result.targetFilename).toBe("converted-mydoc.pdf");
    expect(result.targetType).toBe("pdf");
    expect(result.downloadUrl).toBe("https://example.com/test-converted-file");
    expect(result.size).toBe(123);
  });
});
