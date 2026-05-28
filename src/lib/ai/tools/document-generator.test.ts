import { describe, it, expect, vi } from "vitest";
import {
  wordDocumentTool,
  csvGeneratorTool,
  textFileTool,
} from "./document-generator";

// Mock the file storage to avoid actual uploads during testing
vi.mock("lib/file-storage", () => {
  return {
    serverFileStorage: {
      upload: vi.fn().mockResolvedValue({
        sourceUrl: "https://example.com/test-document-upload",
      }),
    },
  };
});

describe("Document Generator Tools", () => {
  describe("Word Document Tool", () => {
    it("generates a DOCX document successfully", async () => {
      const result = await wordDocumentTool.execute(
        {
          title: "Test Report",
          content: "Line 1\nLine 2",
          filename: "test-report",
        },
        {
          abortSignal: new AbortController().signal,
          messages: [],
        } as any,
      );

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe(
        "https://example.com/test-document-upload",
      );
      expect(result.filename).toBe("test-report.docx");
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe("CSV Generator Tool", () => {
    it("generates a CSV file successfully", async () => {
      const result = await csvGeneratorTool.execute(
        {
          title: "Sales Data",
          content: "Month,Revenue\nJanuary,1000\nFebruary,1500",
          filename: "sales",
        },
        {
          abortSignal: new AbortController().signal,
          messages: [],
        } as any,
      );

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe(
        "https://example.com/test-document-upload",
      );
      expect(result.filename).toBe("sales.csv");
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe("Text File Tool", () => {
    it("generates a TXT file successfully", async () => {
      const result = await textFileTool.execute(
        {
          title: "Notes",
          content: "Remember to do groceries.",
          filename: "groceries",
        },
        {
          abortSignal: new AbortController().signal,
          messages: [],
        } as any,
      );

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe(
        "https://example.com/test-document-upload",
      );
      expect(result.filename).toBe("groceries.txt");
      expect(result.size).toBeGreaterThan(0);
    });
  });
});
