/**
 * In-memory thread site files cache.
 * Provides immediate read-after-write consistency for website project files
 * generated or modified during a chat session.
 */

export interface CachedSiteFile {
  path: string;
  content: string;
  size: number;
  updatedAt: number;
}

const threadFilesMap = new Map<string, Map<string, CachedSiteFile>>();

function normalizePath(filePath: string): string {
  return filePath.replace(/^[./\\]+/, "").trim();
}

export function cacheThreadFile(
  threadId: string,
  filePath: string,
  content: string,
): CachedSiteFile {
  if (!threadId) {
    return {
      path: normalizePath(filePath),
      content,
      size: Buffer.byteLength(content, "utf8"),
      updatedAt: Date.now(),
    };
  }

  const cleanPath = normalizePath(filePath);
  if (!threadFilesMap.has(threadId)) {
    threadFilesMap.set(threadId, new Map());
  }

  const cached: CachedSiteFile = {
    path: cleanPath,
    content,
    size: Buffer.byteLength(content, "utf8"),
    updatedAt: Date.now(),
  };

  threadFilesMap.get(threadId)!.set(cleanPath, cached);
  return cached;
}

export function getCachedThreadFile(
  threadId: string,
  filePath: string,
): CachedSiteFile | null {
  if (!threadId) return null;
  const cleanPath = normalizePath(filePath);
  const threadMap = threadFilesMap.get(threadId);
  if (!threadMap) return null;

  // Direct match
  if (threadMap.has(cleanPath)) {
    return threadMap.get(cleanPath)!;
  }

  // Fallback case-insensitive match or basename match
  for (const [key, val] of threadMap.entries()) {
    if (
      key.toLowerCase() === cleanPath.toLowerCase() ||
      key.endsWith(`/${cleanPath}`) ||
      cleanPath.endsWith(`/${key}`)
    ) {
      return val;
    }
  }

  return null;
}

export function getAllCachedThreadFiles(threadId: string): CachedSiteFile[] {
  if (!threadId) return [];
  const threadMap = threadFilesMap.get(threadId);
  return threadMap ? Array.from(threadMap.values()) : [];
}

export function clearThreadFilesCache(threadId: string): void {
  threadFilesMap.delete(threadId);
}
