import { describe, it, expect, afterEach } from "vitest";
import { writeFileAtomic, withFileLock } from "./atomic-write";
import { readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("writeFileAtomic & withFileLock (DeepSeek Harness)", () => {
  const testDir = join(tmpdir(), `dsh-atomic-test-${Date.now()}`);

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it("writes content atomically and creates missing parent directories", async () => {
    const target = join(testDir, "sub", "dir", "test.txt");
    await writeFileAtomic(target, "Hello DeepSeek Harness!");

    const content = await readFile(target, "utf-8");
    expect(content).toBe("Hello DeepSeek Harness!");

    const fileStat = await stat(target);
    expect(fileStat.isFile()).toBe(true);
  });

  it("overwrites existing file atomically", async () => {
    const target = join(testDir, "overwrite.txt");
    await writeFileAtomic(target, "Initial version");
    await writeFileAtomic(target, "Updated version");

    const content = await readFile(target, "utf-8");
    expect(content).toBe("Updated version");
  });

  it("serializes concurrent writers through withFileLock", async () => {
    const target = join(testDir, "counter.txt");
    await writeFileAtomic(target, "0");

    const increment = async () => {
      await withFileLock(target, async () => {
        const val = parseInt(await readFile(target, "utf-8"), 10);
        await new Promise((r) => setTimeout(r, 10)); // Simulate slow read-modify-write
        await writeFileAtomic(target, String(val + 1));
      });
    };

    await Promise.all([increment(), increment(), increment()]);

    const finalVal = await readFile(target, "utf-8");
    expect(finalVal).toBe("3");
  });
});
