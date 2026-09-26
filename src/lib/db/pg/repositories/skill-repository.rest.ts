/**
 * Skill repository using Supabase REST API (production)
 */

import type {
  Skill,
  SkillRating,
  SkillRepository,
  SkillSummary,
  UserSkill,
} from "@/types/skill";
import { generateUUID } from "lib/utils";
import { supabaseRest } from "../../supabase-rest";

const mapSkill = (data: any, withContent = false): SkillSummary | Skill => {
  const base: SkillSummary = {
    id: data.id,
    name: data.name,
    title: data.title,
    description: data.description,
    category: data.category,
    tags: data.tags || [],
    authorId: data.author_id,
    isPublic: data.is_public,
    isVerified: data.is_verified,
    isFeatured: data.is_featured,
    installCount: data.install_count,
    icon: data.icon,
    toolsRequired: data.tools_required || [],
    tierRequired: data.tier_required,
    version: data.version,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    authorName: data.author?.name,
    authorAvatar: data.author?.image,
    averageRating: data.averageRating ?? undefined,
    ratingCount: data.ratingCount ?? undefined,
    isInstalled: data.isInstalled ?? false,
  };

  if (withContent) {
    return { ...base, content: data.content } as Skill;
  }
  return base;
};

export const skillRepositoryRest: SkillRepository = {
  async listSkills({
    category,
    search,
    featured,
    tierRequired,
    limit = 50,
    offset = 0,
    userId,
  }) {
    let query = supabaseRest
      .from("skill")
      .select("*")
      .eq("is_public", true)
      .neq("name", "skill-creator") // internal meta-skill, not for users
      .neq("name", "site-creator") // internal meta-skill, not for users
      .neq("name", "game-creator") // internal meta-skill, not for users
      .order("is_featured", { ascending: false })
      .order("install_count", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (featured !== undefined) query = query.eq("is_featured", featured);
    if (tierRequired) query = query.eq("tier_required", tierRequired);

    let rawSkillsData: any[] = [];

    if (search) {
      const cleanSearch = search.trim();
      const terms = cleanSearch
        .toLowerCase()
        .split(/[\s,+/_-]+/)
        .filter((t) => t.length > 1);

      let searchQuery = supabaseRest
        .from("skill")
        .select("*")
        .eq("is_public", true)
        .neq("name", "skill-creator")
        .neq("name", "site-creator")
        .neq("name", "game-creator")
        .limit(50);

      if (category) searchQuery = searchQuery.eq("category", category);
      if (featured !== undefined)
        searchQuery = searchQuery.eq("is_featured", featured);
      if (tierRequired)
        searchQuery = searchQuery.eq("tier_required", tierRequired);

      // 1. Exact phrase search
      const exactQuery = searchQuery.or(
        `title.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%,name.ilike.%${cleanSearch}%`,
      );
      const { data: exactData, error: exactError } = await exactQuery;
      if (exactError) throw exactError;
      rawSkillsData = exactData || [];

      // 2. Tokenized search fallback if fewer results than limit and multiple terms exist
      if (rawSkillsData.length < limit && terms.length > 0) {
        const orClauses = terms.flatMap((term) => [
          `name.ilike.%${term}%`,
          `title.ilike.%${term}%`,
          `description.ilike.%${term}%`,
        ]);
        let tokenQuery = supabaseRest
          .from("skill")
          .select("*")
          .eq("is_public", true)
          .neq("name", "skill-creator")
          .neq("name", "site-creator")
          .neq("name", "game-creator")
          .or(orClauses.join(","))
          .limit(50);

        if (category) tokenQuery = tokenQuery.eq("category", category);
        const { data: tokenData } = await tokenQuery;

        if (tokenData) {
          const seen = new Set(rawSkillsData.map((d: any) => d.id));
          for (const item of tokenData) {
            if (!seen.has(item.id)) {
              rawSkillsData.push(item);
              seen.add(item.id);
            }
          }
        }
      }

      // 3. Relevance ranking
      rawSkillsData.sort((a: any, b: any) => {
        let scoreA = 0;
        let scoreB = 0;
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const aTitle = (a.title || "").toLowerCase();
        const bTitle = (b.title || "").toLowerCase();
        const aDesc = (a.description || "").toLowerCase();
        const bDesc = (b.description || "").toLowerCase();

        if (
          aName === cleanSearch.toLowerCase() ||
          aTitle === cleanSearch.toLowerCase()
        )
          scoreA += 200;
        if (
          bName === cleanSearch.toLowerCase() ||
          bTitle === cleanSearch.toLowerCase()
        )
          scoreB += 200;

        for (const term of terms) {
          if (aName === term) scoreA += 100;
          if (bName === term) scoreB += 100;

          if (aName.includes(term)) scoreA += 40;
          if (bName.includes(term)) scoreB += 40;

          if (aTitle.includes(term)) scoreA += 30;
          if (bTitle.includes(term)) scoreB += 30;

          if (aDesc.includes(term)) scoreA += 10;
          if (bDesc.includes(term)) scoreB += 10;
        }

        if (a.is_featured) scoreA += 5;
        if (b.is_featured) scoreB += 5;
        scoreA += Math.min(a.install_count || 0, 50);
        scoreB += Math.min(b.install_count || 0, 50);

        return scoreB - scoreA;
      });

      rawSkillsData = rawSkillsData.slice(0, limit);
    } else {
      const { data, error } = await query;
      if (error) throw error;
      rawSkillsData = data || [];
    }

    let skills = rawSkillsData.map((d: any) => mapSkill(d)) as SkillSummary[];

    // Attach isInstalled flag if userId provided
    if (userId && skills.length > 0) {
      const skillIds = skills.map((s) => s.id);
      const { data: installs } = await supabaseRest
        .from("user_skill")
        .select("skill_id")
        .eq("user_id", userId)
        .in("skill_id", skillIds);
      const installedSet = new Set(
        (installs || []).map((i: any) => i.skill_id),
      );
      skills = skills.map((s) => ({
        ...s,
        isInstalled: installedSet.has(s.id),
      }));
    }

    return skills;
  },

  async getSkillById(id, userId) {
    const { data, error } = await supabaseRest
      .from("skill")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    // Ratings aggregate
    const { data: ratings } = await supabaseRest
      .from("skill_rating")
      .select("rating")
      .eq("skill_id", id);

    const ratingCount = ratings?.length ?? 0;
    const averageRating =
      ratingCount > 0
        ? ratings!.reduce((sum: number, r: any) => sum + r.rating, 0) /
          ratingCount
        : 0;

    let isInstalled = false;
    if (userId) {
      const { data: install } = await supabaseRest
        .from("user_skill")
        .select("id")
        .eq("user_id", userId)
        .eq("skill_id", id)
        .maybeSingle();
      isInstalled = !!install;
    }

    return mapSkill(
      { ...data, averageRating, ratingCount, isInstalled },
      true,
    ) as Skill;
  },

  async getSkillByName(name, userId) {
    const { data, error } = await supabaseRest
      .from("skill")
      .select("*")
      .eq("name", name)
      .maybeSingle();

    if (error || !data) return null;
    return this.getSkillById(data.id, userId);
  },

  async createSkill(skill) {
    const id = generateUUID();
    const { data, error } = await supabaseRest
      .from("skill")
      .insert({
        id,
        name: skill.name,
        title: skill.title,
        description: skill.description,
        content: skill.content,
        category: skill.category,
        tags: skill.tags,
        author_id: skill.authorId,
        is_public: skill.isPublic,
        is_verified: false,
        is_featured: false,
        install_count: 0,
        icon: skill.icon,
        tools_required: skill.toolsRequired,
        tier_required: skill.tierRequired,
        version: skill.version || "1.0.0",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapSkill(data, true) as Skill;
  },

  async updateSkill(id, userId, data) {
    const updateBody: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) updateBody.title = data.title;
    if (data.description !== undefined)
      updateBody.description = data.description;
    if (data.content !== undefined) updateBody.content = data.content;
    if (data.category !== undefined) updateBody.category = data.category;
    if (data.tags !== undefined) updateBody.tags = data.tags;
    if (data.icon !== undefined) updateBody.icon = data.icon;
    if (data.toolsRequired !== undefined)
      updateBody.tools_required = data.toolsRequired;
    if (data.tierRequired !== undefined)
      updateBody.tier_required = data.tierRequired;
    if (data.isPublic !== undefined) updateBody.is_public = data.isPublic;
    if (data.version !== undefined) updateBody.version = data.version;

    const { data: updated, error } = await supabaseRest
      .from("skill")
      .update(updateBody)
      .eq("id", id)
      .eq("author_id", userId)
      .select("*")
      .single();

    if (error || !updated) return null;
    return mapSkill(updated, true) as Skill;
  },

  async deleteSkill(id, userId) {
    const { error } = await supabaseRest
      .from("skill")
      .delete()
      .eq("id", id)
      .eq("author_id", userId);

    return !error;
  },

  async installSkill(userId, skillId) {
    const id = generateUUID();
    const { data, error } = await supabaseRest
      .from("user_skill")
      .upsert(
        {
          id,
          user_id: userId,
          skill_id: skillId,
          is_active: true,
          installed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,skill_id" },
      )
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      skillId: data.skill_id,
      isActive: data.is_active,
      installedAt: new Date(data.installed_at),
    };
  },

  async uninstallSkill(userId, skillId) {
    const { error } = await supabaseRest
      .from("user_skill")
      .delete()
      .eq("user_id", userId)
      .eq("skill_id", skillId);

    return !error;
  },

  async getInstalledSkills(userId) {
    // Step 1: get the user_skill rows
    const { data: userSkills, error } = await supabaseRest
      .from("user_skill")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("installed_at", { ascending: false });

    if (error) throw error;
    if (!userSkills || userSkills.length === 0) return [];

    // Step 2: fetch the skill data for each installed skill
    const skillIds = userSkills.map((us: any) => us.skill_id);
    const { data: skills } = await supabaseRest
      .from("skill")
      .select("*")
      .in("id", skillIds);

    const skillMap = new Map((skills || []).map((s: any) => [s.id, s]));

    return userSkills.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      skillId: item.skill_id,
      isActive: item.is_active,
      installedAt: new Date(item.installed_at),
      skill: skillMap.has(item.skill_id)
        ? (mapSkill(skillMap.get(item.skill_id), true) as Skill)
        : undefined,
    })) as (UserSkill & { skill: Skill })[];
  },

  async getActiveSkillContents(userId) {
    // Step 1: get active skill IDs
    const { data: userSkills, error } = await supabaseRest
      .from("user_skill")
      .select("skill_id")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error || !userSkills || userSkills.length === 0) return [];

    // Step 2: fetch skill content for those IDs
    const skillIds = userSkills.map((us: any) => us.skill_id);
    const { data: skills } = await supabaseRest
      .from("skill")
      .select("content")
      .in("id", skillIds);

    return (skills || [])
      .map((s: any) => s.content)
      .filter(Boolean) as string[];
  },

  async isInstalled(userId, skillId) {
    const { data } = await supabaseRest
      .from("user_skill")
      .select("id")
      .eq("user_id", userId)
      .eq("skill_id", skillId)
      .maybeSingle();

    return !!data;
  },

  async rateSkill(userId, skillId, rating, review) {
    const id = generateUUID();
    const { data, error } = await supabaseRest
      .from("skill_rating")
      .upsert(
        {
          id,
          user_id: userId,
          skill_id: skillId,
          rating,
          review: review ?? null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,skill_id" },
      )
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      skillId: data.skill_id,
      rating: data.rating,
      review: data.review ?? undefined,
      createdAt: new Date(data.created_at),
    };
  },

  async getSkillRatings(skillId) {
    const { data, error } = await supabaseRest
      .from("skill_rating")
      .select("*")
      .eq("skill_id", skillId)
      .order("created_at", { ascending: false });

    if (error) return [];

    return (data || []).map(
      (item: any): SkillRating => ({
        id: item.id,
        userId: item.user_id,
        skillId: item.skill_id,
        rating: item.rating,
        review: item.review ?? undefined,
        createdAt: new Date(item.created_at),
        authorName: undefined,
        authorAvatar: undefined,
      }),
    );
  },

  async getUserRating(userId, skillId) {
    const { data } = await supabaseRest
      .from("skill_rating")
      .select()
      .eq("user_id", userId)
      .eq("skill_id", skillId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      skillId: data.skill_id,
      rating: data.rating,
      review: data.review ?? undefined,
      createdAt: new Date(data.created_at),
    };
  },

  async incrementInstallCount(skillId) {
    const { data: current } = await supabaseRest
      .from("skill")
      .select("install_count")
      .eq("id", skillId)
      .single();

    await supabaseRest
      .from("skill")
      .update({ install_count: (current?.install_count ?? 0) + 1 })
      .eq("id", skillId);
  },
};
