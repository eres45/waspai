import { Agent } from "app-types/agent";
import { UserPreferences } from "app-types/user";
import { MCPServerConfig } from "app-types/mcp";
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  json,
  uuid,
  boolean,
  unique,
  varchar,
  index,
  bigint,
  integer,
} from "drizzle-orm/pg-core";
import { isNotNull } from "drizzle-orm";
import { DBWorkflow, DBEdge, DBNode } from "app-types/workflow";
import { UIMessage } from "ai";
import { ChatMetadata } from "app-types/chat";
import { TipTapMentionJsonContent } from "@/types/util";

export const ChatThreadTable = pgTable("chat_thread", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: text("title").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ChatMessageTable = pgTable("chat_message", {
  id: text("id").primaryKey().notNull(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => ChatThreadTable.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<UIMessage["role"]>(),
  parts: json("parts").notNull().array().$type<UIMessage["parts"]>(),
  metadata: json("metadata").$type<ChatMetadata>(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const AgentTable = pgTable("agent", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: json("icon").$type<Agent["icon"]>(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  instructions: json("instructions").$type<Agent["instructions"]>(),
  visibility: varchar("visibility", {
    enum: ["public", "private", "readonly"],
  })
    .notNull()
    .default("private"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const BookmarkTable = pgTable(
  "bookmark",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull(),
    itemType: varchar("item_type", {
      enum: ["agent", "workflow", "mcp"],
    }).notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique().on(table.userId, table.itemId, table.itemType),
    index("bookmark_user_id_idx").on(table.userId),
    index("bookmark_item_idx").on(table.itemId, table.itemType),
  ],
);

export const McpServerTable = pgTable("mcp_server", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  config: json("config").notNull().$type<MCPServerConfig>(),
  enabled: boolean("enabled").notNull().default(true),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  visibility: varchar("visibility", {
    enum: ["public", "private"],
  })
    .notNull()
    .default("private"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const UserTable = pgTable("user", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  password: text("password"),
  image: text("image"),
  preferences: json("preferences").default({}).$type<UserPreferences>(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  role: text("role").notNull().default("user"),
  tier: text("tier").notNull().default("free"),
  welcomeEmailSent: boolean("welcome_email_sent").default(false).notNull(),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").default(0).notNull(),
  referralRewardClaimed: text("referral_reward_claimed")
    .default("none")
    .notNull(),
  referralWidgetHidden: boolean("referral_widget_hidden")
    .default(false)
    .notNull(),
  tierExpiresAt: timestamp("tier_expires_at"),
  lastSignInIp: text("last_sign_in_ip"),
});

// Role tables removed - using Better Auth's built-in role system
// Roles are now managed via the 'role' field on UserTable

export const SessionTable = pgTable("session", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  // Admin plugin field (from better-auth generated schema)
  impersonatedBy: text("impersonated_by"),
});

export const AccountTable = pgTable("account", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const VerificationTable = pgTable("verification", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

// Tool customization table for per-user additional instructions
export const McpToolCustomizationTable = pgTable(
  "mcp_server_tool_custom_instructions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    mcpServerId: uuid("mcp_server_id")
      .notNull()
      .references(() => McpServerTable.id, { onDelete: "cascade" }),
    prompt: text("prompt"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.userId, table.toolName, table.mcpServerId)],
);

export const McpServerCustomizationTable = pgTable(
  "mcp_server_custom_instructions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    mcpServerId: uuid("mcp_server_id")
      .notNull()
      .references(() => McpServerTable.id, { onDelete: "cascade" }),
    prompt: text("prompt"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [unique().on(table.userId, table.mcpServerId)],
);

export const WorkflowTable = pgTable("workflow", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  version: text("version").notNull().default("0.1.0"),
  name: text("name").notNull(),
  icon: json("icon").$type<DBWorkflow["icon"]>(),
  description: text("description"),
  isPublished: boolean("is_published").notNull().default(false),
  visibility: varchar("visibility", {
    enum: ["public", "private", "readonly"],
  })
    .notNull()
    .default("private"),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const WorkflowNodeDataTable = pgTable(
  "workflow_node",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    version: text("version").notNull().default("0.1.0"),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => WorkflowTable.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    uiConfig: json("ui_config").$type<DBNode["uiConfig"]>().default({}),
    nodeConfig: json("node_config")
      .$type<Partial<DBNode["nodeConfig"]>>()
      .default({}),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("workflow_node_kind_idx").on(t.kind)],
);

export const WorkflowEdgeTable = pgTable("workflow_edge", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  version: text("version").notNull().default("0.1.0"),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => WorkflowTable.id, { onDelete: "cascade" }),
  source: uuid("source")
    .notNull()
    .references(() => WorkflowNodeDataTable.id, { onDelete: "cascade" }),
  target: uuid("target")
    .notNull()
    .references(() => WorkflowNodeDataTable.id, { onDelete: "cascade" }),
  uiConfig: json("ui_config").$type<DBEdge["uiConfig"]>().default({}),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ArchiveTable = pgTable("archive", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ArchiveItemTable = pgTable(
  "archive_item",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    archiveId: uuid("archive_id")
      .notNull()
      .references(() => ArchiveTable.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("archive_item_item_id_idx").on(t.itemId)],
);

export const McpOAuthSessionTable = pgTable(
  "mcp_oauth_session",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    mcpServerId: uuid("mcp_server_id")
      .notNull()
      .references(() => McpServerTable.id, { onDelete: "cascade" }),
    serverUrl: text("server_url").notNull(),
    clientInfo: json("client_info"),
    tokens: json("tokens"),
    codeVerifier: text("code_verifier"),
    state: text("state").unique(), // OAuth state parameter for current flow (unique for security)
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("mcp_oauth_session_server_id_idx").on(t.mcpServerId),
    index("mcp_oauth_session_state_idx").on(t.state),
    // Partial index for sessions with tokens for better performance
    index("mcp_oauth_session_tokens_idx")
      .on(t.mcpServerId)
      .where(isNotNull(t.tokens)),
  ],
);

export type McpServerEntity = typeof McpServerTable.$inferSelect;
export type ChatThreadEntity = typeof ChatThreadTable.$inferSelect;
export type ChatMessageEntity = typeof ChatMessageTable.$inferSelect;

export type AgentEntity = typeof AgentTable.$inferSelect;
export type UserEntity = typeof UserTable.$inferSelect;
export type SessionEntity = typeof SessionTable.$inferSelect;

export type ToolCustomizationEntity =
  typeof McpToolCustomizationTable.$inferSelect;
export type McpServerCustomizationEntity =
  typeof McpServerCustomizationTable.$inferSelect;

export const ChatExportTable = pgTable("chat_export", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: text("title").notNull(),
  exporterId: uuid("exporter_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  originalThreadId: uuid("original_thread_id"),
  messages: json("messages").notNull().$type<
    Array<{
      id: string;
      role: UIMessage["role"];
      parts: UIMessage["parts"];
      metadata?: ChatMetadata;
    }>
  >(),
  exportedAt: timestamp("exported_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp("expires_at"),
});

export const ChatExportCommentTable = pgTable("chat_export_comment", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  exportId: uuid("export_id")
    .notNull()
    .references(() => ChatExportTable.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references(() => ChatExportCommentTable.id, {
    onDelete: "cascade",
  }),
  content: json("content").notNull().$type<TipTapMentionJsonContent>(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const FileUploadTable = pgTable("file_uploads", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  fileType: text("file_type").notNull(),
  uploadUrl: text("upload_url").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const CharacterTable = pgTable(
  "character",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    personality: text("personality").notNull(),
    icon: json("icon").$type<{
      type?: string;
      value: string;
      style?: {
        backgroundColor: string;
      };
    }>(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    privacy: varchar("privacy", {
      enum: ["public", "private"],
    })
      .notNull()
      .default("private"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("character_user_id_idx").on(table.userId),
    index("character_privacy_idx").on(table.privacy),
  ],
);

export type CharacterEntity = typeof CharacterTable.$inferSelect;

export const MusicGenerationTable = pgTable(
  "music_generation",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    lyrics: text("lyrics").notNull(),
    tags: varchar("tags").notNull(),
    permanentUrl: text("permanent_url"),
    tempUrl: text("temp_url"),
    fileSize: bigint("file_size", { mode: "number" }),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("music_generation_user_id_idx").on(table.userId),
    index("music_generation_created_at_idx").on(table.createdAt),
  ],
);

export type MusicGenerationEntity = typeof MusicGenerationTable.$inferSelect;

export type ArchiveEntity = typeof ArchiveTable.$inferSelect;
export type ArchiveItemEntity = typeof ArchiveItemTable.$inferSelect;
export type BookmarkEntity = typeof BookmarkTable.$inferSelect;

export const UserMemoryTable = pgTable(
  "user_memory",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    tags: json("tags").$type<string[]>().default([]),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("user_memory_user_id_idx").on(table.userId)],
);

export type UserMemoryEntity = typeof UserMemoryTable.$inferSelect;

// Model Status Tracking for Uptime Page
export const ModelStatusTable = pgTable(
  "model_status",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    modelId: text("model_id").notNull().unique(), // Unique for upsert
    provider: text("provider").notNull(),
    status: varchar("status", {
      enum: ["operational", "degraded", "down", "unknown"],
    })
      .notNull()
      .default("unknown"),
    responseTime: bigint("response_time", { mode: "number" }), // in ms
    errorMessage: text("error_message"),
    testedAt: timestamp("tested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("model_status_model_id_idx").on(table.modelId),
    index("model_status_tested_at_idx").on(table.testedAt),
  ],
);

export type ModelStatusEntity = typeof ModelStatusTable.$inferSelect;

// Model Status History for uptime calculations
export const ModelStatusHistoryTable = pgTable(
  "model_status_history",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    modelId: text("model_id").notNull(),
    status: varchar("status", {
      enum: ["operational", "degraded", "down", "unknown"],
    }).notNull(),
    responseTime: bigint("response_time", { mode: "number" }),
    errorMessage: text("error_message"),
    testedAt: timestamp("tested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("model_status_history_model_id_idx").on(table.modelId),
    index("model_status_history_tested_at_idx").on(table.testedAt),
  ],
);

export type ModelStatusHistoryEntity =
  typeof ModelStatusHistoryTable.$inferSelect;

// Video Generation Queue - Global queue for serializing video gen requests
export const VideoGenQueueTable = pgTable(
  "video_gen_queue",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id").references(() => UserTable.id, {
      onDelete: "cascade",
    }),
    prompt: text("prompt").notNull(),
    status: varchar("status", {
      enum: ["pending", "processing", "completed", "failed"],
    })
      .notNull()
      .default("pending"),
    videoUrl: text("video_url"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("video_gen_queue_status_idx").on(table.status),
    index("video_gen_queue_created_at_idx").on(table.createdAt),
    index("video_gen_queue_user_id_idx").on(table.userId),
  ],
);

export type VideoGenQueueEntity = typeof VideoGenQueueTable.$inferSelect;

// ─── Skill Library Tables ────────────────────────────────────────────────────

export const SkillTable = pgTable(
  "skill",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull().unique(), // slug e.g. "pdf-creator"
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(), // full SKILL.md markdown
    category: varchar("category", {
      enum: [
        "productivity",
        "coding",
        "media",
        "writing",
        "research",
        "automation",
        "other",
      ],
    })
      .notNull()
      .default("other"),
    tags: json("tags").$type<string[]>().default([]),
    authorId: uuid("author_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").notNull().default(true),
    isVerified: boolean("is_verified").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    installCount: integer("install_count").notNull().default(0),
    icon: text("icon").notNull().default("🔧"),
    toolsRequired: json("tools_required").$type<string[]>().default([]),
    tierRequired: varchar("tier_required", {
      enum: ["free", "pro", "max"],
    })
      .notNull()
      .default("free"),
    version: text("version").notNull().default("1.0.0"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("skill_category_idx").on(table.category),
    index("skill_author_id_idx").on(table.authorId),
    index("skill_is_public_idx").on(table.isPublic),
    index("skill_is_featured_idx").on(table.isFeatured),
    index("skill_tier_required_idx").on(table.tierRequired),
  ],
);

export const UserSkillTable = pgTable(
  "user_skill",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => SkillTable.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    installedAt: timestamp("installed_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique().on(table.userId, table.skillId),
    index("user_skill_user_id_idx").on(table.userId),
    index("user_skill_skill_id_idx").on(table.skillId),
  ],
);

export const SkillRatingTable = pgTable(
  "skill_rating",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => SkillTable.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    review: text("review"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique().on(table.userId, table.skillId),
    index("skill_rating_skill_id_idx").on(table.skillId),
  ],
);

export type SkillEntity = typeof SkillTable.$inferSelect;
export type UserSkillEntity = typeof UserSkillTable.$inferSelect;
export type SkillRatingEntity = typeof SkillRatingTable.$inferSelect;

export const DeployedSiteTable = pgTable("deployed_site", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  slug: text("slug").unique().notNull(), // URL slug: "bakery-a3f2"
  title: text("title").notNull(),
  description: text("description"),
  htmlContent: text("html_content").notNull(), // Full HTML (inline CSS+JS)
  authorId: uuid("author_id").references(() => UserTable.id, {
    onDelete: "cascade",
  }),
  projectId: uuid("project_id").references(() => ArchiveTable.id, {
    onDelete: "cascade",
  }),
  isPublic: boolean("is_public").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const DeployedSiteFileTable = pgTable(
  "deployed_site_file",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => DeployedSiteTable.id, { onDelete: "cascade" }),
    path: text("path").notNull(), // e.g. "index.html", "css/style.css"
    content: text("content").notNull(),
    mimeType: text("mime_type").notNull(), // e.g. "text/html", "text/css"
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.siteId, table.path)],
);

export type DeployedSiteEntity = typeof DeployedSiteTable.$inferSelect;
export type DeployedSiteFileEntity = typeof DeployedSiteFileTable.$inferSelect;

export const UserDailyUsageTable = pgTable(
  "user_daily_usage",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    actionType: varchar("action_type", {
      enum: ["web_search", "image_gen"],
    }).notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("user_daily_usage_user_action_date_idx").on(
      table.userId,
      table.actionType,
      table.createdAt,
    ),
  ],
);

export type UserDailyUsageEntity = typeof UserDailyUsageTable.$inferSelect;

export const SystemErrorTable = pgTable(
  "system_error",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id").references(() => UserTable.id, {
      onDelete: "set null",
    }),
    errorName: text("error_name").notNull(),
    errorMessage: text("error_message").notNull(),
    errorStack: text("error_stack"),
    path: text("path"),
    method: text("method"),
    statusCode: integer("status_code"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("system_error_created_at_idx").on(table.createdAt),
    index("system_error_error_name_idx").on(table.errorName),
  ],
);

export type SystemErrorEntity = typeof SystemErrorTable.$inferSelect;

export const BrowserUsageTable = pgTable(
  "browser_usage",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull().unique(),
    allocatedDuration: integer("allocated_duration").notNull().default(120),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("browser_usage_user_id_idx").on(table.userId),
    index("browser_usage_created_at_idx").on(table.createdAt),
  ],
);

export type BrowserUsageEntity = typeof BrowserUsageTable.$inferSelect;
