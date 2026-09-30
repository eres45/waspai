import { describe, it, expect, afterEach } from "vitest";
import { applySpillPolicy, defaultSpillStore } from "./spill-policy";
import { readSpillSliceTool } from "../tools/spill-tools";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Spill Policy & Spill Tools (DeepSeek Harness)", () => {
  const customSpillRoot = join(tmpdir(), `dsh-spill-test-${Date.now()}`);

  afterEach(async () => {
    await rm(customSpillRoot, { recursive: true, force: true }).catch(() => {});
  });

  it("leaves outputs below maxInlineBytes untouched", async () => {
    const smallOutput = "Short normal output";
    const res = await applySpillPolicy("web-search", smallOutput, {
      maxInlineBytes: 1000,
      spillRoot: customSpillRoot,
    });
    expect(res).toBe(smallOutput);
  });

  it("spills oversized string output to disk and returns bounded preview with locator", async () => {
    const largeOutput = "LINE_START\n" + "A".repeat(5000) + "\nLINE_END";
    const res = await applySpillPolicy("web-scrape", largeOutput, {
      maxInlineBytes: 1000,
      spillRoot: customSpillRoot,
      sessionId: "test-session",
    });

    expect(typeof res).toBe("string");
    expect(res).toContain("[... SPILL OVERFLOW:");
    expect(res).toContain("Full formatted result");
    expect(res).toContain("read_spill_slice");
    expect(res).toContain("LINE_START");
    expect(res).toContain("LINE_END");
  });

  it("spills oversized JSON object output and returns structured spill envelope", async () => {
    const largeObject = {
      items: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        data: "test data",
      })),
    };
    const res = await applySpillPolicy("db-query", largeObject, {
      maxInlineBytes: 1000,
      spillRoot: customSpillRoot,
      sessionId: "test-session",
    });

    expect(res._spilled).toBe(true);
    expect(res.locator).toBeDefined();
    expect(res.preview).toContain("[... SPILL OVERFLOW:");
  });

  it("readSpillSliceTool reads lines on demand from spilled file", async () => {
    const lines = Array.from({ length: 200 }, (_, i) => `Line ${i + 1}`).join(
      "\n",
    );
    const spillRef = await defaultSpillStore.saveSpill(
      "test-session",
      "test-tool",
      lines,
    );

    const sliceResult = (await (readSpillSliceTool as any).execute({
      locator: spillRef.locator,
      startLine: 10,
      lineCount: 5,
    })) as any;

    expect(sliceResult.startLine).toBe(10);
    expect(sliceResult.endLine).toBe(14);
    expect(sliceResult.totalLines).toBe(200);
    expect(sliceResult.content).toBe(
      "Line 10\nLine 11\nLine 12\nLine 13\nLine 14",
    );
  });

  it("never spills site/file authoring tools even if they exceed maxInlineBytes", async () => {
    const largeCode = "<div>" + "Hello World ".repeat(10000) + "</div>";
    const readSiteRes = await applySpillPolicy(
      "read_site_file",
      { success: true, path: "index.html", content: largeCode },
      { maxInlineBytes: 1000, spillRoot: customSpillRoot },
    );
    expect(readSiteRes._spilled).toBeUndefined();
    expect(readSiteRes.content).toBe(largeCode);

    const readFileRes = await applySpillPolicy(
      "read_file",
      { success: true, path: "index.html", content: largeCode },
      { maxInlineBytes: 1000, spillRoot: customSpillRoot },
    );
    expect(readFileRes._spilled).toBeUndefined();
    expect(readFileRes.content).toBe(largeCode);

    const editSiteRes = await applySpillPolicy(
      "edit_site_file",
      { success: true, path: "index.html", content: largeCode },
      { maxInlineBytes: 1000, spillRoot: customSpillRoot },
    );
    expect(editSiteRes._spilled).toBeUndefined();
    expect(editSiteRes.content).toBe(largeCode);
  });
});
