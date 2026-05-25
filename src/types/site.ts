export interface DeployedSite {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  htmlContent: string;
  authorId: string | null;
  isPublic: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  authorName?: string;
  authorAvatar?: string;
}

export interface SiteRepository {
  createSite(site: {
    slug: string;
    title: string;
    description?: string;
    htmlContent: string;
    authorId?: string;
    isPublic?: boolean;
  }): Promise<DeployedSite>;

  getSiteBySlug(slug: string): Promise<DeployedSite | null>;

  listSitesByUser(userId: string): Promise<DeployedSite[]>;

  deleteSite(id: string, userId: string): Promise<boolean>;

  incrementViewCount(slug: string): Promise<void>;
}
