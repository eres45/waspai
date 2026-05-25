export interface DeployedSite {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  htmlContent: string;
  authorId: string | null;
  projectId?: string | null;
  isPublic: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  authorName?: string;
  authorAvatar?: string;
}

export interface DeployedSiteFile {
  id: string;
  siteId: string;
  path: string;
  content: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteRepository {
  createSite(site: {
    slug: string;
    title: string;
    description?: string;
    htmlContent: string;
    authorId?: string;
    projectId?: string;
    isPublic?: boolean;
  }): Promise<DeployedSite>;

  getSiteBySlug(slug: string): Promise<DeployedSite | null>;

  listSitesByUser(userId: string): Promise<DeployedSite[]>;

  deleteSite(id: string, userId: string): Promise<boolean>;

  incrementViewCount(slug: string): Promise<void>;

  getSiteById(id: string): Promise<DeployedSite | null>;

  getSiteByProjectId(projectId: string): Promise<DeployedSite | null>;

  upsertSiteFiles(
    siteId: string,
    files: Array<{ path: string; content: string; mimeType?: string }>,
  ): Promise<void>;

  getSiteFiles(siteId: string): Promise<DeployedSiteFile[]>;

  getSiteFileByPath(
    siteId: string,
    path: string,
  ): Promise<DeployedSiteFile | null>;

  updateSiteHtmlContent(id: string, htmlContent: string): Promise<void>;

  deleteSiteFile(siteId: string, path: string): Promise<boolean>;
}
