"use server";

import { siteRepository } from "lib/db/repository";
import { getSession } from "auth/server";

async function getUserIdAndVerifySite(siteId: string) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized: User not found");
  }
  const site = await siteRepository.getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  if (site.authorId !== userId) {
    throw new Error("Unauthorized: You do not own this site");
  }
  return userId;
}

export async function saveSiteFileAction(
  siteId: string,
  path: string,
  content: string,
) {
  await getUserIdAndVerifySite(siteId);

  // Upsert the file
  await siteRepository.upsertSiteFiles(siteId, [{ path, content }]);

  // If path is index.html, update the parent deployed_site record htmlContent too
  if (path === "index.html" || path === "/index.html") {
    await siteRepository.updateSiteHtmlContent(siteId, content);
  }

  return { success: true };
}

export async function createSiteFileAction(
  siteId: string,
  path: string,
  content: string,
) {
  await getUserIdAndVerifySite(siteId);

  // Validate the path. It should be non-empty and clean.
  const cleanPath = path.trim().replace(/^\/+/, ""); // strip leading slashes
  if (!cleanPath) {
    throw new Error("File path cannot be empty");
  }

  // Check if file already exists
  const existing = await siteRepository.getSiteFileByPath(siteId, cleanPath);
  if (existing) {
    throw new Error(`File at "${cleanPath}" already exists`);
  }

  await siteRepository.upsertSiteFiles(siteId, [{ path: cleanPath, content }]);

  if (cleanPath === "index.html") {
    await siteRepository.updateSiteHtmlContent(siteId, content);
  }

  return { success: true, cleanPath };
}

export async function deleteSiteFileAction(siteId: string, path: string) {
  await getUserIdAndVerifySite(siteId);

  // Do not allow deleting index.html
  if (path === "index.html" || path === "/index.html") {
    throw new Error(
      "Cannot delete index.html. The main entry file is required.",
    );
  }

  const success = await siteRepository.deleteSiteFile(siteId, path);
  if (!success) {
    throw new Error("Failed to delete file");
  }

  return { success: true };
}
