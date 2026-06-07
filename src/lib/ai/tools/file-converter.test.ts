import { describe, it, expect, vi, beforeEach } from "vitest";
import { serverFileStorage } from "lib/file-storage";

// Mock mammoth to avoid docx zip parsing errors and vi.fn() reset issues
vi.mock("mammoth", () => {
  return {
    extractRawText: () =>
      Promise.resolve({ value: "Sample text from Word file" }),
  };
});

// Mock jspdf
vi.mock("jspdf", () => {
  return {
    jsPDF: function () {
      return {
        internal: {
          pageSize: {
            height: 297,
            width: 210,
          },
        },
        setFont: () => {},
        setFontSize: () => {},
        text: () => {},
        splitTextToSize: () => ["Sample text from Word file"],
        addPage: () => {},
        output: () => new ArrayBuffer(123),
      };
    },
  };
});

// Mock pdf-parse-fork returning default export
vi.mock("pdf-parse-fork", () => {
  return {
    default: () => Promise.resolve({ text: "Mock PDF content" }),
  };
});

// Mock docx to avoid errors
vi.mock("docx", () => {
  return {
    Document: function () {
      return {};
    },
    Packer: {
      toBuffer: () => Promise.resolve(Buffer.from("docx buffer")),
    },
    Paragraph: function () {
      return {};
    },
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

  it("converts a file with no extension in the URL using MIME type detection", async () => {
    // Mock global fetch to return content-type headers
    const mockHeaders = new Headers();
    mockHeaders.set(
      "content-type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: mockHeaders,
      arrayBuffer: async () => new ArrayBuffer(50),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await (fileConverterTool.execute as any)(
      {
        fileUrl: "https://example.com/api/storage/file/BQACAGUAAAYEGAATTT",
        targetFormat: "pdf",
        filename: "converted-mydoc",
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );

    expect(result.success).toBe(true);
    expect(result.sourceFilename).toBe("BQACAGUAAAYEGAATTT");
    expect(result.sourceType).toBe("docx");
    expect(result.targetFilename).toBe("converted-mydoc.pdf");
    expect(result.targetType).toBe("pdf");
    expect(result.downloadUrl).toBe("https://example.com/test-converted-file");
  });

  it("converts a file with no extension using magic bytes detection (PDF)", async () => {
    // Create a dummy PDF buffer (starts with %PDF)
    const pdfBuffer = Buffer.from("%PDF-1.4\n...");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(), // No content-type
      arrayBuffer: async () =>
        pdfBuffer.buffer.slice(
          pdfBuffer.byteOffset,
          pdfBuffer.byteOffset + pdfBuffer.byteLength,
        ),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await (fileConverterTool.execute as any)(
      {
        fileUrl: "https://example.com/api/storage/file/BQACAGUAAAYEGAATTT",
        targetFormat: "docx",
        filename: "converted-mydoc",
      },
      {
        abortSignal: new AbortController().signal,
        messages: [],
      } as any,
    );

    expect(result.success).toBe(true);
    expect(result.sourceFilename).toBe("BQACAGUAAAYEGAATTT");
    expect(result.sourceType).toBe("pdf");
    expect(result.targetFilename).toBe("converted-mydoc.docx");
    expect(result.targetType).toBe("docx");
  });
});
