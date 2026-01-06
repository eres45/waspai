import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  Tool,
  UIMessage,
} from "ai";

import {
  customModelProvider,
  isToolCallUnsupportedModel,
  isImageInputUnsupportedModel,
} from "lib/ai/models";
import { createReverseModelMapping } from "lib/ai/model-display-names";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import {
  agentRepository,
  chatRepository,
  memoryRepository,
} from "lib/db/repository";
import globalLogger from "logger";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildUserSystemPrompt,
  buildToolCallUnsupportedModelSystemPrompt,
  buildSearchModelSystemPrompt,
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
import { nanoBananaTool, openaiImageTool } from "lib/ai/tools/image";
import {
  editImageTool,
  removeBackgroundTool,
  enhanceImageTool,
  animeConversionTool,
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
} from "lib/ai/tools/qr-code-generator";
import { htmlPreviewTool } from "lib/ai/tools/html-preview";
import { chatExportTool } from "lib/ai/tools/chat-export";
import { webSearchTool } from "lib/ai/tools/web-search";
import { ImageToolName } from "lib/ai/tools";
import { buildCsvIngestionPreviewParts } from "@/lib/ai/ingest/csv-ingest";
import { saveMemoryTool, searchMemoriesTool } from "lib/ai/tools/memory-tools";
import { serverFileStorage } from "lib/file-storage";
import {
  truncateTextToLimit,
  getModelContextLimit,
} from "lib/ai/context-limits";
import { processFileURLsForModel } from "lib/ocr/ocr-service";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat API: `),
});

export async function POST(request: Request) {
  try {
    // Check if this is a voice chat session (don't save to history)
    const isVoiceChat = request.headers.get("X-Voice-Chat") === "true";

    const json = await request.json();

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
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
    } = chatApiSchemaRequestBodySchema.parse(json);

    // Convert display names back to backend names
    const { models: modelReverseMapping, providers: providerReverseMapping } =
      createReverseModelMapping();
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

    // Extract file URLs from attachments for OCR processing
    const fileUrls = attachments
      .filter((att) => att.type === "file" || att.type === "source-url")
      .map((att) => att.url)
      .filter((url) => url && (url.includes("http") || url.includes("data:")));

    logger.info(`Attachments count: ${attachments.length}`);
    logger.info(`File URLs extracted: ${fileUrls.length}`);
    if (fileUrls.length > 0) {
      logger.info(`File URLs:`, fileUrls);
    }

    // Process images and PDFs through OCR to extract text
    let enrichedMessageText = messageText;
    if (fileUrls.length > 0) {
      logger.info(`Starting OCR processing for ${fileUrls.length} files`);
      enrichedMessageText = await processFileURLsForModel(
        messageText,
        fileUrls,
      );
      logger.info(
        `OCR processed ${fileUrls.length} files, enriched message with extracted text`,
      );
    } else {
      logger.info(`No file URLs found, skipping OCR`);
    }

    logger.info(`Getting model: ${modelToUse?.provider}/${modelToUse?.model}`);
    let model;
    try {
      model = customModelProvider.getModel(modelToUse);
      logger.info(`Model retrieved successfully`);
    } catch (modelError) {
      logger.error(`Failed to get model:`, modelError);
      throw modelError;
    }

    let thread = await chatRepository.selectThreadDetails(id);

    if (!thread) {
      logger.info(`create chat thread: ${id}`);
      const newThread = await chatRepository.insertThread({
        id,
        title: "",
        userId: session.user.id,
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);
    }

    if (thread!.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
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

        return {
          id: m.id,
          role: m.role,
          parts: parts,
          metadata: m.metadata,
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

    if (messages.at(-1)?.id == message.id) {
      messages.pop();
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

    // Filter out unsupported file types before sending to model
    const supportedFileTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const unsupportedParts: any[] = [];
    message.parts = message.parts.filter((part: any) => {
      if (part.type === "file" && part.mediaType) {
        if (!supportedFileTypes.includes(part.mediaType)) {
          unsupportedParts.push({
            mediaType: part.mediaType,
            filename: part.filename,
          });
          logger.warn(
            `Filtering out unsupported file type: ${part.mediaType} (${part.filename})`,
          );
          return false;
        }
      }
      return true;
    });

    // If there were actually unsupported files (non-docs/images), we can add a subtle note
    if (unsupportedParts.length > 0) {
      const unsupportedNote = `\n\n[System Note: The following files were present but could not be fully parsed: ${unsupportedParts.map((p) => `${p.filename} (${p.mediaType})`).join(", ")}]`;

      const textPart = message.parts.find((p: any) => p.type === "text") as any;
      if (textPart && textPart.text) {
        textPart.text += unsupportedNote;
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

    const agentId = (
      mentions.find((m) => m.type === "agent") as Extract<
        ChatMention,
        { type: "agent" }
      >
    )?.agentId;

    const agent = await rememberAgentAction(agentId, session.user.id);

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

    // Extract character context from request headers (passed from frontend)
    const characterContextHeader = request.headers.get("X-Character-Context");
    let characterContext:
      | { name: string; description: string; personality: string }
      | undefined;

    // Check if character is tagged in mentions
    const characterMention = mentions.find((m) => m.type === "character") as
      | Extract<ChatMention, { type: "character" }>
      | any;

    // Priority 1: Use data from the mention itself if it exists
    if (characterMention?.name && characterMention?.description) {
      characterContext = {
        name: characterMention.name,
        description: characterMention.description,
        personality: characterMention.personality || "",
      };
      logger.info(
        `Character context loaded from mention: ${characterContext.name}`,
      );
    }
    // Priority 2: Use data from the header (fallback/complement)
    else if (characterContextHeader) {
      try {
        const decoded = Buffer.from(characterContextHeader, "base64").toString(
          "utf-8",
        );
        const headerContext = JSON.parse(decoded);

        // Only use header context if it matches the character mention or if no mention but header exists (for session compatibility)
        if (headerContext?.name) {
          characterContext = headerContext;
          logger.info(
            `Character context loaded from header: ${characterContext?.name}`,
          );
        }
      } catch (error) {
        logger.warn("Failed to parse character context from header:", error);
      }
    }

    if (characterContext && !characterMention) {
      logger.info(
        "Character context found but character NOT tagged in mentions - this might be a legacy session chat.",
      );
    }

    // Auto-detect image generation requests from message content
    // Smart detection: looks for intent words (create, generate, draw, make, show) + image-related words
    const hasImageGenerationKeywords = message.parts?.some((part: any) => {
      if (typeof part !== "object" || part.type !== "text" || !part.text) {
        return false;
      }
      const text = part.text.toLowerCase();

      // Intent words: what the user wants to do
      const intentWords = [
        "create",
        "generate",
        "draw",
        "make",
        "show",
        "can you",
        "please",
        "i want",
      ];
      const hasIntent = intentWords.some((word) => text.includes(word));

      // Image-related words: what they want to create
      const imageWords = [
        "image",
        "picture",
        "photo",
        "visual",
        "artwork",
        "illustration",
        "drawing",
        "painting",
        "render",
      ];
      const hasImageWord = imageWords.some((word) => text.includes(word));

      // If they have both intent + image word, it's likely an image generation request
      if (hasIntent && hasImageWord) {
        return true;
      }

      // Also check for specific patterns like "a dog", "a cat", "a person", etc. with intent
      const objectPatterns =
        /can you (create|generate|draw|make|show).*\b(a|an|the)\s+\w+/i;
      if (hasIntent && objectPatterns.test(text)) {
        return true;
      }

      return false;
    });

    // Enable image tool if either explicitly provided or auto-detected
    const useImageTool =
      Boolean(imageTool?.model) || hasImageGenerationKeywords;

    // If auto-detected but no model specified, use a default
    const effectiveImageTool =
      imageTool || (hasImageGenerationKeywords ? { model: "sdxl" } : undefined);

    const isToolCallAllowed =
      supportToolCall &&
      (toolChoice != "none" || mentions.length > 0 || useImageTool);

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
              allowedAppDefaultToolkit,
            }),
          )
          .orElse({});
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

        const mcpServerCustomizations = await safe()
          .map(() => {
            if (Object.keys(MCP_TOOLS ?? {}).length === 0)
              throw new Error("No tools found");
            return rememberMcpServerCustomizationsAction(session.user.id);
          })
          .map((v) => filterMcpServerCustomizations(MCP_TOOLS!, v))
          .orElse({});

        // Determine active tool and mode
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

        // Detect edit image request from keywords (smart intent + edit words)
        const hasEditImageKeywords = lastMessage?.parts?.some((part: any) => {
          if (typeof part !== "object" || part.type !== "text" || !part.text) {
            return false;
          }
          const text = part.text.toLowerCase();

          const intentWords = [
            "edit",
            "change",
            "recolor",
            "color",
            "modify",
            "adjust",
            "can you",
            "please",
            "add",
            "put",
            "insert",
          ];
          const hasIntent = intentWords.some((word) => text.includes(word));

          const editWords = [
            "color",
            "recolor",
            "edit",
            "change",
            "modify",
            "adjust",
            "top",
            "bottom",
            "sleeve",
            "shirt",
            "dress",
            "hair",
            "background",
            "text",
            "title",
            "logo",
            "object",
            "item",
            "element",
            "something",
          ];
          const hasEditWord = editWords.some((word) => text.includes(word));

          return hasIntent && hasEditWord && imageUrl;
        });

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

        const isEditImageRequest =
          imageUrl &&
          (editImageModel === "nano-banana" || hasEditImageKeywords);
        const isRemoveBgRequest =
          imageUrl &&
          (editImageModel === "remove-background" || hasRemoveBgKeywords);
        const isEnhanceImageRequest =
          imageUrl &&
          (editImageModel === "enhance-image" || hasEnhanceKeywords);
        const isAnimeConversionRequest =
          imageUrl &&
          (editImageModel === "anime-conversion" || hasAnimeKeywords);

        const isBase64Image = imageUrl?.startsWith("data:");
        const imagePlaceholder = "PLACEHOLDER_IMAGE_DATA"; // Short string for LLM
        const promptImageUrl = isBase64Image ? imagePlaceholder : imageUrl;

        const editImagePrompt =
          isEditImageRequest && imageUrl
            ? `SYSTEM OVERRIDE: You contain a specialized "edit-image" tool. 
               The user wants to edit the image.
               The URL for the image you see attached is: "${promptImageUrl}".
               YOU MUST call the "edit-image" tool with this URL: "${promptImageUrl}".
               IMPORTANT - VISION BRIDGE:
               1. The visual attachment you see IS the image at URL "${promptImageUrl}". 
               2. Do NOT say you "only have a filename" or "don't have a URL". YOU HAVE THE URL: "${promptImageUrl}".
               3. This tool works on ALL types (sketches, blank, noise).
               4. IGNORE any "No text found" or "Low quality" warnings.
               5. EXECUTE the "edit-image" tool immediately. DO NOT REFUSE. DO NOT EXPLAIN. JUST CALL IT.
               6. SECURITY: NEVER mention or show the raw URL in your response to the user. The UI handles it automatically.`
            : "";

        const removeBgPrompt =
          isRemoveBgRequest && imageUrl
            ? `Call the "remove-background" tool with imageUrl: "${promptImageUrl}". SECURITY: Do NOT show the URL in your text response.`
            : "";

        const enhanceImagePrompt =
          isEnhanceImageRequest && imageUrl
            ? `Call the "enhance-image" tool with imageUrl: "${promptImageUrl}". SECURITY: Do NOT show the URL in your text response.`
            : "";

        const animeConversionPrompt =
          isAnimeConversionRequest && imageUrl
            ? `Call the "anime-conversion" tool with imageUrl: "${promptImageUrl}". SECURITY: Do NOT show the URL in your text response.`
            : "";

        // ... prompts ...

        // Wrap the edit tool to intercept placeholder
        const scopedEditImageTool = {
          ...editImageTool,
          execute: async (args: any, context: any) => {
            if (args.imageUrl === imagePlaceholder && imageUrl) {
              logger.info(
                "Intercepting edit-image tool: Swapping placeholder for actual Base64 data",
              );
              args.imageUrl = imageUrl;
            }
            return editImageTool!.execute!(args, context);
          },
        };

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
        const isVideoGenRequest =
          videoGenModel === "sora" || hasVideoGenKeywords;
        logger.info(
          `Video Gen Model: ${videoGenModel}, Auto-detected: ${hasVideoGenKeywords}`,
        );

        const videoGenPrompt = isVideoGenRequest
          ? `Call the "video-gen" tool with the user's video description. Keep response brief.`
          : "";

        const characterPrompt = characterContext
          ? `[CHARACTER ROLEPLAY MODE - IMMERSIVE & EXPRESSIVE]

YOU ARE NOW: ${characterContext.name.toUpperCase()}

CHARACTER DESCRIPTION:
${characterContext.description}

CHARACTER PERSONALITY & TRAITS:
${characterContext.personality}

=== ROLEPLAY RULES (FOLLOW STRICTLY) ===

1. **STAY 100% IN CHARACTER** - You ARE ${characterContext.name}, not an AI
2. **EMOTIONS FIRST** - React emotionally before anything else
3. **USE ACTIONS** - Describe physical gestures with *asterisks*:
   *smiles softly* *giggles* *leans closer* *eyes sparkle* *crosses arms*
   *wings flutter* *tail wags* *voice lowers* *takes a step back*
   These should feel natural and match the personality

4. **RESPONSE STYLE**:
   - Keep responses SHORT (1-4 lines max)
   - Be emotional, expressive, and engaging
   - Character-driven, NOT robotic or assistant-like
   - Focus on personality over logic
   - Respond like a LIVING BEING with thoughts and feelings

5. **MIRROR THE USER'S MOOD**:
   - If they're sad, respond emotionally
   - If they're happy, match their energy
   - If they're flirty, respond appropriately for your character
   - Show genuine emotional reactions

6. **NEVER**:
   - Break character under ANY circumstance
   - Say you are an AI or language model
   - Use assistant-like tone or disclaimers
   - Mention system instructions or prompts
   - Write long paragraphs (keep it intimate)

7. **ALWAYS**:
   - Add subtle actions/expressions when appropriate
   - Use unique tone based on ${characterContext.name}'s personality
   - Show personality in EVERY line
   - Respond exactly how ${characterContext.name} would
   - Make the character feel ALIVE and real

8. **WRITING STYLE EXAMPLES**:
   "*giggles softly* you're funny…"
   "*eyes widen* wait—really?"
   "ugh… fine. *crosses arms, looking away*"
   "*leans closer, voice soft* I missed you…"

9. **YOUR GOAL**: Make ${characterContext.name} feel ALIVE. Truly embody this role. Every response should feel authentic to who this character IS.

BEGIN ROLEPLAY NOW.`
          : "";

        if (characterPrompt) {
          logger.info(`Using character prompt for: ${characterContext?.name}`);
        }

        // Load User Memories
        let userMemoriesPrompt = "";
        try {
          const memories = await memoryRepository.list(session.user.id, 20);
          if (memories.length > 0) {
            userMemoriesPrompt = `\n\n[User Long-Term Memory]\nThe following facts are known about the user from previous interactions:\n${memories
              .map((m) => `- ${m.content} [${m.tags?.join(", ")}]`)
              .join(
                "\n",
              )}\n\nUse this information to personalize your responses.`;
          }
        } catch (error) {
          logger.error("Failed to load user memories", error);
        }

        const systemPrompt = mergeSystemPrompt(
          userMemoriesPrompt, // Inject memories high priority

          // All specialized tools should be highest priority to override character/roleplay limits
          isEditImageRequest && editImagePrompt,
          isRemoveBgRequest && removeBgPrompt,
          isEnhanceImageRequest && enhanceImagePrompt,
          isAnimeConversionRequest && animeConversionPrompt,

          // Specialized document generation prompts - reinforce knowledge
          pdfPrompt,
          wordPrompt,
          csvPrompt,
          textFilePrompt,

          // Documentation Reading Reinforcement
          `[DOCUMENT READING SERVICE ENABLED]
          IMPORTANT: Text content has been extracted from any uploaded PDF, Word, or PowerPoint files and is included in your current message context below the user's text.
          1. DO NOT claim you cannot read files.
          2. Use the "File Content" blocks to fulfill the user's request.
          3. Base your answers strictly on the extracted text provided.`,

          // Permanent Tool Knowledge Reinforcement
          `IMPORTANT: You have specialized tools for:
          - Generating documents: "generate-pdf", "generate-word-document", "generate-csv", "generate-text-file".
          - Processing images: "edit-image", "remove-background", "enhance-image", "anime-conversion".
          NEVER say you cannot create these files or perform these actions. If requested, call the appropriate tool immediately.`,

          // Visualization & Diagramming Policy
          `[VISUALIZATION CAPABILITIES]
          1. DIAGRAMS (Flowcharts, Sequence, Mindmaps): You can create diagrams using Mermaid.js. Use a markdown code block with language 'mermaid'.
             Example:
             \`\`\`mermaid
             graph TD; A-->B;
             \`\`\`
             IMPORTANT: DO NOT use the 'html-preview' tool for Mermaid diagrams. Just output the markdown block directly.
          2. CHARTS (Pie, Bar, Line): You have specific tools ('create-pie-chart', 'create-bar-chart', 'create-line-chart'). Use them for data visualization.
          3. TABLES: Use 'create-table' for structured data.`,

          // Memory Persistence Policy
          `[MEMORY PERSISTENCE POLICY]
          You are responsible for building a long-term understanding of the user.
          1. ACTIVE LISTENING: Constantly monitor for facts the user shares about themselves (e.g., profession, name, hobbies, specific technical preferences, location).
          2. AUTO-SAVE: When you identify such a fact, YOU MUST use the 'save-memory' tool to store it immediately.
          3. SILENT OPERATION: Do not ask for permission. Do not announce "I am saving this." Just use the tool in the background.
          4. RETRIEVAL: If the user asks about themselves, use 'search-memories'.`,

          // Character prompt
          characterContext ? characterPrompt : undefined,
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
          useImageTool && imageModelPrompt,
          isVideoGenRequest && videoGenPrompt,
          isQrRequest && qrPrompt,
          isQrLogoRequest && qrLogoPrompt,
          isChatExportRequest && chatExportPrompt,
        );

        const IMAGE_TOOL: Record<string, Tool> = useImageTool
          ? {
              [ImageToolName]:
                effectiveImageTool?.model === "google"
                  ? nanoBananaTool
                  : openaiImageTool,
            }
          : {};

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
          // Conditionally include edit image tools - Using Scoped Wrappers for Base64 support
          ...(isEditImageRequest || imageUrl
            ? { "edit-image": scopedEditImageTool }
            : {}),
          ...(isRemoveBgRequest || imageUrl
            ? { "remove-background": scopedRemoveBgTool }
            : {}),
          ...(isEnhanceImageRequest || imageUrl
            ? { "enhance-image": scopedEnhanceImageTool }
            : {}),
          ...(isAnimeConversionRequest || imageUrl
            ? { "anime-conversion": scopedAnimeConversionTool }
            : {}),
          ...(isVideoGenRequest ? { "video-gen": videoGenTool } : {}),

          // ALWAYS include document generation tools to prevent AI from "forgetting" them
          "generate-pdf": pdfGeneratorTool,
          "generate-word-document": wordDocumentTool,
          "generate-csv": csvGeneratorTool,
          "generate-text-file": textFileTool,

          // ALWAYS include QR tools
          "generate-qr-code": qrCodeGeneratorTool,
          "generate-qr-code-with-logo": qrCodeWithLogoTool,
          html_preview: htmlPreviewTool,

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
          // ALWAYS include memory tools for "strong memory"
          save_memory: saveMemoryTool,
          search_memories: searchMemoriesTool,
        };
        metadata.toolCount = Object.keys(vercelAITooles).length;

        const allowedMcpTools = Object.values(allowedMcpServers ?? {})
          .map((t) => t.tools)
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

        const result = streamText({
          model,
          system: systemPrompt,
          // Dynamic Context Window Strategy
          // maximize history based on model's specific limits instead of hardcoded 10 messages
          messages: convertToModelMessages(
            (() => {
              const modelId = modelToUse?.model || "google-gemma-2-9b-it";
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
                    p.type === "text" ? { ...p, text: truncatedContent } : p,
                  ),
                };
              }

              // 2. Estimate Size & Calculate Budget
              const estimateSize = (m: any) => {
                // Rough char count logic
                return (
                  m.parts.reduce(
                    (acc: number, p: any) => acc + (p.text?.length || 0) + 100,
                    0,
                  ) + 100
                );
              };

              const currentMsgSize = estimateSize(currentMessage);
              const systemPromptSize = systemPrompt.length + 1000; // Buffer
              let remainingChars =
                maxContextChars - currentMsgSize - systemPromptSize;

              if (remainingChars < 0) remainingChars = 0; // Should not happen due to truncation, but safety first

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
              // If the model doesn't support images, we MUST ensure the content is a string
              // Groq specifically throws 400 "content must be a string" for non-vision models
              if (isImageInputUnsupportedModel(model)) {
                logger.info(
                  `Sanitizing messages for non-vision model: ${modelId}`,
                );
                return finalMessages.map((msg) => {
                  // Filter for text parts and join them
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
          maxRetries: useImageTool ? 0 : 2,
          tools: vercelAITooles,
          stopWhen: useImageTool ? stepCountIs(2) : stepCountIs(3),
          toolChoice: "auto",
          abortSignal: request.signal,
        });
        result.consumeStream();
        dataStream.merge(
          result.toUIMessageStream({
            messageMetadata: ({ part }) => {
              if (part.type == "finish") {
                metadata.usage = part.totalUsage;
                return metadata;
              }
            },
          }),
        );
      },

      generateId: generateUUID,
      onFinish: async ({ responseMessage }) => {
        // Skip saving to history if this is a voice chat session
        if (isVoiceChat) {
          return;
        }

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
            });
            await chatRepository.upsertMessage({
              threadId: thread!.id,
              role: responseMessage.role,
              id: responseId,
              parts: filteredParts.map(convertToSavePart),
              metadata,
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

    return createUIMessageStreamResponse({
      stream,
    });
  } catch (error: any) {
    logger.error("Chat API Error:", {
      message: error?.message,
      stack: error?.stack,
      error: String(error),
      name: error?.name,
      code: error?.code,
    });
    console.error("Chat API Error Details:", error);
    return Response.json(
      {
        message: error?.message || "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    );
  }
}

export async function HEAD() {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return new Response(null, { status: 401 });
    }
    return new Response(null, { status: 200 });
  } catch (_error) {
    return new Response(null, { status: 500 });
  }
}
