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

import { customModelProvider, isToolCallUnsupportedModel } from "lib/ai/models";
import { isSearchQuery } from "lib/search-detector";
import {
  SEARCH_MODEL,
  POLLINATIONS_SYSTEM_PROMPT,
  POLLINATIONS_MODEL_PROMPTS,
} from "lib/ai/pollinations";
import { KIWI_AI_SYSTEM_PROMPT } from "lib/ai/kiwi-ai";
import { createReverseModelMapping } from "lib/ai/model-display-names";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import { agentRepository, chatRepository } from "lib/db/repository";
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
import { chatExportTool } from "lib/ai/tools/chat-export";
import { webSearchTool } from "lib/ai/tools/web-search";
import { ImageToolName } from "lib/ai/tools";
import { buildCsvIngestionPreviewParts } from "@/lib/ai/ingest/csv-ingest";
import { serverFileStorage } from "lib/file-storage";
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

    if (isSearchQuery(enrichedMessageText)) {
      modelToUse = SEARCH_MODEL;
      logger.info(`Search query detected, using gemini-search model`);
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
    messages.forEach((m, idx) => {
      logger.info(
        `Message ${idx}: id=${m.id}, role=${m.role}, parts=${m.parts?.length || 0}`,
      );
    });

    // For Pollinations models, truncate message history to stay within character limits
    // Pollinations has a ~8000 character limit for input
    if (
      modelToUse?.provider === "pollinations" ||
      modelToUse?.provider === "google"
    ) {
      const MAX_HISTORY_CHARS = 6000; // Leave 2000 chars for current message + system prompt
      let totalChars = 0;
      const truncatedMessages: UIMessage[] = [];

      // Add messages from the end (most recent) until we hit the limit
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const msgChars = JSON.stringify(msg).length;

        if (
          totalChars + msgChars > MAX_HISTORY_CHARS &&
          truncatedMessages.length > 0
        ) {
          // Stop adding if we'd exceed the limit (but keep at least one message)
          break;
        }

        truncatedMessages.unshift(msg);
        totalChars += msgChars;
      }

      if (truncatedMessages.length < messages.length) {
        logger.warn(
          `Truncated message history for ${modelToUse.provider}/${modelToUse.model}: ${messages.length} → ${truncatedMessages.length} messages (${totalChars} chars)`,
        );
      }

      messages.length = 0;
      messages.push(...truncatedMessages);
    }

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

        // Skip file attachments if they were processed by OCR (images/PDFs)
        if (attachment.type === "file") {
          const isImageOrPdf =
            attachment.mediaType?.startsWith("image/") ||
            attachment.mediaType === "application/pdf";

          // If OCR processed this file, skip adding it as attachment
          // The extracted text is already in enrichedMessageText
          if (isImageOrPdf && enrichedMessageText !== messageText) {
            return;
          }

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

    // If there were unsupported files, add a note to the message
    if (unsupportedParts.length > 0) {
      const unsupportedNote = `\n\n⚠️ **Note:** The following file types are not directly supported by the AI model and were excluded: ${unsupportedParts.map((p) => `${p.filename} (${p.mediaType})`).join(", ")}. However, I can still help you with your request using other methods. For PowerPoint files, try uploading the content as text or images, or use the web search feature to find similar information.`;

      const textPart = message.parts.find((p: any) => p.type === "text") as any;
      if (textPart && textPart.text) {
        textPart.text += unsupportedNote;
      } else {
        message.parts.unshift({
          type: "text",
          text: unsupportedNote,
        });
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
      | undefined;

    if (characterContextHeader && characterMention) {
      try {
        // Decode from base64
        const decoded = Buffer.from(characterContextHeader, "base64").toString(
          "utf-8",
        );
        characterContext = JSON.parse(decoded);
        if (characterContext?.name) {
          logger.info(
            `Character context loaded: ${characterContext.name} (tagged in mentions)`,
          );
        }
      } catch (error) {
        logger.warn("Failed to parse character context from header:", error);
      }
    } else if (characterContextHeader && !characterMention) {
      logger.info(
        "Character context header found but character NOT tagged in mentions - using selected model",
      );
    } else {
      logger.info("No character context header or character not tagged");
    }

    // Auto-detect image generation requests from message content
    const hasImageGenerationKeywords = message.parts?.some(
      (part: any) =>
        typeof part === "object" &&
        part.type === "text" &&
        (part.text?.toLowerCase().includes("generate image") ||
          part.text?.toLowerCase().includes("create image") ||
          part.text?.toLowerCase().includes("draw") ||
          part.text?.toLowerCase().includes("image of") ||
          part.text?.toLowerCase().includes("picture of") ||
          part.text?.toLowerCase().includes("photo of") ||
          part.text?.toLowerCase().includes("generate a picture") ||
          part.text?.toLowerCase().includes("create a picture") ||
          part.text?.toLowerCase().includes("make an image")),
    );

    // Enable image tool if either explicitly provided or auto-detected
    const useImageTool =
      Boolean(imageTool?.model) || hasImageGenerationKeywords;

    // If auto-detected but no model specified, use a default
    const effectiveImageTool =
      imageTool ||
      (hasImageGenerationKeywords ? { model: "img-cv" } : undefined);

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

        const imageModelPrompt =
          useImageTool && effectiveImageTool?.model
            ? `You are using the image generation tool with the pre-selected model: "${effectiveImageTool.model}". 
CRITICAL INSTRUCTIONS - MUST FOLLOW EXACTLY:
1. The user has selected an image generation model - they want to generate an image
2. Call the "image-manager" tool IMMEDIATELY with the user's message as the prompt
3. Use the exact tool name: "image-manager" (this is the ONLY tool name to use)
4. ALWAYS use model="${effectiveImageTool.model}" - this is the ONLY model you must use
5. Do NOT use any other model - do not substitute with gpt-imager, img-cv, or any other model
6. Do NOT call the tool multiple times - call it EXACTLY ONCE
7. Do NOT ask the user to choose a model or ask for clarification
8. Do NOT refuse to generate the image - just generate it
9. After the tool returns the image, provide a brief, friendly response (1-2 sentences max) acknowledging the image was generated
10. Do not mention the model name or technical details
11. Keep the response short and natural`
            : "";

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
        // 3. Try to extract from message parts directly
        else {
          const urlPart = lastMessage?.parts?.find(
            (part: any) =>
              typeof part === "object" &&
              part.url &&
              (part.url.includes("http") || part.url.includes("data:")),
          );
          if (urlPart) {
            imageUrl = (urlPart as any)?.url;
            logger.info(`Image URL from message parts: ${imageUrl}`);
          }
        }

        // Check if user selected an edit image model from the menu
        logger.info(`Edit Image State Model: ${editImageModel}`);
        logger.info(`Image URL: ${imageUrl}`);

        // Detect remove background request from keywords as fallback
        const hasRemoveBgKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("remove") ||
              part.text?.toLowerCase().includes("background") ||
              part.text?.toLowerCase().includes("bg")),
        );

        // Detect enhance image request from keywords as fallback
        const hasEnhanceKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("enhance") ||
              part.text?.toLowerCase().includes("improve") ||
              part.text?.toLowerCase().includes("quality") ||
              part.text?.toLowerCase().includes("clarity") ||
              part.text?.toLowerCase().includes("sharpen") ||
              part.text?.toLowerCase().includes("brighten") ||
              part.text?.toLowerCase().includes("contrast")),
        );

        const isEditImageRequest =
          imageFilePart && imageUrl && editImageModel === "nano-banana";
        const isRemoveBgRequest =
          imageFilePart &&
          imageUrl &&
          (editImageModel === "remove-background" || hasRemoveBgKeywords);
        const isEnhanceImageRequest =
          imageFilePart &&
          imageUrl &&
          (editImageModel === "enhance-image" || hasEnhanceKeywords);
        const isAnimeConversionRequest =
          imageFilePart && imageUrl && editImageModel === "anime-conversion";

        const editImagePrompt =
          isEditImageRequest && imageUrl
            ? `Call the "edit-image" tool with imageUrl: "${imageUrl}" and the user's edit instruction.`
            : "";

        const removeBgPrompt =
          isRemoveBgRequest && imageUrl
            ? `Call the "remove-background" tool with imageUrl: "${imageUrl}". Keep response brief.`
            : "";

        const enhanceImagePrompt =
          isEnhanceImageRequest && imageUrl
            ? `Call the "enhance-image" tool with imageUrl: "${imageUrl}". Keep response brief.`
            : "";

        const animeConversionPrompt =
          isAnimeConversionRequest && imageUrl
            ? `Call the "anime-conversion" tool with imageUrl: "${imageUrl}". Keep response brief.`
            : "";

        // Detect PDF generation request from keywords
        const hasPdfKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("pdf") ||
              part.text?.toLowerCase().includes("create pdf") ||
              part.text?.toLowerCase().includes("generate pdf") ||
              part.text?.toLowerCase().includes("export pdf") ||
              part.text?.toLowerCase().includes("save as pdf") ||
              part.text?.toLowerCase().includes("pdf report") ||
              part.text?.toLowerCase().includes("pdf document")),
        );

        const isPdfRequest = hasPdfKeywords;
        const pdfPrompt = isPdfRequest
          ? `The user wants to create a PDF. Call the "generate-pdf" tool with an appropriate title and the content they want in the PDF.`
          : "";

        // Detect Word document generation request from keywords
        const hasWordKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("word") ||
              part.text?.toLowerCase().includes("docx") ||
              part.text?.toLowerCase().includes("create document") ||
              part.text?.toLowerCase().includes("generate document") ||
              part.text?.toLowerCase().includes("word document") ||
              part.text?.toLowerCase().includes("export word") ||
              part.text?.toLowerCase().includes("save as word")),
        );

        const isWordRequest = hasWordKeywords;
        const wordPrompt = isWordRequest
          ? `The user wants to create a Word document. Call the "generate-word-document" tool with an appropriate title and the content they want in the document.`
          : "";

        // Detect CSV generation request from keywords
        const hasCsvKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("csv") ||
              part.text?.toLowerCase().includes("export csv") ||
              part.text?.toLowerCase().includes("generate csv") ||
              part.text?.toLowerCase().includes("csv file") ||
              part.text?.toLowerCase().includes("spreadsheet") ||
              part.text?.toLowerCase().includes("export data") ||
              part.text?.toLowerCase().includes("tabular data")),
        );

        const isCsvRequest = hasCsvKeywords;
        const csvPrompt = isCsvRequest
          ? `The user wants to create a CSV file. Call the "generate-csv" tool with an appropriate title and the CSV data (comma-separated values with newlines).`
          : "";

        // Detect text file generation request from keywords
        const hasTextFileKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("text file") ||
              part.text?.toLowerCase().includes("txt") ||
              part.text?.toLowerCase().includes("create text") ||
              part.text?.toLowerCase().includes("generate text file") ||
              part.text?.toLowerCase().includes("export text") ||
              part.text?.toLowerCase().includes("save as text")),
        );

        const isTextFileRequest = hasTextFileKeywords;
        const textFilePrompt = isTextFileRequest
          ? `The user wants to create a text file. Call the "generate-text-file" tool with an appropriate title and the content they want in the file.`
          : "";

        // Detect QR code generation request from keywords
        const hasQrKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("qr code") ||
              part.text?.toLowerCase().includes("generate qr") ||
              part.text?.toLowerCase().includes("create qr") ||
              (part.text?.toLowerCase().includes("qr") &&
                !part.text?.toLowerCase().includes("qr with logo")) ||
              part.text?.toLowerCase().includes("scan code")),
        );

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

        // Detect chat export request from keywords
        const hasChatExportKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("export chat") ||
              part.text?.toLowerCase().includes("export messages") ||
              part.text?.toLowerCase().includes("download chat") ||
              part.text?.toLowerCase().includes("save chat") ||
              part.text?.toLowerCase().includes("export conversation") ||
              part.text?.toLowerCase().includes("chat history") ||
              part.text?.toLowerCase().includes("all messages")),
        );

        const isChatExportRequest = hasChatExportKeywords;
        const chatExportPrompt = isChatExportRequest
          ? `The user wants to export the chat messages. Call the "export-chat-messages" tool with the current threadId (you can use the threadId from context) and format as "text" or "markdown". Then use the returned content to generate a PDF or document.`
          : "";

        // Detect video generation request from keywords
        const hasVideoGenKeywords = lastMessage?.parts?.some(
          (part: any) =>
            typeof part === "object" &&
            part.type === "text" &&
            (part.text?.toLowerCase().includes("generate video") ||
              part.text?.toLowerCase().includes("create video") ||
              part.text?.toLowerCase().includes("make video") ||
              part.text?.toLowerCase().includes("video of") ||
              part.text?.toLowerCase().includes("video generation") ||
              part.text?.toLowerCase().includes("sora") ||
              part.text?.toLowerCase().includes("generate a video")),
        );

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

        const systemPrompt = mergeSystemPrompt(
          // Character prompt should be first to take priority
          characterContext ? characterPrompt : undefined,
          buildUserSystemPrompt(session.user, userPreferences, agent),
          buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations),
          !supportToolCall && buildToolCallUnsupportedModelSystemPrompt,
          modelToUse?.model === "gemini-search" && buildSearchModelSystemPrompt,
          modelToUse?.provider === "pollinations" &&
            (POLLINATIONS_MODEL_PROMPTS[modelToUse.model] ||
              POLLINATIONS_SYSTEM_PROMPT),
          modelToUse?.provider === "kiwi-ai" && KIWI_AI_SYSTEM_PROMPT,
          useImageTool && imageModelPrompt,
          isEditImageRequest && editImagePrompt,
          isRemoveBgRequest && removeBgPrompt,
          isEnhanceImageRequest && enhanceImagePrompt,
          isAnimeConversionRequest && animeConversionPrompt,
          isVideoGenRequest && videoGenPrompt,
          isPdfRequest && pdfPrompt,
          isWordRequest && wordPrompt,
          isCsvRequest && csvPrompt,
          isTextFileRequest && textFilePrompt,
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
        const EDIT_IMAGE_TOOL = {
          "edit-image": editImageTool,
          "remove-background": removeBackgroundTool,
          "enhance-image": enhanceImageTool,
          "anime-conversion": animeConversionTool,
          "video-gen": videoGenTool,
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
          ...EDIT_IMAGE_TOOL,
          "generate-pdf": pdfGeneratorTool,
          "generate-word-document": wordDocumentTool,
          "generate-csv": csvGeneratorTool,
          "generate-text-file": textFileTool,
          "generate-qr-code": qrCodeGeneratorTool,
          "generate-qr-code-with-logo": qrCodeWithLogoTool,
          "export-chat-messages": chatExportTool,
          "web-search": webSearchTool,
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

        const result = streamText({
          model,
          system: systemPrompt,
          messages: convertToModelMessages(messages),
          experimental_transform: smoothStream({ chunking: "word" }),
          maxRetries: useImageTool ? 0 : 2,
          tools: vercelAITooles,
          stopWhen: useImageTool ? stepCountIs(2) : stepCountIs(10),
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
