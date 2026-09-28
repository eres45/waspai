/**
 * Zero-dependency atomic file replacement and writer coordination.
 * Adapted from DeepSeek Harness (@deepseek-ai/dsh-atomic-write).
 *
 * `writeFileAtomic` writes a random-suffix sibling with exclusive create and
 * the caller's permission bits, then renames it over the target, so readers
 * observe either the old or the new complete content and a replaced file ends
 * up with exactly the stated mode.
 *
 * `withFileLock` serializes writers of one file through a `wx`-created `<file>.lock` sibling.
 */

import { randomBytes } from "node:crypto";
import { lstat, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const WINDOWS_TRANSIENT_RENAME_ERRORS: ReadonlySet<string> = new Set([
  "EACCES",
  "EBUSY",
  "EPERM",
]);
const WINDOWS_RENAME_RETRY_INITIAL_MS = 20;
const WINDOWS_RENAME_RETRY_MAX_MS = 200;
const WINDOWS_RENAME_RETRY_LIMIT = 8;

function isTransientWindowsRenameError(error: unknown): boolean {
  if (process.platform !== "win32") return false;
  return WINDOWS_TRANSIENT_RENAME_ERRORS.has(
    (error as NodeJS.ErrnoException | null)?.code ?? "",
  );
}

async function renameAtomicTemp(temp: string, filename: string): Promise<void> {
  let delay = WINDOWS_RENAME_RETRY_INITIAL_MS;
  for (let retries = 0; ; retries += 1) {
    try {
      await rename(temp, filename);
      return;
    } catch (error) {
      if (!isTransientWindowsRenameError(error)) throw error;
      if (retries >= WINDOWS_RENAME_RETRY_LIMIT) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, WINDOWS_RENAME_RETRY_MAX_MS);
  }
}

export interface WriteFileAtomicOptions {
  mode?: number;
  dirMode?: number;
}

export async function writeFileAtomic(
  filename: string,
  content: string | Buffer,
  options: WriteFileAtomicOptions = {},
): Promise<void> {
  await mkdir(dirname(filename), {
    recursive: true,
    ...(options.dirMode !== undefined ? { mode: options.dirMode } : {}),
  });

  const temp = `${filename}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    await writeFile(temp, content, {
      mode: options.mode ?? 0o666,
      flag: "wx",
    });
    await renameAtomicTemp(temp, filename);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

async function isLockContention(
  error: unknown,
  lockPath: string,
): Promise<boolean> {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  if (code === "EEXIST") return true;
  if (code !== "EPERM") return false;
  try {
    await lstat(lockPath);
    return true;
  } catch {
    return false;
  }
}

const LOCK_RETRY_INITIAL_MS = 20;
const LOCK_RETRY_MAX_MS = 200;
const DEFAULT_LOCK_WAIT_MS = 2_000;

export interface FileLockOptions {
  waitMs?: number;
}

export async function withFileLock<T>(
  filename: string,
  operation: () => Promise<T>,
  options?: FileLockOptions,
): Promise<T> {
  const lockPath = `${filename}.lock`;
  const deadline = Date.now() + (options?.waitMs ?? DEFAULT_LOCK_WAIT_MS);
  let delay = LOCK_RETRY_INITIAL_MS;

  for (;;) {
    try {
      await writeFile(lockPath, `${process.pid}\n`, {
        mode: 0o600,
        flag: "wx",
      });
      break;
    } catch (error) {
      if (!(await isLockContention(error, lockPath))) throw error;
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `atomic-write: timed out waiting for writer lock at ${lockPath}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, LOCK_RETRY_MAX_MS);
  }

  try {
    return await operation();
  } finally {
    await rm(lockPath, { force: true }).catch(() => {});
  }
}
