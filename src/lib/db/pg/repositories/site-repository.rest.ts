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
    isPublic: item.is_public,
    viewCount: item.view_count,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    authorName: item.user?.name,
    authorAvatar: item.user?.image,
  };
}

export const siteRepositoryRest: SiteRepository = {
  async createSite(site) {
    // If slug is provided and owned by the same user, update it in place (as per Q4)
    if (site.slug && site.authorId) {
      const { data: existingSite } = await supabaseRest
        .from("deployed_site")
        .select("id, author_id")
        .eq("slug", site.slug)
        .maybeSingle();

      if (existingSite && existingSite.author_id === site.authorId) {
        // Update in place
        const { data, error } = await supabaseRest
          .from("deployed_site")
          .update({
            title: site.title,
            description: site.description || null,
            html_content: site.htmlContent,
            is_public: site.isPublic !== undefined ? site.isPublic : true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSite.id)
          .select()
          .single();

        if (error) throw error;
        return mapSiteResponse(data);
      }
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
    // We can't do sql`view_count = view_count + 1` directly in Supabase REST without an RPC call,
    // but we can query then update, or we can use RPC if one exists.
    // Let's check if there's any existing increment RPC or similar pattern in the project.
    // In agent-repository or skill-repository, incrementInstallCount was:
    // async incrementInstallCount(skillId) { ... }
    // Let's check how incrementInstallCount is implemented in skill-repository.rest.ts.
    // Wait, let's search it or read skill-repository.rest.ts lines 380-411.
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
};
