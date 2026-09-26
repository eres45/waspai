import { Tool } from "ai";
import { AppDefaultToolkit, DefaultToolName } from ".";
import { steelBrowserTool } from "./browser/steel-browser";
import { chatExportTool } from "./chat-export";
import { jsExecutionTool } from "./code/js-run-tool";
import { pythonExecutionTool } from "./code/python-run-tool";
import { deploySiteTool } from "./deploy-site";
import {
  csvGeneratorTool,
  textFileTool,
  wordDocumentTool,
} from "./document-generator";
import { fetchImageAsBase64Tool } from "./fetch-image-as-base64";
import { fileConverterTool } from "./file-converter";
import { htmlPreviewTool } from "./html-preview";
import { httpFetchTool } from "./http/fetch";
import { analyzeImageTool } from "./image/analyze-image";
import {
  animeConversionTool,
  blurBackgroundTool,
  enhanceImageTool,
  removeBackgroundTool,
  removeObjectTool,
  removeWatermarkTool,
  restoreOldPhotoTool,
  superResolutionTool,
} from "./image/edit-image";
import {
  deleteMemoryTool,
  getMemoriesTool,
  saveMemoryTool,
  updateMemoryTool,
} from "./memory-tools";
import { pdfGeneratorTool } from "./pdf-generator";
import { pptProcessorTool } from "./ppt-processor";
import { presentationGeneratorTool } from "./presentation-generator";
import { qrCodeGeneratorTool, qrCodeWithLogoTool } from "./qr-code-generator";
import {
  createSkillTool,
  loadSkillTool,
  searchSkillsTool,
} from "./skill-tools";
import { createBarChartTool } from "./visualization/create-bar-chart";
import { createLineChartTool } from "./visualization/create-line-chart";
import { createPieChartTool } from "./visualization/create-pie-chart";
import { createTableTool } from "./visualization/create-table";
import { scrapeWebPageTool } from "./web/scrape-web-page";
import { getSmsMessagesTool, listSmsNumbersTool } from "./web/sms-tool";
import { sendEmailTool } from "./web/social-down";
import { createTempEmailTool, getTempEmailMessagesTool } from "./web/temp-mail";
import { videoPlayerTool } from "./web/video-player";
import { webContentTool, webSearchTool } from "./web/web-search";
import { youtubeTranscriptTool } from "./web/youtube-transcript";

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
    [DefaultToolName.WebSearch]: webSearchTool,
    [DefaultToolName.WebContent]: webContentTool,
    [DefaultToolName.ScrapeWebPage]: scrapeWebPageTool,
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
    [DefaultToolName.FetchImageAsBase64]: fetchImageAsBase64Tool,
    [DefaultToolName.ExportChat]: chatExportTool,
    [DefaultToolName.ListSmsNumbers]: listSmsNumbersTool,
    [DefaultToolName.GetSmsMessages]: getSmsMessagesTool,
    [DefaultToolName.CreateSkill]: createSkillTool,
    [DefaultToolName.SearchSkills]: searchSkillsTool,
    [DefaultToolName.LoadSkill]: loadSkillTool,
    [DefaultToolName.DeploySite]: deploySiteTool,
  },
  [AppDefaultToolkit.Media]: {
    [DefaultToolName.VideoPlayer]: videoPlayerTool,
    [DefaultToolName.RemoveBackground]: removeBackgroundTool,
    [DefaultToolName.AnimeConversion]: animeConversionTool,
    [DefaultToolName.EnhanceImage]: enhanceImageTool,
    [DefaultToolName.RemoveWatermark]: removeWatermarkTool,
    [DefaultToolName.RemoveObject]: removeObjectTool,
    [DefaultToolName.SuperResolution]: superResolutionTool,
    [DefaultToolName.RestoreOldPhoto]: restoreOldPhotoTool,
    [DefaultToolName.BlurBackground]: blurBackgroundTool,
    [DefaultToolName.AnalyzeImage]: analyzeImageTool,
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
    [DefaultToolName.ConvertFile]: fileConverterTool,
  },
  [AppDefaultToolkit.QRCode]: {
    [DefaultToolName.GenerateQRCode]: qrCodeGeneratorTool,
    [DefaultToolName.GenerateQRCodeWithLogo]: qrCodeWithLogoTool,
  },
};
