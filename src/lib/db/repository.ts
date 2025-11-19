import { chatRepository as restChatRepository } from "./pg/repositories/chat-repository.rest";
import { pgUserRepository } from "./pg/repositories/user-repository.pg";
import { mcpRepository as restMcpRepository } from "./pg/repositories/mcp-repository.rest";
import { pgMcpMcpToolCustomizationRepository } from "./pg/repositories/mcp-tool-customization-repository.pg";
import { pgMcpServerCustomizationRepository } from "./pg/repositories/mcp-server-customization-repository.pg";
import { pgWorkflowRepository } from "./pg/repositories/workflow-repository.pg";
import { agentRepository as restAgentRepository } from "./pg/repositories/agent-repository.rest";
import { archiveRepository as restArchiveRepository } from "./pg/repositories/archive-repository.rest";
import { pgMcpOAuthRepository } from "./pg/repositories/mcp-oauth-repository.pg";
import { pgBookmarkRepository } from "./pg/repositories/bookmark-repository.pg";
import { pgChatExportRepository } from "./pg/repositories/chat-export-repository.pg";
import { characterRepository as restCharacterRepository } from "./pg/repositories/character-repository.rest";
import { pgMusicRepository } from "./pg/repositories/music-repository.pg";

export const chatRepository = restChatRepository;
export const userRepository = pgUserRepository;
export const mcpRepository = restMcpRepository;
export const mcpMcpToolCustomizationRepository =
  pgMcpMcpToolCustomizationRepository;
export const mcpServerCustomizationRepository =
  pgMcpServerCustomizationRepository;
export const mcpOAuthRepository = pgMcpOAuthRepository;

// Workflow uses PostgreSQL with error handling wrapper
export const workflowRepository = pgWorkflowRepository;
export const agentRepository = restAgentRepository;
export const archiveRepository = restArchiveRepository;
export const bookmarkRepository = pgBookmarkRepository;
export const chatExportRepository = pgChatExportRepository;
export const characterRepository = restCharacterRepository;
export const musicRepository = pgMusicRepository;
