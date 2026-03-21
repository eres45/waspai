export enum AppDefaultToolkit {
  Visualization = "visualization",
  WebSearch = "webSearch",
  Http = "http",
  Code = "code",
  Memory = "memory",
  Utilities = "utilities",
  Media = "media",
  Browser = "browser",
  Documents = "documents",
  QRCode = "qrCode",
}

export enum DefaultToolName {
  CreatePieChart = "createPieChart",
  CreateBarChart = "createBarChart",
  CreateLineChart = "createLineChart",
  CreateTable = "createTable",
  WebSearch = "web-search",
  WebContent = "web-content",
  Http = "http",
  JavascriptExecution = "mini-javascript-execution",
  PythonExecution = "python-execution",
  SaveMemory = "save_memory",
  UpdateMemory = "update_memory",
  DeleteMemory = "delete_memory",
  GetMemories = "get_memories",
  YouTubeTranscript = "get-youtube-transcript",
  CreateTempEmail = "create-temp-email",
  GetTempEmailMessages = "get-temp-email-messages",
  SendEmail = "send-email",
  VideoPlayer = "video-player",
  SteelBrowser = "steel-browser",
  // Image Editing
  RemoveBackground = "remove-background",
  AnimeConversion = "anime-conversion",
  EnhanceImage = "enhance-image",
  // Documents
  GenerateWord = "generate-word-document",
  GenerateCSV = "generate-csv",
  GenerateText = "generate-text-file",
  GeneratePDF = "generate-pdf",
  GeneratePresentation = "generate-presentation",
  ProcessPPT = "process-ppt",
  // Media
  VideoGen = "video-gen",
  // QR Code
  GenerateQRCode = "generate-qr-code",
  GenerateQRCodeWithLogo = "generate-qr-code-with-logo",
  // Other
  HtmlPreview = "html_preview",
  ExportChat = "export-chat-messages",
}

export const SequentialThinkingToolName = "sequential-thinking";

export const ImageToolName = "image-manager" as const;
