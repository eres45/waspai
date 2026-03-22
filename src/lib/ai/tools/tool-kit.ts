import { createPieChartTool } from "./visualization/create-pie-chart";
import { createBarChartTool } from "./visualization/create-bar-chart";
import { createLineChartTool } from "./visualization/create-line-chart";
import { createTableTool } from "./visualization/create-table";
import { exaSearchTool, exaContentsTool } from "./web/web-search";
import { AppDefaultToolkit, DefaultToolName } from ".";
import { Tool } from "ai";
import { httpFetchTool } from "./http/fetch";
import { jsExecutionTool } from "./code/js-run-tool";
import { pythonExecutionTool } from "./code/python-run-tool";
import {
  saveMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  getMemoriesTool,
} from "./memory-tools";
import { youtubeTranscriptTool } from "./web/youtube-transcript";
import { createTempEmailTool, getTempEmailMessagesTool } from "./web/temp-mail";
import { sendEmailTool } from "./web/social-down";
import { videoPlayerTool } from "./web/video-player";
import { steelBrowserTool } from "./browser/steel-browser";
import {
  removeBackgroundTool,
  animeConversionTool,
  enhanceImageTool,
} from "./image/edit-image";
import {
  wordDocumentTool,
  csvGeneratorTool,
  textFileTool,
} from "./document-generator";
import { pdfGeneratorTool } from "./pdf-generator";
import { presentationGeneratorTool } from "./presentation-generator";
import { pptProcessorTool } from "./ppt-processor";
import { videoGenTool } from "./image/video-gen";
import { qrCodeGeneratorTool, qrCodeWithLogoTool } from "./qr-code-generator";
import { htmlPreviewTool } from "./html-preview";
import { chatExportTool } from "./chat-export";

export const APP_DEFAULT_TOOL_KIT: Record<
  AppDefaultToolkit,
  Record<string, Tool>
> = {
  [AppDefaultToolkit.Visualization]: {
    [DefaultToolName.CreatePieChart]: createPieChartTool,
    [DefaultToolName.CreateBarChart]: createBarChartTool,
    [DefaultToolName.CreateLineChart]: createLineChartTool,
    [DefaultToolName.CreateTable]: createTableTool,
  },
  [AppDefaultToolkit.WebSearch]: {
    [DefaultToolName.WebSearch]: exaSearchTool,
    [DefaultToolName.WebContent]: exaContentsTool,
    [DefaultToolName.YouTubeTranscript]: youtubeTranscriptTool,
  },
  [AppDefaultToolkit.Http]: {
    [DefaultToolName.Http]: httpFetchTool,
  },
  [AppDefaultToolkit.Code]: {
    [DefaultToolName.JavascriptExecution]: jsExecutionTool,
    [DefaultToolName.PythonExecution]: pythonExecutionTool,
  },
  [AppDefaultToolkit.Memory]: {
    [DefaultToolName.SaveMemory]: saveMemoryTool,
    [DefaultToolName.UpdateMemory]: updateMemoryTool,
    [DefaultToolName.DeleteMemory]: deleteMemoryTool,
    [DefaultToolName.GetMemories]: getMemoriesTool,
  },
  [AppDefaultToolkit.Utilities]: {
    [DefaultToolName.CreateTempEmail]: createTempEmailTool,
    [DefaultToolName.GetTempEmailMessages]: getTempEmailMessagesTool,
    [DefaultToolName.SendEmail]: sendEmailTool,
    [DefaultToolName.HtmlPreview]: htmlPreviewTool,
    [DefaultToolName.ExportChat]: chatExportTool,
  },
  [AppDefaultToolkit.Media]: {
    [DefaultToolName.VideoPlayer]: videoPlayerTool,
    [DefaultToolName.RemoveBackground]: removeBackgroundTool,
    [DefaultToolName.AnimeConversion]: animeConversionTool,
    [DefaultToolName.EnhanceImage]: enhanceImageTool,
    [DefaultToolName.VideoGen]: videoGenTool,
  },
  [AppDefaultToolkit.Browser]: {
    [DefaultToolName.SteelBrowser]: steelBrowserTool,
  },
  [AppDefaultToolkit.Documents]: {
    [DefaultToolName.GenerateWord]: wordDocumentTool,
    [DefaultToolName.GenerateCSV]: csvGeneratorTool,
    [DefaultToolName.GenerateText]: textFileTool,
    [DefaultToolName.GeneratePDF]: pdfGeneratorTool,
    [DefaultToolName.GeneratePresentation]: presentationGeneratorTool,
    [DefaultToolName.ProcessPPT]: pptProcessorTool,
  },
  [AppDefaultToolkit.QRCode]: {
    [DefaultToolName.GenerateQRCode]: qrCodeGeneratorTool,
    [DefaultToolName.GenerateQRCodeWithLogo]: qrCodeWithLogoTool,
  },
};
