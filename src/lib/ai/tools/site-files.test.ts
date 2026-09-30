import { describe, it, expect } from "vitest";
import { writeSiteFileTool } from "./write-site-file";
import { readSiteFileTool } from "./read-site-file";
import { editSiteFileTool } from "./edit-site-file";
import { getCachedThreadFile } from "./site-files-cache";

describe("Site Files Tools (Write, Read, Edit)", () => {
  const testThreadId = `test-thread-${Date.now()}`;

  it("writes site file and caches it immediately in memory", async () => {
    const html =
      "<!DOCTYPE html><html><body><h1>Bakery Home</h1></body></html>";
    const writeResult = (await (writeSiteFileTool as any).execute({
      path: "index.html",
      content: html,
      threadId: testThreadId,
    })) as any;

    expect(writeResult.success).toBe(true);
    expect(writeResult.path).toBe("index.html");
    expect(writeResult.content).toBe(html);
    expect(writeResult.size).toBeGreaterThan(0);

    const cached = getCachedThreadFile(testThreadId, "index.html");
    expect(cached).not.toBeNull();
    expect(cached?.content).toBe(html);
  });

  it("reads the written site file accurately from the thread cache", async () => {
    const readResult = (await (readSiteFileTool as any).execute({
      path: "index.html",
      threadId: testThreadId,
    })) as any;

    expect(readResult.success).toBe(true);
    expect(readResult.path).toBe("index.html");
    expect(readResult.content).toContain("Bakery Home");
    expect(readResult.size).toBeGreaterThan(0);
  });

  it("edits the site file using search-and-replace and updates cache", async () => {
    const editResult = (await (editSiteFileTool as any).execute({
      path: "index.html",
      targetContent: "<h1>Bakery Home</h1>",
      replacementContent: "<h1>Artisan Bakery Home & Pastries</h1>",
      threadId: testThreadId,
    })) as any;

    expect(editResult.success).toBe(true);
    expect(editResult.content).toContain("Artisan Bakery Home & Pastries");

    // Read back after edit
    const reReadResult = (await (readSiteFileTool as any).execute({
      path: "index.html",
      threadId: testThreadId,
    })) as any;

    expect(reReadResult.success).toBe(true);
    expect(reReadResult.content).toContain("Artisan Bakery Home & Pastries");
  });
});
