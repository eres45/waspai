import { chatRepository as restChatRepository } from "./pg/repositories/chat-repository.rest";
import { pgUserRepository } from "./pg/repositories/user-repository.pg";
import { userRepositoryRest } from "./pg/repositories/user-repository.rest";
import { pgMcpRepository } from "./pg/repositories/mcp-repository.pg";
import { pgMcpMcpToolCustomizationRepository } from "./pg/repositories/mcp-tool-customization-repository.pg";
import { pgMcpServerCustomizationRepository } from "./pg/repositories/mcp-server-customization-repository.pg";
import { pgWorkflowRepository } from "./pg/repositories/workflow-repository.pg";
import { pgAgentRepository } from "./pg/repositories/agent-repository.pg";
import { archiveRepository as restArchiveRepository } from "./pg/repositories/archive-repository.rest";
import { pgMcpOAuthRepository } from "./pg/repositories/mcp-oauth-repository.pg";
import { pgBookmarkRepository } from "./pg/repositories/bookmark-repository.pg";
import { pgChatExportRepository } from "./pg/repositories/chat-export-repository.pg";
import { characterRepository as restCharacterRepository } from "./pg/repositories/character-repository.rest";
import { pgMusicRepository } from "./pg/repositories/music-repository.pg";

export const chatRepository = restChatRepository;
// Use REST API for user operations to avoid direct PostgreSQL connection issues on Vercel
export const userRepository = {
  ...pgUserRepository,
  getUserById: userRepositoryRest.getUserById,
  updateUserDetails: userRepositoryRest.updateUserDetails,
  updatePreferences: userRepositoryRest.updateUserPreferences,
};
export const mcpRepository = pgMcpRepository;
export const mcpMcpToolCustomizationRepository =
  pgMcpMcpToolCustomizationRepository;
export const mcpServerCustomizationRepository =
  pgMcpServerCustomizationRepository;
export const mcpOAuthRepository = pgMcpOAuthRepository;

export const workflowRepository = pgWorkflowRepository;
export const agentRepository = pgAgentRepository;
export const archiveRepository = restArchiveRepository;
export const bookmarkRepository = pgBookmarkRepository;
export const chatExportRepository = pgChatExportRepository;
export const characterRepository = restCharacterRepository;
export const musicRepository = pgMusicRepository;
