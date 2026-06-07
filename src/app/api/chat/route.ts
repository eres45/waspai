import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";
import { AllowedMCPServer } from "app-types/mcp";

import {
  customModelProvider,
  isToolCallUnsupportedModel,
  isImageInputUnsupportedModel,
  buildDynamicModelsInfo,
} from "lib/ai/models";
import { createReverseModelMapping } from "lib/ai/model-display-names";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import {
  agentRepository,
  chatRepository,
  memoryRepository,
  skillRepository,
} from "lib/db/repository";
import globalLogger from "logger";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildUserSystemPrompt,
  buildToolCallUnsupportedModelSystemPrompt,
  buildSearchModelSystemPrompt,
  PROXY_CLEANUP_PROMPT,
} from "lib/ai/prompts";
import {
  chatApiSchemaRequestBodySchema,
  ChatMention,
  ChatMetadata,
} from "app-types/chat";

import { errorIf, safe } from "ts-safe";

import {
  excludeToolExecution,
  handleError,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
  extractInProgressToolPart,
  filterMcpServerCustomizations,
  loadMcpTools,
  loadWorkFlowTools,
  loadAppDefaultTools,
  convertToSavePart,
} from "./shared.chat";
import {
  rememberAgentAction,
  rememberMcpServerCustomizationsAction,
} from "./actions";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { generateUUID } from "lib/utils";
import {
  nanoBananaTool,
  openaiImageTool,
  analyzeImageTool,
} from "lib/ai/tools/image";
import {
  removeBackgroundTool,
  enhanceImageTool,
  animeConversionTool,
  removeWatermarkTool,
  removeObjectTool,
  superResolutionTool,
  restoreOldPhotoTool,
  blurBackgroundTool,
  editImageTool,
} from "lib/ai/tools/image/edit-image";
import { videoGenTool } from "lib/ai/tools/image/video-gen";
import { pdfGeneratorTool } from "lib/ai/tools/pdf-generator";
import {
  wordDocumentTool,
  csvGeneratorTool,
  textFileTool,
} from "lib/ai/tools/document-generator";
import {
  qrCodeGeneratorTool,
  qrCodeWithLogoTool,
} from "@/lib/ai/tools/qr-code-generator";
import { htmlPreviewTool } from "@/lib/ai/tools/html-preview";
import { chatExportTool } from "@/lib/ai/tools/chat-export";
import { deploySiteTool } from "@/lib/ai/tools/deploy-site";
import { createSkillTool } from "@/lib/ai/tools/skill-tools";
import { writeSiteFileTool } from "@/lib/ai/tools/write-site-file";
import { readSiteFileTool } from "@/lib/ai/tools/read-site-file";
import { editSiteFileTool } from "@/lib/ai/tools/edit-site-file";
import { exaSearchTool as webSearchTool } from "@/lib/ai/tools/web/web-search";
import {
  listSmsNumbersTool,
  getSmsMessagesTool,
} from "@/lib/ai/tools/web/sms-tool";
import {
  createTempEmailTool,
  getTempEmailMessagesTool,
} from "@/lib/ai/tools/web/temp-mail";
import { ImageToolName } from "@/lib/ai/tools";
import { buildCsvIngestionPreviewParts } from "@/lib/ai/ingest/csv-ingest";
import {
  saveMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  getMemoriesTool,
} from "lib/ai/tools/memory-tools";
import { serverFileStorage } from "lib/file-storage";
import {
  truncateTextToLimit,
  getModelContextLimit,
} from "lib/ai/context-limits";
import { processFileURLsForModel } from "lib/ocr/ocr-service";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat API: `),
});

// Allow up to 300 seconds for this route (video generation takes ~30s, code generation takes longer)
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    // Check if this is a voice chat session (don't save to history)
    const isVoiceChat = request.headers.get("X-Voice-Chat") === "true";

    const json = await request.json();
    console.log(
      "[DEBUG] Chat API Request Body:",
      JSON.stringify(json, null, 2),
    );

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = session.user.id;

    let parsedBody;
    try {
      parsedBody = chatApiSchemaRequestBodySchema.parse(json);
    } catch (parseError) {
      console.error("[DEBUG] Chat API Schema Parse Error:", parseError);
      return new Response(
        `Schema validation failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        { status: 400, headers: corsHeaders },
      );
    }

    const {
      id,
      message,
      chatModel,
      toolChoice,
      allowedAppDefaultToolkit,
      allowedMcpServers,
      imageTool,
      mentions = [],
      attachments = [],
      editImageModel,
      videoGenModel,
    } = parsedBody;

    // Sync backend message history cleanup: if editing or regenerating a message,
    // delete all subsequent messages in the database synchronous to prevent Next.js client-side revalidation glitches.
    if (message?.id) {
      logger.info(
        `Cleaning up database messages after and including message: ${message.id}`,
      );
      await chatRepository.deleteMessagesByChatIdAfterTimestamp(message.id);
    }

    // Extract agentId early from mentions or metadata
    const agentId =
      (
        mentions.find((m) => m.type === "agent") as Extract<
          ChatMention,
          { type: "agent" }
        >
      )?.agentId || (message.metadata as ChatMetadata)?.agentId;

    // Convert display names back to backend names
    const dynamicModelsInfo = await buildDynamicModelsInfo();
    const dynamicModelIds = dynamicModelsInfo.flatMap((p) =>
      p.models.map((m) => m.name),
    );
    const { models: modelReverseMapping, providers: providerReverseMapping } =
      createReverseModelMapping(dynamicModelIds);
    let modelToUse = chatModel;
    if (modelToUse) {
      const backendProvider =
        providerReverseMapping[modelToUse.provider] || modelToUse.provider;
      const backendModel =
        modelReverseMapping[modelToUse.model] || modelToUse.model;
      modelToUse = {
        provider: backendProvider,
        model: backendModel,
      };
    }
    const messageText =
      message.parts
        ?.filter((part: any) => part?.type === "text")
        .map((part: any) => part?.text)
        .join(" ") || "";

    // Extract file attachments for OCR processing — include metadata so OCR can
    // detect file type via mime type when the storage URL has no extension
    const fileAttachmentsForOcr = attachments
      .filter((att) => att.type === "file" || att.type === "source-url")
      .filter(
        (att) =>
          att.url && (att.url.includes("http") || att.url.includes("data:")),
      )
      .map((att) => ({
        url: att.url,
        mediaType: att.mediaType,
        filename: att.filename,
      }));

    // Keep plain URL list for other uses (e.g. image URL extraction)
    const fileUrls = fileAttachmentsForOcr.map((a) => a.url);

    logger.info(`Attachments count: ${attachments.length}`);
    logger.info(`File URLs extracted: ${fileUrls.length}`);

    // Automatically run OCR/Vision analysis for all uploaded files (images, docs, etc.)
    // This feeds the extracted content directly to the active model context so it knows what it is, even if the user didn't explicitly ask.
    const userWantsOcr = fileAttachmentsForOcr.length > 0;

    logger.info(
      `Starting parallel metadata fetch (OCR=${userWantsOcr}, thread, agent)`,
    );

    // Define the promises
    const ocrPromise = userWantsOcr
      ? processFileURLsForModel(messageText, fileAttachmentsForOcr)
      : Promise.resolve(messageText);

    const threadPromise = chatRepository.selectThreadDetails(id);
    const agentPromise = rememberAgentAction(agentId, userId);

    // Await all initial metadata with a timeout for OCR to prevent chat hangs
    // We wait at most 10s for OCR. If it takes longer, we proceed with the original message text.
    const ocrWithTimeout = Promise.race([
      ocrPromise,
      new Promise<string>(
        (resolve) =>
          setTimeout(() => {
            logger.warn(
              "OCR timed out after 8s, proceeding with original text",
            );
            resolve(messageText);
          }, 8000), // 8s OCR cap (Vercel Hobby = 10s hard limit)
      ),
    ]);

    const [enrichedMessageText, rawThread, agent] = await Promise.all([
      ocrWithTimeout,
      threadPromise,
      agentPromise,
    ]);

    let thread = rawThread;

    if (fileUrls.length > 0) {
      logger.info(
        `OCR processed ${fileUrls.length} files, enriched message with extracted text`,
      );
    }

    logger.info(`Getting model: ${modelToUse?.provider}/${modelToUse?.model}`);
    let model;
    let initialModelLoadFailed = false;
    try {
      model = customModelProvider.getModel(modelToUse);
      logger.info(`Model retrieved successfully`);
    } catch (modelError) {
      logger.error(
        `Failed to get model initially, will fallback inside stream:`,
        modelError,
      );
      initialModelLoadFailed = true;
      try {
        modelToUse = { provider: "OpenAI", model: "gpt-oss-120b-p2" };
        model = customModelProvider.getModel(modelToUse);
      } catch (innerError) {
        logger.error(`Failed to load default fallback model:`, innerError);
        throw modelError;
      }
    }

    if (!thread) {
      logger.info(`create chat thread: ${id}`);
      const newThread = await chatRepository.insertThread({
        id,
        title: "",
        userId: userId,
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);
    }

    if (thread!.userId !== userId) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const messages: UIMessage[] = (thread?.messages ?? []).map((m) => {
      try {
        // Ensure parts is an array (it might be a string from JSON)
        let parts = m.parts;
        if (typeof parts === "string") {
          parts = JSON.parse(parts);
        }
        if (!Array.isArray(parts)) {
          logger.warn(
            `Invalid parts format for message ${m.id}, using empty array`,
          );
          parts = [];
        }

        // Ensure metadata is an object (it might be a string from JSON)
        let metadata = m.metadata;
        if (typeof metadata === "string") {
          try {
            metadata = JSON.parse(metadata);
          } catch (_e) {
            logger.warn(`Failed to parse metadata for message ${m.id}`);
            metadata = undefined;
          }
        }

        return {
          id: m.id,
          role: m.role,
          parts: parts,
          metadata: metadata,
        };
      } catch (parseError) {
        logger.error(`Failed to parse message ${m.id}:`, parseError);
        return {
          id: m.id,
          role: m.role,
          parts: [],
          metadata: m.metadata,
        };
      }
    });

    if (isVoiceChat) {
      logger.info(`Voice chat session: using complete thread history from DB`);
    }
    logger.info(`Loaded ${messages.length} messages from thread history`);

    // Sanitize messages to remove huge base64 data URLs from history
    // This prevents context explosion (5MB+ prompts) when using data: URLs for image previews
    // Sanitize messages to remove huge base64 data URLs from history
    // This prevents context explosion (5MB+ prompts) when using data: URLs for image previews

    // Helper function to recursively strip data URLs from any object
    const recursiveSanitize = (obj: any): any => {
      if (!obj) return obj;

      if (typeof obj === "string") {
        if (obj.startsWith("data:") && obj.length > 500) {
          return obj.split(",")[0] + ",[BASE64_DATA_REMOVED]";
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => recursiveSanitize(item));
      }

      if (typeof obj === "object") {
        const newObj: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = recursiveSanitize(obj[key]);
          }
        }
        return newObj;
      }

      return obj;
    };

    const sanitizedMessages: UIMessage[] = messages.map((msg) => {
      // Deep sanitize the entire message object
      return recursiveSanitize(msg);
    });

    sanitizedMessages.forEach((m, idx) => {
      logger.info(
        `Message ${idx}: id=${m.id}, role=${m.role}, parts=${m.parts?.length || 0}`,
      );
    });

    // Replace original messages with sanitized ones
    messages.length = 0;
    messages.push(...sanitizedMessages);

    const ingestionPreviewParts = await buildCsvIngestionPreviewParts(
      attachments,
      (key) => serverFileStorage.download(key),
    );
    if (ingestionPreviewParts.length) {
      const baseParts = [...message.parts];
      let insertionIndex = -1;
      for (let i = baseParts.length - 1; i >= 0; i -= 1) {
        if (baseParts[i]?.type === "text") {
          insertionIndex = i;
          break;
        }
      }
      if (insertionIndex !== -1) {
        baseParts.splice(insertionIndex, 0, ...ingestionPreviewParts);
        message.parts = baseParts;
      } else {
        message.parts = [...baseParts, ...ingestionPreviewParts];
      }
    }

    if (attachments.length) {
      const firstTextIndex = message.parts.findIndex(
        (part: any) => part?.type === "text",
      );
      const attachmentParts: any[] = [];

      attachments.forEach((attachment) => {
        const exists = message.parts.some(
          (part: any) =>
            part?.type === attachment.type && part?.url === attachment.url,
        );
        if (exists) return;

        // Always add file attachments to message parts
        // Even if OCR extracted text, we still need the image/file part for tools like edit-image
        if (attachment.type === "file") {
          attachmentParts.push({
            type: "file",
            url: attachment.url,
            mediaType: attachment.mediaType,
            filename: attachment.filename,
          });
        } else if (attachment.type === "source-url") {
          attachmentParts.push({
            type: "source-url",
            url: attachment.url,
            mediaType: attachment.mediaType,
            title: attachment.filename,
          });
        }
      });

      if (attachmentParts.length) {
        if (firstTextIndex >= 0) {
          message.parts = [
            ...message.parts.slice(0, firstTextIndex),
            ...attachmentParts,
            ...message.parts.slice(firstTextIndex),
          ];
        } else {
          message.parts = [...message.parts, ...attachmentParts];
        }
      }
    }

    // Update message text with OCR-enriched content if files were processed
    if (enrichedMessageText !== messageText) {
      logger.info(
        `OCR enriched message. Original length: ${messageText.length}, Enriched length: ${enrichedMessageText.length}`,
      );

      // Remove the "Attached files" summary part if it exists (it's marked with ingestionPreview)
      message.parts = message.parts.filter((part: any) => {
        if (part.type === "text" && (part as any).ingestionPreview) {
          logger.info(
            `Removing ingestionPreview part: ${part.text.substring(0, 50)}...`,
          );
          return false;
        }
        return true;
      });

      // Find and replace the actual user query text part
      const textPartIndex = message.parts.findIndex(
        (part: any) => part?.type === "text",
      );
      if (textPartIndex >= 0) {
        logger.info(`Replacing text part at index ${textPartIndex}`);
        message.parts[textPartIndex] = {
          type: "text",
          text: enrichedMessageText,
        };
      } else {
        logger.info(`No text part found, adding enriched text`);
        message.parts.unshift({
          type: "text",
          text: enrichedMessageText,
        });
      }
    }

    // Filter out unsupported file types before sending to model.
    // After OCR extraction, non-image file parts (PDFs, docs, code files) should
    // be stripped from message.parts — their content is already in the enriched text.
    // Only image file parts are kept for vision-capable models.
    const supportedFileTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/tiff",
      // NOTE: PDFs, docs, and text files are intentionally omitted.
      // Their content is extracted by OCR and injected into the text context.
      // Sending raw file URLs to most models causes errors.
    ];

    const unsupportedParts: any[] = [];
    message.parts = message.parts.filter((part: any) => {
      if (part.type === "file" && part.mediaType) {
        // Keep image file parts for vision models
        if (supportedFileTypes.includes(part.mediaType)) return true;
        // Strip everything else (PDFs, docs, code files — content injected via OCR text)
        unsupportedParts.push({
          mediaType: part.mediaType,
          filename: part.filename || part.name,
        });
        logger.info(
          `Stripping file part from message (content extracted by OCR): ${part.mediaType} (${part.filename || part.name})`,
        );
        return false;
      }
      return true;
    });

    // Add a context note if OCR failed to extract content (timed out or unsupported)
    const ocrExtractedContent = enrichedMessageText !== messageText;
    if (unsupportedParts.length > 0 && !ocrExtractedContent) {
      const fileNames = unsupportedParts
        .map((p) => `${p.filename || "file"} (${p.mediaType})`)
        .join(", ");
      const fallbackNote = `\n\n[System Note: The following file(s) were uploaded but content extraction timed out or failed: ${fileNames}. Please try again or use a different file format.]`;
      const textPart = message.parts.find((p: any) => p.type === "text") as any;
      if (textPart && textPart.text) {
        textPart.text += fallbackNote;
      }
    }

    // Debug: Log message parts before sending to model
    logger.info(`Message parts count: ${message.parts.length}`);
    message.parts.forEach((part: any, index: number) => {
      if (part.type === "text") {
        logger.info(`Part ${index}: TEXT - ${part.text.substring(0, 100)}...`);
      } else {
        logger.info(
          `Part ${index}: ${part.type} - ${part.url || part.mediaType}`,
        );
      }
    });

    messages.push(message);

    const supportToolCall = !isToolCallUnsupportedModel(model);

    if (agent?.instructions?.mentions) {
      mentions.push(...agent.instructions.mentions);
    }

    // Define metadata
    const metadata: ChatMetadata = {
      agentId: agent?.id,
      toolChoice: toolChoice,
      toolCount: 0,
      chatModel: modelToUse,
    };

    // [CHARACTER MODE - TEMPORARILY HIDDEN]
    // Character context extraction from request headers and mentions disabled.
    // const characterContextHeader = request.headers.get("X-Character-Context");
    // let characterContext: { name: string; description: string; personality: string } | undefined;
    // const characterMention = mentions.find((m) => m.type === "character") as | Extract<ChatMention, { type: "character" }> | any;
    // if (characterMention?.name && characterMention?.description) { characterContext = { ... }; }
    // else if (characterContextHeader) { ... }

    // Scan if there is an image in the history or current attachments
    let hasImageInHistoryOrAttachments = fileUrls.length > 0;
    if (!hasImageInHistoryOrAttachments) {
      // Check the messages array for any image parts
      const reversedMessages = [...messages].reverse();
      for (const msg of reversedMessages) {
        const imgPart = msg.parts?.find(
          (p: any) =>
            (p.type === "file" ||
              p.type === "source-url" ||
              p.type === "image") &&
            (p.url?.startsWith("http") || p.url?.startsWith("data:")) &&
            (p.mimeType?.startsWith("image/") ||
              p.mediaType?.startsWith("image/") ||
              p.type === "image"),
        );
        if (imgPart) {
          hasImageInHistoryOrAttachments = true;
          break;
        }
      }
    }

    // Image tool is enabled when explicitly requested by the user/client
    const useImageTool = Boolean(imageTool?.model);

    // Effective image tool for generation
    const effectiveImageTool = imageTool || undefined;

    // Allow tool calls whenever the model supports them — AI decides when to use them
    const isToolCallAllowed = supportToolCall && toolChoice !== "none";

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const mcpClients = await mcpClientsManager.getClients();
        const mcpTools = await mcpClientsManager.tools();
        logger.info(
          `mcp-server count: ${mcpClients.length}, mcp-tools count :${Object.keys(mcpTools).length}`,
        );
        const MCP_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadMcpTools({
              mentions,
              allowedMcpServers,
            }),
          )
          .orElse({});

        const WORKFLOW_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadWorkFlowTools({
              mentions,
              dataStream,
            }),
          )
          .orElse({});

        const APP_DEFAULT_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadAppDefaultTools({
              mentions,
              allowedAppDefaultToolkit:
                toolChoice === "auto" ? undefined : allowedAppDefaultToolkit,
            }),
          )
          .orElse({});

        logger.info(
          `[TOOLS] APP_DEFAULT_TOOLS count: ${Object.keys(APP_DEFAULT_TOOLS).length}`,
        );
        logger.info(
          `[TOOLS] APP_DEFAULT_TOOLS keys: ${Object.keys(APP_DEFAULT_TOOLS).join(", ")}`,
        );
        logger.info(
          `[TOOLS] allowedAppDefaultToolkit: ${JSON.stringify(allowedAppDefaultToolkit)}`,
        );
        logger.info(`[TOOLS] isToolCallAllowed: ${isToolCallAllowed}`);

        const inProgressToolParts = extractInProgressToolPart(message);
        if (inProgressToolParts.length) {
          await Promise.all(
            inProgressToolParts.map(async (part) => {
              const output = await manualToolExecuteByLastMessage(
                part,
                { ...MCP_TOOLS, ...WORKFLOW_TOOLS, ...APP_DEFAULT_TOOLS },
                request.signal,
              );
              part.output = output;

              dataStream.write({
                type: "tool-output-available",
                toolCallId: part.toolCallId,
                output,
              });
            }),
          );
        }

        const userPreferences = thread?.userPreferences || undefined;

        // Start fetching memories and MCP customizations in parallel
        const memoriesPromise = memoryRepository.list(session.user.id, 50);
        const mcpPromise = safe()
          .map(() => {
            if (Object.keys(MCP_TOOLS ?? {}).length === 0)
              throw new Error("No tools found");
            return rememberMcpServerCustomizationsAction(session.user.id);
          })
          .map((v) => filterMcpServerCustomizations(MCP_TOOLS!, v))
          .orElse({});

        // Determine active tool and mode
        const isExplicitGenerationModel = Boolean(imageTool?.model);
        const activeGenerationModel = useImageTool
          ? effectiveImageTool?.model
          : undefined;
        const activeEditModel = editImageModel; // From request body

        let imageModelPrompt = "";

        if (activeEditModel) {
          imageModelPrompt = `You are using the image editing tool with the pre-selected model: "${activeEditModel}".
CRITICAL INSTRUCTIONS - MUST FOLLOW EXACTLY:
1. The user has explicitly selected an image editing mode (model: ${activeEditModel}).
2. You MUST call the appropriate editing tool based on the model:
   - If model is "nano-banana", call the "edit-image" tool with the user's prompt and the source image URL.
   - If model is "remove-background", call the "remove-background" tool.
   - If model is "enhance-image", call the "enhance-image" tool.
3. Do NOT ask the user to choose a model.
4. Do NOT refuse to edit.
5. After the tool returns, you MAY describe the result, but do NOT output the image URL or markdown links.`;
        } else if (activeGenerationModel) {
          if (isExplicitGenerationModel) {
            imageModelPrompt = `You are using the image generation tool with the pre-selected model: "${activeGenerationModel}". 
CRITICAL INSTRUCTIONS - MUST FOLLOW EXACTLY:
1. The user has selected an image generation model - they want to generate an image
2. Call the "image-manager" tool IMMEDIATELY with the user's message as the prompt
3. Use the exact tool name: "image-manager" (this is the ONLY tool name to use for generation)
4. ALWAYS use model="${activeGenerationModel}" - this is the ONLY model you must use
5. Do NOT use any other model - do not substitute with any other model
6. Do NOT call the tool multiple times - call it EXACTLY ONCE
7. Do NOT ask the user to choose a model or ask for clarification
8. Do NOT refuse to generate the image - just generate it
9. After the tool returns the image, you MAY describe the image or provide a creative caption.
10. CRITICAL: Do NOT output the image URL in your response text. The user can already see the image in the UI.
11. CRITICAL: Do NOT create markdown links to the image (e.g. [Image](url)).`;
          } else {
            imageModelPrompt = `You have been requested to generate an image.
CRITICAL INSTRUCTIONS:
1. Call the "image-manager" tool IMMEDIATELY with the user's message as the prompt.
2. ALWAYS use model="${activeGenerationModel}" as the model parameter — this is the EXACT model ID to pass to the tool. Do NOT use display names or any other value.
3. Valid model IDs you may use: "${activeGenerationModel}", "flux-1-schnell", "flux-1-dev", "flux-pro", "sdxl-v1-0", "juggernaut-xl", "realvisxl-v4", "sd-3-5", "seedream-4-5". Always use the exact string specified in Rule 2.
4. Use the exact tool name: "image-manager".
5. Do NOT ask the user to choose a model or ask for clarification.
6. Do NOT refuse to generate the image - just generate it.
7. After the tool returns the image successfully, provide a brief descriptive caption.
8. CRITICAL: NEVER output the image URL in your response text.
9. CRITICAL: NEVER create markdown image links (![]()). The user already sees the image in the UI.`;
          }
        }

        // Detect if this is an edit image request based on selected model
        const lastMessage = messages[messages.length - 1];

        // Look for file or source-url type image parts
        const imageFilePart = lastMessage?.parts?.find(
          (part: any) =>
            (part?.type === "file" || part?.type === "source-url") &&
            part?.mediaType?.startsWith("image/"),
        );

        // Get the actual image URL - try multiple sources in order of preference
        let imageUrl: string | undefined;

        // Debug: Log all message parts to understand structure
        logger.info(
          `Last message parts count: ${lastMessage?.parts?.length || 0}`,
        );
        lastMessage?.parts?.forEach((part: any, idx: number) => {
          logger.info(
            `Part ${idx}: type=${part.type}, url=${(part as any)?.url?.substring(0, 100) || "N/A"}, mediaType=${(part as any)?.mediaType || "N/A"}`,
          );
        });

        // 1. Try fileUrls first (contains CDN URLs from attachments)
        if (fileUrls.length > 0) {
          imageUrl = fileUrls[0];
          logger.info(`Image URL from fileUrls: ${imageUrl}`);
        }
        // 2. Fallback to imageFilePart URL
        else if (imageFilePart) {
          imageUrl = (imageFilePart as any)?.url;
          logger.info(`Image URL from imageFilePart: ${imageUrl}`);
        }
        // 3. Try to extract from message parts directly - look for any part with URL
        if (!imageUrl) {
          const urlPart = lastMessage?.parts?.find(
            (part: any) =>
              typeof part === "object" &&
              (part as any)?.url &&
              ((part as any)?.url.includes("http") ||
                (part as any)?.url.includes("data:") ||
                (part as any)?.url.includes("blob:")),
          );
          if (urlPart) {
            imageUrl = (urlPart as any)?.url;
            logger.info(`Image URL from message parts: ${imageUrl}`);
          }
        }

        // 4. Fallback: Look into history (last 10 messages) for the most recent image
        if (!imageUrl) {
          const reversedMessages = [...messages].reverse();
          for (const msg of reversedMessages) {
            const imgPart = msg.parts.find(
              (p: any) =>
                (p.type === "file" ||
                  p.type === "source-url" ||
                  p.type === "image") &&
                (p.url?.startsWith("http") || p.url?.startsWith("data:")) &&
                (p.mimeType?.startsWith("image/") ||
                  p.mediaType?.startsWith("image/") ||
                  p.type === "image"),
            );
            if (imgPart) {
              imageUrl = (imgPart as any).url;
              logger.info(
                `Found image in history (msg ${msg.id}): ${imageUrl}`,
              );
              break;
            }
          }
        }

        // Check if user selected an edit image model from the menu
        logger.info(`Edit Image State Model: ${editImageModel}`);
        logger.info(`Image URL: ${imageUrl}`);
        logger.info(`ImageFilePart found: ${!!imageFilePart}`);
        logger.info(`FileUrls: ${fileUrls.join(", ")}`);
        logger.info(`Attachments count: ${attachments.length}`);

        // Detect remove background request from keywords as fallback
        const hasRemoveBgKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();
          const hasRemoveIntent =
            text.includes("remove") ||
            text.includes("erase") ||
            text.includes("delete") ||
            text.includes("clear") ||
            text.includes("cut out");
          const hasBgWord = text.includes("background") || text.includes("bg");
          return hasRemoveIntent && hasBgWord;
        });

        // Detect enhance image request from keywords as fallback
        const hasEnhanceKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();
          return (
            text.includes("enhance") ||
            text.includes("improve") ||
            text.includes("upscale") ||
            text.includes("quality") ||
            text.includes("clarity") ||
            text.includes("sharpen") ||
            text.includes("brighten") ||
            text.includes("contrast") ||
            text.includes("unblur")
          );
        });

        const hasAnimeKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();
          return (
            text.includes("anime") ||
            text.includes("cartoon") ||
            text.includes("manga") ||
            text.includes("convert to anime")
          );
        });

        const hasWatermarkKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text)
            return false;
          const text = part.text.toLowerCase();
          return (
            text.includes("watermark") ||
            text.includes("stamp") ||
            text.includes("remove text from image")
          );
        });

        const hasObjectRemovalKeywords = lastMessage?.parts?.some(
          (part: any) => {
            if (typeof part !== "object" || part.type !== "text" || !part.text)
              return false;
            const text = part.text.toLowerCase();
            return (
              (text.includes("remove") || text.includes("erase")) &&
              (text.includes("object") ||
                text.includes("person") ||
                text.includes("item"))
            );
          },
        );

        const hasUpscaleKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text)
            return false;
          const text = part.text.toLowerCase();
          return (
            text.includes("upscale") ||
            text.includes("resolution") ||
            text.includes("super resolution") ||
            text.includes("increase quality")
          );
        });

        const hasRestorationKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text)
            return false;
          const text = part.text.toLowerCase();
          return (
            text.includes("restore") ||
            text.includes("old photo") ||
            text.includes("damaged photo") ||
            text.includes("fix photo")
          );
        });

        const hasBlurKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text)
            return false;
          const text = part.text.toLowerCase();
          return (
            text.includes("blur") &&
            (text.includes("background") || text.includes("bokeh"))
          );
        });

        const isRemoveBgRequest =
          imageUrl &&
          (editImageModel === "remove-background" || hasRemoveBgKeywords);
        const isEnhanceImageRequest =
          imageUrl &&
          (editImageModel === "enhance-image" || hasEnhanceKeywords);
        const isAnimeConversionRequest =
          imageUrl &&
          (editImageModel === "anime-conversion" || hasAnimeKeywords);
        const isRemoveWatermarkRequest =
          imageUrl &&
          (editImageModel === "remove-watermark" || hasWatermarkKeywords);
        const isRemoveObjectRequest =
          imageUrl &&
          (editImageModel === "remove-object" || hasObjectRemovalKeywords);
        const isSuperResolutionRequest =
          imageUrl &&
          (editImageModel === "super-resolution" || hasUpscaleKeywords);
        const isRestoreOldPhotoRequest =
          imageUrl &&
          (editImageModel === "restore-old-photo" || hasRestorationKeywords);
        const isBlurBackgroundRequest =
          imageUrl && (editImageModel === "blur-background" || hasBlurKeywords);

        const isBase64Image = imageUrl?.startsWith("data:");
        const imagePlaceholder = "PLACEHOLDER_IMAGE_DATA"; // Short string for LLM
        const promptImageUrl = isBase64Image ? imagePlaceholder : imageUrl;

        const removeBgPrompt =
          isRemoveBgRequest && imageUrl
            ? `Call the "remove-background" tool with imageUrl: "${promptImageUrl}".`
            : "";

        const enhanceImagePrompt =
          isEnhanceImageRequest && imageUrl
            ? `Call the "enhance-image" tool with imageUrl: "${promptImageUrl}".`
            : "";

        const animeConversionPrompt =
          isAnimeConversionRequest && imageUrl
            ? `Call the "anime-conversion" tool with imageUrl: "${promptImageUrl}".`
            : "";

        const removeWatermarkPrompt =
          isRemoveWatermarkRequest && imageUrl
            ? `Call the "remove-watermark" tool with imageUrl: "${promptImageUrl}".`
            : "";

        const removeObjectPrompt =
          isRemoveObjectRequest && imageUrl
            ? `Call the "remove-object" tool with imageUrl: "${promptImageUrl}".`
            : "";

        const superResolutionPrompt =
          isSuperResolutionRequest && imageUrl
            ? `Call the "super-resolution" tool with imageUrl: "${promptImageUrl}".`
            : "";

        const restoreOldPhotoPrompt =
          isRestoreOldPhotoRequest && imageUrl
            ? `Call the "restore-old-photo" tool with imageUrl: "${promptImageUrl}".`
            : "";

        const blurBackgroundPrompt =
          isBlurBackgroundRequest && imageUrl
            ? `Call the "blur-background" tool with imageUrl: "${promptImageUrl}".`
            : "";

        // ... prompts ...

        const scopedRemoveBgTool = {
          ...removeBackgroundTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return removeBackgroundTool!.execute!(args, context);
          },
        };

        const scopedEnhanceImageTool = {
          ...enhanceImageTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return enhanceImageTool!.execute!(args, context);
          },
        };

        const scopedAnimeConversionTool = {
          ...animeConversionTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return animeConversionTool!.execute!(args, context);
          },
        };

        const scopedRemoveWatermarkTool = {
          ...removeWatermarkTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return removeWatermarkTool!.execute!(args, context);
          },
        };

        const scopedRemoveObjectTool = {
          ...removeObjectTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return removeObjectTool!.execute!(args, context);
          },
        };

        const scopedSuperResolutionTool = {
          ...superResolutionTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return superResolutionTool!.execute!(args, context);
          },
        };

        const scopedRestoreOldPhotoTool = {
          ...restoreOldPhotoTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return restoreOldPhotoTool!.execute!(args, context);
          },
        };

        const scopedBlurBackgroundTool = {
          ...blurBackgroundTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return blurBackgroundTool!.execute!(args, context);
          },
        };

        const scopedEditImageTool = {
          ...editImageTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              args.imageUrl = imageUrl;
            }
            return editImageTool!.execute!(args, context);
          },
        };

        const scopedAnalyzeImageTool = {
          ...analyzeImageTool,
          execute: async (args: any, context: any) => {
            if (
              (args.imageUrl === imagePlaceholder ||
                (!args.imageUrl?.startsWith("http") &&
                  !args.imageUrl?.startsWith("data:"))) &&
              imageUrl
            ) {
              args.imageUrl = imageUrl;
            }
            return analyzeImageTool!.execute!(args, context);
          },
        };

        // Detect PDF generation request from keywords (smart intent + PDF words)
        const hasPdfKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();

          const intentWords = [
            "create",
            "generate",
            "make",
            "export",
            "save",
            "download",
            "can you",
            "please",
            "i want",
          ];
          const hasIntent = intentWords.some((word) => text.includes(word));

          const pdfWords = ["pdf", "pdf report", "pdf document"]; // keep simple but focused
          const hasPdfWord = pdfWords.some((word) => text.includes(word));

          if (hasIntent && hasPdfWord) {
            return true;
          }

          // Fallback: plain mention of pdf
          return text.includes("pdf");
        });

        const isPdfRequest = hasPdfKeywords;
        const pdfPrompt = isPdfRequest
          ? `SYSTEM OVERRIDE: You contain a specialized "generate-pdf" tool.
             YOU MUST call the "generate-pdf" tool to create the PDF requested by the user.
             DO NOT REFUSE. DO NOT say you cannot create PDFs. YOU HAVE THE TOOL.
             EXECUTE the tool call immediately.`
          : "";

        // Detect Word document generation request from keywords (smart intent + document words)
        const hasWordKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();

          const intentWords = [
            "create",
            "generate",
            "make",
            "export",
            "save",
            "can you",
            "please",
            "i want",
          ];
          const hasIntent = intentWords.some((word) => text.includes(word));

          const wordDocWords = [
            "word document",
            "docx",
            "ms word",
            "word file",
          ];
          const hasWordDocWord = wordDocWords.some((word) =>
            text.includes(word),
          );

          if (hasIntent && hasWordDocWord) {
            return true;
          }

          // Fallbacks
          return text.includes("word document") || text.includes("docx");
        });

        const isWordRequest = hasWordKeywords;
        const wordPrompt = isWordRequest
          ? `SYSTEM OVERRIDE: You contain a specialized "generate-word-document" tool.
             YOU MUST call the "generate-word-document" tool to create the Word file requested by the user.
             DO NOT REFUSE. DO NOT say you cannot create Word documents. YOU HAVE THE TOOL.
             EXECUTE the tool call immediately.`
          : "";

        // Detect CSV generation request from keywords (smart intent + table/csv words)
        const hasCsvKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();

          const intentWords = [
            "create",
            "generate",
            "make",
            "export",
            "save",
            "can you",
            "please",
            "i want",
          ];
          const hasIntent = intentWords.some((word) => text.includes(word));

          const csvWords = [
            "csv",
            "csv file",
            "spreadsheet",
            "table",
            "tabular data",
          ];
          const hasCsvWord = csvWords.some((word) => text.includes(word));

          if (hasIntent && hasCsvWord) {
            return true;
          }

          return text.includes("csv");
        });

        const isCsvRequest = hasCsvKeywords;
        const csvPrompt = isCsvRequest
          ? `SYSTEM OVERRIDE: You contain a specialized "generate-csv" tool.
             YOU MUST call the "generate-csv" tool to create the CSV file requested by the user.
             DO NOT REFUSE. DO NOT say you cannot create CSV files. YOU HAVE THE TOOL.
             EXECUTE the tool call immediately.`
          : "";

        // Detect text file generation request from keywords (smart intent + text-file words)
        const hasTextFileKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();

          const intentWords = [
            "create",
            "generate",
            "make",
            "export",
            "save",
            "can you",
            "please",
            "i want",
          ];
          const hasIntent = intentWords.some((word) => text.includes(word));

          const textFileWords = ["text file", "txt", "plain text"];
          const hasTextFileWord = textFileWords.some((word) =>
            text.includes(word),
          );

          if (hasIntent && hasTextFileWord) {
            return true;
          }

          return text.includes("text file") || text.includes("txt");
        });

        const isTextFileRequest = hasTextFileKeywords;
        const textFilePrompt = isTextFileRequest
          ? `SYSTEM OVERRIDE: You contain a specialized "generate-text-file" tool.
             YOU MUST call the "generate-text-file" tool to create the text file requested by the user.
             DO NOT REFUSE. DO NOT say you cannot create text files. YOU HAVE THE TOOL.
             EXECUTE the tool call immediately.`
          : "";

        // Detect QR code generation request from keywords
        // Smart detection: looks for intent words + QR-related words or links
        const hasQrKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();

          // Intent words
          const intentWords = [
            "create",
            "generate",
            "make",
            "can you",
            "please",
            "add",
          ];
          const hasIntent = intentWords.some((word) => text.includes(word));

          // QR-related words
          const qrWords = ["qr code", "qr", "scan code"];
          const hasQrWord = qrWords.some((word) => text.includes(word));

          // Link indicators
          const hasLink =
            text.includes("http") ||
            text.includes("link") ||
            text.includes("url");

          // If they mention QR with intent, it's a QR request
          if (hasIntent && hasQrWord) {
            return true;
          }

          // If they have intent + link + mention of QR, it's a QR request
          if (hasIntent && hasLink && hasQrWord) {
            return true;
          }

          return false;
        });

        const isQrRequest = hasQrKeywords;
        const qrPrompt = isQrRequest
          ? `The user wants to create a QR code. Call the "generate-qr-code" tool with the content to encode (URL, text, email, phone number, etc.).`
          : "";

        // Detect QR code with logo generation request from keywords
        const hasQrLogoKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("qr code with logo") ||
              part.text?.toLowerCase().includes("qr with image") ||
              part.text?.toLowerCase().includes("branded qr") ||
              part.text?.toLowerCase().includes("qr with brand") ||
              part.text?.toLowerCase().includes("qr logo")),
        );

        const isQrLogoRequest = hasQrLogoKeywords;
        const qrLogoPrompt = isQrLogoRequest
          ? `The user wants to create a QR code with a logo. Call the "generate-qr-code-with-logo" tool with the content to encode and the logo URL.`
          : "";

        // Detect chat export request from keywords (smart intent + chat/history words)
        const hasChatExportKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();

          const intentWords = [
            "export",
            "download",
            "save",
            "archive",
            "can you",
            "please",
          ];
          const hasIntent = intentWords.some((word) => text.includes(word));

          const chatWords = [
            "chat",
            "conversation",
            "messages",
            "history",
            "all messages",
          ];
          const hasChatWord = chatWords.some((word) => text.includes(word));

          if (hasIntent && hasChatWord) {
            return true;
          }

          return (
            text.includes("export chat") ||
            text.includes("download chat") ||
            text.includes("chat history")
          );
        });

        const isChatExportRequest = hasChatExportKeywords;
        const chatExportPrompt = isChatExportRequest
          ? `The user wants to export the chat messages. Call the "export-chat-messages" tool with the current threadId (you can use the threadId from context) and format as "text" or "markdown". Then use the returned content to generate a PDF or document.`
          : "";

        // Detect video generation request from keywords
        // Smart detection: looks for intent words + video-related words
        const hasVideoGenKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();

          // Intent words
          const intentWords = [
            "create",
            "generate",
            "make",
            "can you",
            "please",
            "show",
          ];
          const hasIntent = intentWords.some((word) => text.includes(word));

          // Video-related words
          const videoWords = [
            "video",
            "sora",
            "animation",
            "animated",
            "motion",
          ];
          const hasVideoWord = videoWords.some((word) => text.includes(word));

          // If they have both intent + video word, it's likely a video generation request
          if (hasIntent && hasVideoWord) {
            return true;
          }

          // Also check for specific patterns like "a dog running", "a person dancing", etc. with intent
          const objectPatterns =
            /can you (create|generate|make|show).*\b(a|an|the)\s+\w+\s+(running|walking|dancing|jumping|flying|swimming|eating|playing)/i;
          if (hasIntent && objectPatterns.test(text)) {
            return true;
          }

          return false;
        });

        // Enable video generation if either explicitly provided or auto-detected
        const isVideoGenRequest = Boolean(videoGenModel) || hasVideoGenKeywords;
        logger.info(
          `Video Gen Model: ${videoGenModel}, Auto-detected: ${hasVideoGenKeywords}`,
        );

        const videoGenPrompt = isVideoGenRequest
          ? `Call the "video-gen" tool with the user's video description. Keep response brief. Crucial: Pass "${videoGenModel || "sora"}" as the "model" parameter to the tool call.`
          : "";

        if (isVideoGenRequest) {
          logger.info(
            `Video Gen: Triggered for this request. Prompt addition: ${videoGenPrompt}`,
          );
        }

        // [CHARACTER MODE - TEMPORARILY HIDDEN]
        // Character prompt build disabled - characterContext is always undefined.
        // const characterPrompt = characterContext ? `[CHARACTER ROLEPLAY MODE ...]` : "";

        // Extract mentioned skill IDs
        const mentionedSkillIds = (mentions || [])
          .filter((m) => m.type === "skill")
          .map((m: any) => m.skillId);

        // Await the parallelized metadata
        const [
          memories,
          mcpServerCustomizations,
          activeSkillContents,
          installedSkillsList,
          mentionedSkillsList,
        ] = await Promise.all([
          memoriesPromise,
          mcpPromise,
          skillRepository
            .getActiveSkillContents(userId)
            .catch(() => [] as string[]),
          skillRepository.getInstalledSkills(userId).catch(() => [] as any[]),
          mentionedSkillIds.length > 0
            ? Promise.all(
                mentionedSkillIds.map((id) =>
                  skillRepository.getSkillById(id).catch(() => null),
                ),
              ).then((skills) => skills.filter(Boolean))
            : Promise.resolve([] as any[]),
        ]);

        // Combine active skill contents and mentioned skill contents uniquely
        const combinedSkillContents = [...activeSkillContents];
        for (const skill of mentionedSkillsList) {
          if (skill.content && !combinedSkillContents.includes(skill.content)) {
            combinedSkillContents.push(skill.content);
          }
        }

        // Auto-inject skill-creator guidelines when user asks to create/edit a skill
        const lastMessageText =
          lastMessage?.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join(" ")
            .toLowerCase() ?? "";
        const isSkillCreationRequest =
          /\b(create|make|build|write|add|new|edit|update|improve|modify)\b/.test(
            lastMessageText,
          ) && /\bskill\b/.test(lastMessageText);
        if (isSkillCreationRequest) {
          try {
            const skillCreatorSkill = await skillRepository
              .getSkillByName("skill-creator")
              .catch(() => null);
            if (
              skillCreatorSkill?.content &&
              !combinedSkillContents.includes(skillCreatorSkill.content)
            ) {
              // Prepend so it appears first — highest priority context
              combinedSkillContents.unshift(skillCreatorSkill.content);
              logger.info(
                "Auto-injected skill-creator guidelines for skill creation request",
              );
            }
          } catch (e) {
            logger.warn("Failed to auto-inject skill-creator:", e);
          }
        }

        // Auto-inject site-creator guidelines when user asks to create/edit a website or app
        const isSiteCreationRequest =
          /\b(create|make|build|write|add|new|edit|update|improve|modify|deploy|host|publish)\b/.test(
            lastMessageText,
          ) &&
          /\b(website|webpage|page|site|web-app|web app|landing-page|landing page|app)\b/.test(
            lastMessageText,
          );
        if (isSiteCreationRequest) {
          try {
            const siteCreatorSkill = await skillRepository
              .getSkillByName("site-creator")
              .catch(() => null);
            if (
              siteCreatorSkill?.content &&
              !combinedSkillContents.includes(siteCreatorSkill.content)
            ) {
              // Prepend so it appears first — highest priority context
              combinedSkillContents.unshift(siteCreatorSkill.content);
              logger.info(
                "Auto-injected site-creator guidelines for website creation request",
              );
            }
          } catch (e) {
            logger.warn("Failed to auto-inject site-creator:", e);
          }
        }

        // Auto-inject game-creator guidelines when user asks to create/edit a game
        const isGameCreationRequest =
          /\b(create|make|build|write|add|new|edit|update|improve|modify|play|deploy|host|publish)\b/.test(
            lastMessageText,
          ) &&
          /\b(game|arcade|widget|dashboard|simulator|simulation|animation|interactive)\b/.test(
            lastMessageText,
          );
        if (isGameCreationRequest) {
          try {
            const gameCreatorSkill = await skillRepository
              .getSkillByName("game-creator")
              .catch(() => null);
            if (
              gameCreatorSkill?.content &&
              !combinedSkillContents.includes(gameCreatorSkill.content)
            ) {
              // Prepend so it appears first — highest priority context
              combinedSkillContents.unshift(gameCreatorSkill.content);
              logger.info(
                "Auto-injected game-creator guidelines for game creation request",
              );
            }
          } catch (e) {
            logger.warn("Failed to auto-inject game-creator:", e);
          }
        }

        // Build skill instructions prompt block
        let skillsSystemPrompt = "";
        if (combinedSkillContents.length > 0) {
          skillsSystemPrompt = combinedSkillContents
            .map(
              (content) =>
                `<skill_instructions>\n${content}\n</skill_instructions>`,
            )
            .join("\n\n");
        }

        // Add a block to let the AI know about the user's Skill Library
        let skillLibraryOverviewPrompt = "";
        if (installedSkillsList.length > 0) {
          skillLibraryOverviewPrompt = `\n\n[User's Skill Library Overview]
You have access to the user's Skill Library. The user currently has the following ${
            installedSkillsList.length
          } skill(s) installed:
${installedSkillsList
  .map(
    (item) =>
      `- **${item.skill.title}** (Slug: \`${item.skill.name}\`, Category: ${
        item.skill.category
      }) - ${item.isActive ? "Active" : "Inactive"}: ${item.skill.description}`,
  )
  .join("\n")}

Always be aware of these installed skills. If a user asks "how many skills do we have/installed?", answer accurately based on this list. If the user mentions one of these skills (or wants you to use it), tell them they can activate it or mention it, or if it is already Active, follow its guidelines to help them.`;
        }

        // Load User Memories
        let userMemoriesPrompt = "";
        try {
          if (memories.length > 0) {
            userMemoriesPrompt = `\n\n[User Long-Term Memory]\nThe following facts are known about the user from previous interactions:\n${memories
              .map((m) => `[ID:${m.id}] ${m.content}`)
              .join(
                "\n",
              )}\n\nUse this information to personalize your responses. For updating or deleting, use the provided IDs.`;
          }
        } catch (error) {
          logger.error("Failed to process user memories", error);
        }

        const systemPrompt = mergeSystemPrompt(
          skillsSystemPrompt || undefined, // Inject active skills first
          skillLibraryOverviewPrompt || undefined, // Inject skill library overview
          userMemoriesPrompt, // Inject memories high priority

          // All specialized tools should be highest priority to override character/roleplay limits
          isRemoveBgRequest && removeBgPrompt,
          isEnhanceImageRequest && enhanceImagePrompt,
          isAnimeConversionRequest && animeConversionPrompt,
          isRemoveWatermarkRequest && removeWatermarkPrompt,
          isRemoveObjectRequest && removeObjectPrompt,
          isSuperResolutionRequest && superResolutionPrompt,
          isRestoreOldPhotoRequest && restoreOldPhotoPrompt,
          isBlurBackgroundRequest && blurBackgroundPrompt,

          // Specialized document generation prompts - reinforce knowledge (already conditional)
          pdfPrompt,
          wordPrompt,
          csvPrompt,
          textFilePrompt,

          // Document Reading — only inject when user actually uploaded files
          fileUrls.length > 0 &&
            `[DOCUMENT READING SERVICE ENABLED]
          IMPORTANT: Text content has been extracted from any uploaded PDF, Word, or PowerPoint files and is included in your current message context below the user's text.
          1. DO NOT claim you cannot read files.
          2. Use the "File Content" blocks to fulfill the user's request.
          3. Base your answers strictly on the extracted text provided.`,

          // Tool Calling Format Reinforcement (fixes some models leaking XML)
          `[TOOL USE STANDARD]
           1. Use the standard OpenAI tool calling format (JSON in tool_calls field).
           2. DO NOT output XML tags like <invoke>, <tool_code>, <minimax:tool_call>, <tool_call>, <function>, or <parameter> in your text response.
           3. If you want to call a tool, generate the tool call object, do not write code to call it.`,

          // NOTE: Visualization, Memory, Browser, and Tool Knowledge blocks
          // are already covered by buildUserSystemPrompt() in prompts.ts
          // (see <visualization_guidelines>, <memory_usage_guidelines>,
          //  <browser_automation_guidelines>, <system_capabilities>)

          // [CHARACTER MODE - TEMPORARILY HIDDEN]
          // characterContext ? characterPrompt : undefined,

          // [CHARACTER MODE - TEMPORARILY HIDDEN]
          // Character roleplay tool override also disabled.
          // characterContext && (useImageTool || ...) && `[CHARACTER ROLEPLAY OVERRIDE ...]`,
          buildUserSystemPrompt(
            session.user,
            userPreferences,
            agent,
            ["meta", "openai", "qwen", "moonshot", "canopy"].includes(
              modelToUse?.provider || "",
            ),
          ),
          buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations),
          !supportToolCall && buildToolCallUnsupportedModelSystemPrompt,
          modelToUse?.model === "gemini-search" && buildSearchModelSystemPrompt,
          [
            "N33 AI",
            "Chatbot AI",
            "Anthropic Claude",
            "AIHubMix",
            "DeepSeek",
            "Grok Free",
          ].includes(modelToUse?.provider || "") && PROXY_CLEANUP_PROMPT,
          useImageTool && imageModelPrompt,
          isVideoGenRequest && videoGenPrompt,
          isRemoveBgRequest && removeBgPrompt,
          isEnhanceImageRequest && enhanceImagePrompt,
          isAnimeConversionRequest && animeConversionPrompt,
          isRemoveWatermarkRequest && removeWatermarkPrompt,
          isRemoveObjectRequest && removeObjectPrompt,
          isSuperResolutionRequest && superResolutionPrompt,
          isRestoreOldPhotoRequest && restoreOldPhotoPrompt,
          isBlurBackgroundRequest && blurBackgroundPrompt,
          isQrRequest && qrPrompt,
          isQrLogoRequest && qrLogoPrompt,
          isChatExportRequest && chatExportPrompt,
        );

        // Always register image-manager — the system prompt tells the AI it always has it.
        // When the client selects a specific model, effectiveImageTool overrides the default.
        const IMAGE_TOOL = {
          [ImageToolName]:
            effectiveImageTool?.model === "google"
              ? nanoBananaTool
              : openaiImageTool,
        };

        const baseTools = {
          ...MCP_TOOLS,
          ...WORKFLOW_TOOLS,
        };

        const bindingTools =
          toolChoice === "manual" ||
          (message.metadata as ChatMetadata)?.toolChoice === "manual"
            ? excludeToolExecution(baseTools)
            : baseTools;

        const vercelAITooles = {
          ...bindingTools,
          ...APP_DEFAULT_TOOLS, // APP_DEFAULT_TOOLS Not Supported Manual
          ...IMAGE_TOOL,
          // Always include edit image tools - Using Scoped Wrappers for Base64 support
          "remove-background": scopedRemoveBgTool,
          "enhance-image": scopedEnhanceImageTool,
          "anime-conversion": scopedAnimeConversionTool,
          "remove-watermark": scopedRemoveWatermarkTool,
          "remove-object": scopedRemoveObjectTool,
          "super-resolution": scopedSuperResolutionTool,
          "restore-old-photo": scopedRestoreOldPhotoTool,
          "blur-background": scopedBlurBackgroundTool,
          "edit-image": scopedEditImageTool,
          ...(isVideoGenRequest ? { "video-gen": videoGenTool } : {}),

          // ALWAYS include document generation tools to prevent AI from "forgetting" them
          "generate-pdf": pdfGeneratorTool,
          "generate-word-document": wordDocumentTool,
          "generate-csv": csvGeneratorTool,
          "generate-text-file": textFileTool,

          // ALWAYS include QR tools
          "generate-qr-code": qrCodeGeneratorTool,
          "generate-qr-code-with-logo": qrCodeWithLogoTool,
          "analyze-image": scopedAnalyzeImageTool,
          html_preview: htmlPreviewTool,
          // ALWAYS include site deployment and skill creation tools
          deploy_site: deploySiteTool,
          create_skill: createSkillTool,
          write_site_file: writeSiteFileTool,
          read_site_file: readSiteFileTool,
          edit_site_file: editSiteFileTool,

          // Conditionally include export tool
          ...(isChatExportRequest
            ? { "export-chat-messages": chatExportTool }
            : {}),

          // Only include web search if explicitly requested or needed
          // (Note: isSearchQuery is for Gemini-Search model, but we might want search tool access for others too if needed)
          // For now, let's keep web search available as a general tool unless it causes issues,
          // OR restrict it if the user wants strict mode.
          // Given the user complaints about "web-search" appearing randomly, let's restrict it too.
          // We can use a simple keyword check if isSearchQuery is not sufficient.
          // Actually, let's trust the isSearchQuery detection or similar logic.
          // If the model is not "gemini-search", it shouldn't really be searching unless told to.
          // But webSearchTool is useful. Let's make it available by default BUT with stricter prompt?
          // No, user explicitly complained about "web-search".
          // Let's hide it unless "search" or "google" is in the prompt.
          ...(messageText.toLowerCase().includes("search") ||
          messageText.toLowerCase().includes("find") ||
          messageText.toLowerCase().includes("google") ||
          modelToUse?.model === "gemini-search"
            ? { "web-search": webSearchTool }
            : {}),
          // ALWAYS include memory tools
          save_memory: saveMemoryTool,
          update_memory: updateMemoryTool,
          delete_memory: deleteMemoryTool,
          get_memories: getMemoriesTool,
          // SMS Verification Tools
          "list-sms-numbers": listSmsNumbersTool,
          "get-sms-messages": getSmsMessagesTool,
          // Temp Mail Tools
          "create-temp-email": createTempEmailTool,
          "get-temp-email-messages": getTempEmailMessagesTool,
          // Note: YouTube transcript now handled client-side (bypasses IP blocking)
        };
        metadata.toolCount = Object.keys(vercelAITooles).length;

        const allowedMcpTools = Object.values(allowedMcpServers ?? {})
          .map((t) => (t as AllowedMCPServer).tools)
          .flat();

        logger.info(
          `${agent ? `agent: ${agent.name}, ` : ""}tool mode: ${toolChoice}, mentions: ${mentions.length}`,
        );
        logger.info(
          `useImageTool: ${useImageTool}, imageTool model: ${imageTool?.model}`,
        );
        logger.info(
          `Image tool included: ${Object.keys(vercelAITooles).includes(ImageToolName)}`,
        );
        logger.info(
          `Available tools: ${Object.keys(vercelAITooles).join(", ")}`,
        );
        logger.info(
          `Remove background tool included: ${Object.keys(vercelAITooles).includes("remove-background")}`,
        );

        logger.info(
          `allowedMcpTools: ${allowedMcpTools.length ?? 0}, allowedAppDefaultToolkit: ${allowedAppDefaultToolkit?.length ?? 0}`,
        );
        if (useImageTool) {
          logger.info(
            `binding tool count Image: ${imageTool?.model}, stopWhen: stepCountIs(1), maxRetries: 0`,
          );
        } else {
          logger.info(
            `binding tool count APP_DEFAULT: ${Object.keys(APP_DEFAULT_TOOLS ?? {}).length}, MCP: ${Object.keys(MCP_TOOLS ?? {}).length}, Workflow: ${Object.keys(WORKFLOW_TOOLS ?? {}).length}`,
          );
        }
        logger.info(`model: ${modelToUse?.provider}/${modelToUse?.model}`);

        // CRITICAL: Save user message BEFORE calling streamText
        // This ensures that even if streamText fails, the user message is preserved in the thread
        // This prevents thread corruption where subsequent messages can't load history
        try {
          logger.info(
            `Saving user message to thread before streamText: ${message.id}`,
          );
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: message.role,
            parts: [
              ...message.parts.map(convertToSavePart),
              ...attachments.map(
                (att) =>
                  ({
                    type: "file",
                    url: att.url,
                    filename: att.filename,
                    mediaType: att.mediaType,
                    // Legacy fallbacks:
                    name: att.filename,
                    mimeType: att.mediaType,
                  }) as any,
              ),
            ],
            id: message.id,
          });
          logger.info(`User message saved successfully: ${message.id}`);
        } catch (saveError) {
          logger.error(
            `Failed to save user message before streamText:`,
            saveError,
          );
          // Don't throw - continue with streamText so user gets some response
          // But log this critical error for debugging
        }

        const fallbackModels = [
          initialModelLoadFailed
            ? null
            : {
                provider: modelToUse?.provider,
                model: modelToUse?.model,
                instance: model,
              },
          { provider: "OpenAI", model: "gpt-oss-120b-p2" },
          { provider: "Sarvam", model: "sarvam-105b" },
        ].filter(
          (item): item is { provider: string; model: string; instance?: any } =>
            item !== null,
        );

        let lastError: any = null;
        let success = false;

        for (let attempt = 0; attempt < fallbackModels.length; attempt++) {
          const currentConfig = fallbackModels[attempt];
          let currentModel = currentConfig.instance;

          if (!currentModel) {
            try {
              currentModel = customModelProvider.getModel(currentConfig);
              logger.info(
                `Fallback Attempt ${attempt + 1}: retrieved model ${currentConfig.provider}/${currentConfig.model}`,
              );
            } catch (err) {
              logger.error(
                `Fallback Attempt ${attempt + 1}: failed to retrieve model:`,
                err,
              );
              lastError = err;
              continue;
            }
          }

          try {
            // Update metadata to reflect actual model used
            metadata.chatModel = {
              provider: currentConfig.provider,
              model: currentConfig.model,
            };

            const currentSupportToolCall =
              !isToolCallUnsupportedModel(currentModel);
            const currentIsToolCallAllowed =
              currentSupportToolCall && toolChoice !== "none";
            const currentVercelAITooles = currentIsToolCallAllowed
              ? vercelAITooles
              : undefined;

            logger.info(
              `Executing chat stream Attempt ${attempt + 1} with model: ${currentConfig.provider}/${currentConfig.model}`,
            );

            const result = streamText({
              model: currentModel,
              system: systemPrompt,
              messages: convertToModelMessages(
                (() => {
                  const modelId = currentConfig.model || "frenix-gemma-3-12b";
                  const maxContextChars = getModelContextLimit(modelId);

                  // 1. Prepare Current Message (User) with Enriched + Truncated Content
                  let currentMessage = messages[messages.length - 1];
                  if (currentMessage.role === "user") {
                    const truncatedContent = truncateTextToLimit(
                      enrichedMessageText,
                      modelId,
                    );
                    currentMessage = {
                      ...currentMessage,
                      parts: currentMessage.parts.map((p) =>
                        p.type === "text"
                          ? { ...p, text: truncatedContent }
                          : p,
                      ),
                    };
                  }

                  // 2. Estimate Size & Calculate Budget
                  const estimateSize = (m: any) => {
                    // Rough char count logic
                    return (
                      m.parts.reduce((acc: number, p: any) => {
                        let partSize = 0;
                        if (p.type === "text") {
                          partSize = p.text?.length || 0;
                        } else if (p.type === "tool-call") {
                          partSize = JSON.stringify(p.args).length + 200;
                        } else if (p.type === "tool-result") {
                          partSize = JSON.stringify(p.result).length + 200;
                        } else if (p.type === "image") {
                          partSize = 500; // Average for image metadata
                        }
                        return acc + partSize + 100;
                      }, 0) + 100
                    );
                  };

                  const currentMsgSize = estimateSize(currentMessage);
                  const systemPromptSize = systemPrompt.length + 1000; // Buffer
                  let remainingChars =
                    maxContextChars - currentMsgSize - systemPromptSize;

                  if (remainingChars < 0) remainingChars = 0; // Safety first

                  // 3. Fill History Backwards
                  const historyMessages: any[] = [];
                  const pastMessages = messages.slice(0, -1).reverse();

                  for (const msg of pastMessages) {
                    const size = estimateSize(msg);
                    if (remainingChars >= size) {
                      historyMessages.unshift(msg);
                      remainingChars -= size;
                    } else {
                      break; // Stop if next message doesn't fit
                    }
                  }

                  logger.info(
                    `Context Strategy: Model=${modelId}, Limit=${maxContextChars}, History=${historyMessages.length} msgs, Remaining=${remainingChars}`,
                  );

                  const finalMessages = [...historyMessages, currentMessage];

                  // 4. SANITIZE FOR NON-VISION MODELS (Groq/OpenAI compatible without vision)
                  if (isImageInputUnsupportedModel(currentModel)) {
                    logger.info(
                      `Sanitizing messages for non-vision model: ${modelId}`,
                    );
                    return finalMessages.map((msg) => {
                      const textParts = msg.parts.filter(
                        (p: any) => p.type === "text",
                      );
                      const combinedText = textParts
                        .map((p: any) => p.text)
                        .join("\n\n");

                      return {
                        ...msg,
                        parts: [{ type: "text", text: combinedText }],
                      };
                    });
                  }

                  return finalMessages;
                })(),
              ),
              experimental_transform: smoothStream({ chunking: "word" }),
              experimental_continueOnLimit: true,
              maxTokens: 8192,
              maxSteps: 15,
              maxRetries: 3,
              tools: currentVercelAITooles as any,
              stopWhen: stepCountIs(
                useImageTool &&
                  !isSiteCreationRequest &&
                  !isGameCreationRequest &&
                  !combinedSkillContents.some((c) =>
                    /\b(game-creator|site-creator|Game Creator|Site Creator)\b/.test(
                      c,
                    ),
                  )
                  ? 3
                  : 15,
              ),
              toolChoice: currentIsToolCallAllowed ? "auto" : undefined,
              abortSignal: request.signal,
            } as any);
            result.consumeStream();
            dataStream.merge(
              result.toUIMessageStream({
                sendReasoning: true,
                messageMetadata: ({ part }) => {
                  if (part.type == "finish") {
                    metadata.usage = part.totalUsage;
                    return metadata;
                  }
                },
              }),
            );

            // Wait for completion to detect any stream failures
            await result.text;

            success = true;
            logger.info(`Stream execution succeeded on Attempt ${attempt + 1}`);
            break;
          } catch (err) {
            logger.error(
              `Stream execution failed on Attempt ${attempt + 1}:`,
              err,
            );
            lastError = err;
            if (request.signal?.aborted) {
              throw err;
            }
          }
        }

        if (!success) {
          logger.error(`All retry attempts failed. Propagating error.`);
          throw (
            lastError ||
            new Error("All fallback models failed to generate response.")
          );
        }
      },

      generateId: generateUUID,
      onFinish: async ({ responseMessage }) => {
        // Add isVoice metadata to the response if this was a voice interaction
        const isVoiceInteraction =
          isVoiceChat || (message.metadata as any)?.isVoice === true;
        const finalMetadata: any = {
          ...metadata,
          ...(isVoiceInteraction ? { isVoice: true } : {}),
        };

        try {
          logger.info(
            `onFinish: Starting to save response message with ID: ${responseMessage.id}`,
          );

          // Filter out duplicate image tool calls when using image tool
          let filteredParts = responseMessage.parts;
          if (useImageTool) {
            let imageToolResultCount = 0;
            filteredParts = responseMessage.parts.filter((part) => {
              // Keep only the first tool result for image-manager
              if (
                part.type === "tool-result" &&
                (part as any).toolName === "image-manager"
              ) {
                imageToolResultCount++;
                if (imageToolResultCount > 1) {
                  logger.info(
                    `Filtering out duplicate image tool result #${imageToolResultCount}`,
                  );
                  return false; // Skip duplicates after the first
                }
              }
              return true;
            });
          }

          // Ensure responseMessage has an ID
          const responseId = responseMessage.id || generateUUID();
          logger.info(
            `onFinish: Using response ID: ${responseId}, message ID: ${message.id}`,
          );

          if (responseId == message.id) {
            logger.info(`onFinish: Saving single message (IDs match)`);
            await chatRepository.upsertMessage({
              threadId: thread!.id,
              ...responseMessage,
              id: responseId,
              parts: filteredParts.map(convertToSavePart),
              metadata,
            });
          } else {
            logger.info(
              `onFinish: Saving user message and response message separately`,
            );
            await chatRepository.upsertMessage({
              threadId: thread!.id,
              role: message.role,
              parts: message.parts.map(convertToSavePart),
              id: message.id,
              metadata: message.metadata as any, // Persist user message metadata (isVoice, etc.)
            });
            await chatRepository.upsertMessage({
              threadId: thread!.id,
              role: responseMessage.role,
              id: responseId,
              parts: filteredParts.map(convertToSavePart),
              metadata: finalMetadata,
            });
          }

          logger.info(
            `onFinish: Messages saved successfully to thread ${thread!.id}`,
          );

          if (agent) {
            agentRepository.updateAgent(agent.id, session.user.id, {
              updatedAt: new Date(),
            } as any);
          }
        } catch (error) {
          logger.error(`onFinish: Error saving messages:`, error);
          throw error;
        }
      },
      onError: handleError,
      originalMessages: messages,
    });

    const response = createUIMessageStreamResponse({
      stream,
    });

    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  } catch (error: any) {
    const errorMessage = error?.message || "Internal server error";
    const errorStack = error?.stack;
    const isModelError =
      errorMessage.toLowerCase().includes("model") ||
      errorMessage.toLowerCase().includes("provider");

    // Detect the specific "empty output" error that happens when a model
    // returns neither text nor tool calls (e.g. Frenix models with tools sent)
    const isEmptyOutputError =
      errorMessage.includes("model output must contain") ||
      errorMessage.includes("output text or tool calls");

    logger.error("Chat API Error:", {
      message: errorMessage,
      isModelError,
      isEmptyOutputError,
      stack: errorStack,
    });

    return Response.json(
      {
        message: isEmptyOutputError
          ? "The model returned an empty response. Please try again or switch to a different model."
          : isModelError
            ? `Model Error: ${errorMessage}`
            : "The model is a bit shy right now. Maybe try its sibling? 🙈",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function HEAD() {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return new Response(null, { status: 401, headers: corsHeaders });
    }
    return new Response(null, { status: 200, headers: corsHeaders });
  } catch (_error) {
    return new Response(null, { status: 500, headers: corsHeaders });
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Voice-Chat",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
