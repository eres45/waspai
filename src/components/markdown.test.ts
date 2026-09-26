import { describe, it, expect } from "vitest";
import { normalizeMarkdownCitations } from "./markdown";

describe("normalizeMarkdownCitations", () => {
  it("sanitizes hallucinated internal storage worker URLs into safe local download anchors", () => {
    const input =
      "Here is your file: [Download](https://wasp-storage-worker.waspproxy.workers.dev/file/placeholder/ai_internship_schedule.csv?mime=text%2Fcsv)";
    const result = normalizeMarkdownCitations(input);
    expect(result).not.toContain("wasp-storage-worker.waspproxy.workers.dev");
    expect(result).not.toContain("placeholder");
    expect(result).toContain("#download-ai_internship_schedule.csv");
  });

  it("handles generic workers.dev download links", () => {
    const input =
      "Check out [data.csv](https://storage-bridge.llamai.workers.dev/file/data.csv)";
    const result = normalizeMarkdownCitations(input);
    expect(result).not.toContain("llamai.workers.dev");
    expect(result).toContain("#download-data.csv");
  });

  it("correctly normalizes CJK citation brackets", () => {
    const input = "According to 【Bloomberg】(https://bloomberg.com)";
    const result = normalizeMarkdownCitations(input);
    expect(result).toContain("[Bloomberg](https://bloomberg.com)");
  });

  it("preserves legitimate external web URLs", () => {
    const input = "Visit [Google](https://google.com) for more info.";
    const result = normalizeMarkdownCitations(input);
    expect(result).toBe("Visit [Google](https://google.com) for more info.");
  });
});
