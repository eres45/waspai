import { chatRepository as restChatRepository } from "./pg/repositories/chat-repository.rest";
// import { pgUserRepository } from "./pg/repositories/user-repository.pg";
import { userRepositoryRest } from "./pg/repositories/user-repository.rest";
import { restMcpRepository } from "./pg/repositories/mcp-repository.rest";
import { restMcpToolCustomizationRepository } from "./pg/repositories/mcp-tool-customization-repository.rest";
import { restMcpServerCustomizationRepository } from "./pg/repositories/mcp-server-customization-repository.rest";
import { restWorkflowRepository } from "./pg/repositories/workflow-repository.rest";
import { restAgentRepository } from "./pg/repositories/agent-repository.rest";
import { archiveRepository as restArchiveRepository } from "./pg/repositories/archive-repository.rest";
import { restMcpOAuthRepository } from "./pg/repositories/mcp-oauth-repository.rest";
import { restBookmarkRepository } from "./pg/repositories/bookmark-repository.rest";
import { restChatExportRepository } from "./pg/repositories/chat-export-repository.rest";
import { characterRepository as restCharacterRepository } from "./pg/repositories/character-repository.rest";
import { restMusicRepository } from "./pg/repositories/music-repository.rest";
import { telegramUploadRepositoryRest } from "./pg/repositories/telegram-upload-repository.rest";
import { memoryRepository as restMemoryRepository } from "./pg/repositories/memory-repository.rest";

export const chatRepository = restChatRepository;
// Use REST API for user operations to avoid direct PostgreSQL connection issues on Vercel
export const userRepository = userRepositoryRest;
export const mcpRepository = restMcpRepository;
export const mcpMcpToolCustomizationRepository =
  restMcpToolCustomizationRepository;
export const mcpServerCustomizationRepository =
  restMcpServerCustomizationRepository;
export const mcpOAuthRepository = restMcpOAuthRepository;

export const workflowRepository = restWorkflowRepository;
export const agentRepository = restAgentRepository;
export const archiveRepository = restArchiveRepository;
export const bookmarkRepository = restBookmarkRepository;
export const chatExportRepository = restChatExportRepository;
export const characterRepository = restCharacterRepository;
export const musicRepository = restMusicRepository;
export const telegramUploadRepository = telegramUploadRepositoryRest;
export const memoryRepository = restMemoryRepository;
