import { supabaseRest } from "../../supabase-rest";
import type { DeployedSite, SiteRepository } from "@/types/site";

function mapSiteResponse(item: any): DeployedSite {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    htmlContent: item.html_content,
    authorId: item.author_id,
    projectId: item.project_id,
    isPublic: item.is_public,
    viewCount: item.view_count,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    authorName: item.user?.name,
    authorAvatar: item.user?.image,
  };
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

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
      return "text/html; charset=utf-8";
    case "css":
      return "text/css; charset=utf-8";
    case "js":
    case "mjs":
      return "application/javascript; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "text/plain; charset=utf-8";
  }
}

function mapSiteFileResponse(item: any): DeployedSiteFile {
  return {
    id: item.id,
    siteId: item.site_id,
    path: item.path,
    content: item.content,
    mimeType: item.mime_type,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

export const siteRepositoryRest: SiteRepository = {
  async createSite(site) {
    let existingSite: any = null;

    // 1. Try finding by project_id first if provided
    if (site.projectId && site.authorId) {
      const { data } = await supabaseRest
        .from("deployed_site")
        .select("id, author_id")
        .eq("project_id", site.projectId)
        .maybeSingle();
      if (data) {
        existingSite = data;
      }
    }

    // 2. Fallback: try finding by slug
    if (!existingSite && site.slug && site.authorId) {
      const { data } = await supabaseRest
        .from("deployed_site")
        .select("id, author_id")
        .eq("slug", site.slug)
        .maybeSingle();
      if (data) {
        existingSite = data;
      }
    }

    if (existingSite && existingSite.author_id === site.authorId) {
      // Update in place
      const { data, error } = await supabaseRest
        .from("deployed_site")
        .update({
          slug: site.slug,
          title: site.title,
          description: site.description || null,
          html_content: site.htmlContent,
          project_id: site.projectId || null,
          is_public: site.isPublic !== undefined ? site.isPublic : true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSite.id)
        .select()
        .single();

      if (error) throw error;
      return mapSiteResponse(data);
    }

    // Insert new
    const { data, error } = await supabaseRest
      .from("deployed_site")
      .insert({
        slug: site.slug,
        title: site.title,
        description: site.description || null,
        html_content: site.htmlContent,
        author_id: site.authorId || null,
        project_id: site.projectId || null,
        is_public: site.isPublic !== undefined ? site.isPublic : true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapSiteResponse(data);
  },

  async getSiteBySlug(slug) {
    const { data, error } = await supabaseRest
      .from("deployed_site")
      .select("*, user:author_id(name, image)")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return mapSiteResponse(data);
  },

  async listSitesByUser(userId) {
    const { data, error } = await supabaseRest
      .from("deployed_site")
      .select("*, user:author_id(name, image)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapSiteResponse);
  },

  async deleteSite(id, userId) {
    const { error } = await supabaseRest
      .from("deployed_site")
      .delete()
      .eq("id", id)
      .eq("author_id", userId);

    return !error;
  },

  async incrementViewCount(slug) {
    const { data: existing } = await supabaseRest
      .from("deployed_site")
      .select("id, view_count")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      await supabaseRest
        .from("deployed_site")
        .update({ view_count: (existing.view_count || 0) + 1 })
        .eq("id", existing.id);
    }
  },

  async getSiteById(id) {
    const { data, error } = await supabaseRest
      .from("deployed_site")
      .select("*, user:author_id(name, image)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return mapSiteResponse(data);
  },

  async getSiteByProjectId(projectId) {
    const { data, error } = await supabaseRest
      .from("deployed_site")
      .select("*, user:author_id(name, image)")
      .eq("project_id", projectId)
      .maybeSingle();

    if (error || !data) return null;
    return mapSiteResponse(data);
  },

  async upsertSiteFiles(siteId, files) {
    for (const file of files) {
      const cleanPath = file.path.replace(/^\/+/, "");
      const mime = file.mimeType || getMimeType(cleanPath);

      const { data: existingFile } = await supabaseRest
        .from("deployed_site_file")
        .select("id")
        .eq("site_id", siteId)
        .eq("path", cleanPath)
        .maybeSingle();

      if (existingFile) {
        const { error } = await supabaseRest
          .from("deployed_site_file")
          .update({
            content: file.content,
            mime_type: mime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingFile.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseRest.from("deployed_site_file").insert({
          site_id: siteId,
          path: cleanPath,
          content: file.content,
          mime_type: mime,
        });
        if (error) throw error;
      }
    }
  },

  async getSiteFiles(siteId) {
    const { data, error } = await supabaseRest
      .from("deployed_site_file")
      .select("*")
      .eq("site_id", siteId)
      .order("path", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSiteFileResponse);
  },

  async getSiteFileByPath(siteId, path) {
    const cleanPath = path.replace(/^\/+/, "");
    const { data, error } = await supabaseRest
      .from("deployed_site_file")
      .select("*")
      .eq("site_id", siteId)
      .eq("path", cleanPath)
      .maybeSingle();

    if (error || !data) return null;
    return mapSiteFileResponse(data);
  },

  async updateSiteHtmlContent(id, htmlContent) {
    const { error } = await supabaseRest
      .from("deployed_site")
      .update({
        html_content: htmlContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
  },

  async deleteSiteFile(siteId, path) {
    const cleanPath = path.replace(/^\/+/, "");
    const { error } = await supabaseRest
      .from("deployed_site_file")
      .delete()
      .eq("site_id", siteId)
      .eq("path", cleanPath);
    return !error;
  },
};
