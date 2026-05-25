export type SkillCategory =
  | "productivity"
  | "coding"
  | "media"
  | "writing"
  | "research"
  | "automation"
  | "other";

export type SkillTier = "free" | "pro" | "max";

export interface Skill {
  id: string;
  name: string; // unique slug e.g. "pdf-creator"
  title: string; // display name e.g. "PDF Creator"
  description: string;
  content: string; // full SKILL.md markdown
  category: SkillCategory;
  tags: string[];
  authorId: string;
  isPublic: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  installCount: number;
  icon: string; // emoji or lucide icon name
  toolsRequired: string[]; // e.g. ["image-gen", "web-search"]
  tierRequired: SkillTier;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined
  authorName?: string;
  authorAvatar?: string;
  averageRating?: number;
  ratingCount?: number;
  isInstalled?: boolean;
}

export interface SkillSummary
  extends Omit<Skill, "content" | "tags" | "toolsRequired"> {
  tags: string[];
  toolsRequired: string[];
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  isActive: boolean;
  installedAt: Date;
  skill?: Skill;
}

export interface SkillRating {
  id: string;
  userId: string;
  skillId: string;
  rating: number; // 1-5
  review?: string;
  createdAt: Date;
  // Joined
  authorName?: string;
  authorAvatar?: string;
}

export interface SkillRepository {
  listSkills(params: {
    category?: SkillCategory;
    search?: string;
    featured?: boolean;
    tierRequired?: SkillTier;
    limit?: number;
    offset?: number;
    userId?: string;
  }): Promise<SkillSummary[]>;

  getSkillById(id: string, userId?: string): Promise<Skill | null>;
  getSkillByName(name: string, userId?: string): Promise<Skill | null>;

  createSkill(
    skill: Omit<
      Skill,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "installCount"
      | "isVerified"
      | "isFeatured"
      | "authorName"
      | "authorAvatar"
      | "averageRating"
      | "ratingCount"
      | "isInstalled"
    >,
  ): Promise<Skill>;

  updateSkill(
    id: string,
    userId: string,
    data: Partial<
      Pick<
        Skill,
        | "title"
        | "description"
        | "content"
        | "category"
        | "tags"
        | "icon"
        | "toolsRequired"
        | "tierRequired"
        | "isPublic"
        | "version"
      >
    >,
  ): Promise<Skill | null>;

  deleteSkill(id: string, userId: string): Promise<boolean>;

  // Install / Uninstall
  installSkill(userId: string, skillId: string): Promise<UserSkill>;
  uninstallSkill(userId: string, skillId: string): Promise<boolean>;
  getInstalledSkills(userId: string): Promise<(UserSkill & { skill: Skill })[]>;
  getActiveSkillContents(userId: string): Promise<string[]>;
  isInstalled(userId: string, skillId: string): Promise<boolean>;

  // Ratings
  rateSkill(
    userId: string,
    skillId: string,
    rating: number,
    review?: string,
  ): Promise<SkillRating>;
  getSkillRatings(skillId: string): Promise<SkillRating[]>;
  getUserRating(userId: string, skillId: string): Promise<SkillRating | null>;

  // Admin
  incrementInstallCount(skillId: string): Promise<void>;
}
