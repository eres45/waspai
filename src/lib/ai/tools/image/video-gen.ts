import { tool as createTool } from "ai";
import z from "zod";
import logger from "logger";
import { generateVideoWithMeta } from "lib/ai/image/video-gen";
import { videoQueueRepository } from "lib/db/repository";

export type VideoGenToolResult = {
  video: {
    url: string;
    mimeType?: string;
  };
  guide?: string;
  queueInfo?: {
    position: number;
    estimatedWaitSeconds: number;
    totalInQueue: number;
    isGeneratingNow?: boolean;
  };
};

const ESTIMATED_TIME_PER_VIDEO = 30; // seconds

export const videoGenTool = createTool({
  name: "video-gen",
  description:
    "Generate a video based on a text prompt using Meta AI. Provide a detailed description of the video you want to create.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe("Detailed description of the video to generate"),
  }),
  execute: async ({ prompt }) => {
    try {
      logger.info(`Video Gen tool called with prompt: "${prompt}"`);
      console.log(`[VIDEO GEN QUEUE] Received request for prompt: "${prompt}"`);

      // Step 1: Cleanup any stale jobs
      const staleCount = await videoQueueRepository.cleanupStaleJobs();
      if (staleCount > 0) {
        console.log(`[VIDEO GEN QUEUE] Cleaned up ${staleCount} stale jobs`);
      }

      // Step 2: Enqueue this request (or hook into existing)
      let job = await videoQueueRepository.findExistingJob(prompt);

      if (job) {
        console.log(
          `[VIDEO GEN QUEUE] Found existing job ${job.id} (Status: ${job.status})`,
        );
      } else {
        job = await videoQueueRepository.enqueue(null, prompt);
        console.log(`[VIDEO GEN QUEUE] Enqueued NEW job ${job.id}`);
      }

      // Step 3: Trigger background processing queue but DON'T AWAIT IT
      processVideoQueueInBackground().catch((err) => {
        logger.error(`[VIDEO GEN QUEUE] Background processor crashed:`, err);
      });

      // Step 4: Return immediate status to the user
      const position = await videoQueueRepository.getQueuePosition(job.id);
      const pendingCount = await videoQueueRepository.getPendingCount();
      const activeJob = await videoQueueRepository.getActiveJob();

      const isGeneratingNow =
        position === 0 && (!activeJob || activeJob.id === job.id);
      const estWait = isGeneratingNow
        ? ESTIMATED_TIME_PER_VIDEO
        : (position + 1) * ESTIMATED_TIME_PER_VIDEO;

      let guideMsg = `Your video request for "${prompt}" is now in the global queue (Position #${position + 1}). `;
      if (isGeneratingNow) {
        guideMsg += `Good news: the server is processing your video right now! Estimated wait: ~${estWait} seconds.`;
      } else {
        guideMsg += `The server is processing other videos. Estimated wait: ~${estWait} seconds.`;
      }
      guideMsg += `\n\nPlease reply with "check my video status" in a minute to get the result.`;

      return {
        video: { url: "" },
        guide: guideMsg,
        queueInfo: {
          position: position + 1,
          estimatedWaitSeconds: estWait,
          totalInQueue: pendingCount,
          isGeneratingNow,
        },
      };
    } catch (e: any) {
      console.error("[VIDEO GEN QUEUE] System Error:", e.message || e);
      return {
        video: { url: "" },
        guide: `Error adding video to queue: ${e.message || "Unknown error"}. Please try again later.`,
      };
    }
  },
});

/**
 * Background worker that safely drains the global video queue.
 */
async function processVideoQueueInBackground() {
  console.log(`[VIDEO GEN BACKGROUND] Waking up background processor...`);

  const maxLifetime = 110 * 1000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxLifetime) {
    const activeJob = await videoQueueRepository.getActiveJob();
    if (activeJob) {
      // Wait a bit and check later so we don't spam DB
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    const claimedJob = await videoQueueRepository.claimNextJob();
    if (!claimedJob) {
      console.log(`[VIDEO GEN BACKGROUND] Queue empty. Worker shutting down.`);
      break;
    }

    console.log(
      `[VIDEO GEN BACKGROUND] Successfully claimed job ${claimedJob.id}. Generating...`,
    );

    try {
      const generatedVideo = await generateVideoWithMeta({
        prompt: claimedJob.prompt,
      });
      console.log(
        `[VIDEO GEN BACKGROUND] SUCCESS! Video generated for job ${claimedJob.id}. URL: ${generatedVideo.video.url}`,
      );
      await videoQueueRepository.completeJob(
        claimedJob.id,
        generatedVideo.video.url,
      );
    } catch (genError: any) {
      console.error(
        `[VIDEO GEN BACKGROUND] ERROR for job ${claimedJob.id}:`,
        genError.message || genError,
      );
      await videoQueueRepository.failJob(
        claimedJob.id,
        genError.message || "Unknown error",
      );
    }
  }
}
