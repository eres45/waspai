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
  };
};

const ESTIMATED_TIME_PER_VIDEO = 30; // seconds

/**
 * Video generation tool using Meta AI API with global queue
 */
export const videoGenTool = createTool({
  name: "video-gen",
  description:
    "Generate a video based on a text prompt using Meta AI. Provide a detailed description of the video you want to create.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "Detailed description of the video to generate (e.g., 'A cat playing with a ball in a sunny garden')",
      ),
  }),
  execute: async ({ prompt }) => {
    try {
      logger.info(`Video Gen tool called with prompt: "${prompt}"`);
      console.log(`[VIDEO GEN QUEUE] Received request for prompt: "${prompt}"`);

      // Step 1: Cleanup any stale jobs (stuck in processing > 3min)
      const staleCount = await videoQueueRepository.cleanupStaleJobs();
      if (staleCount > 0) {
        logger.info(`Video Gen: Cleaned up ${staleCount} stale queue jobs`);
        console.log(`[VIDEO GEN QUEUE] Cleaned up ${staleCount} stale jobs`);
      }

      // Step 2: Enqueue this request (or hook into existing)
      let job = await videoQueueRepository.findExistingJob(prompt);

      if (job) {
        logger.info(`Video Gen: Found existing job ${job.id} for this prompt`);
        console.log(
          `[VIDEO GEN QUEUE] Found existing job ${job.id} (Status: ${job.status})`,
        );
      } else {
        job = await videoQueueRepository.enqueue(null, prompt);
        logger.info(`Video Gen: Enqueued new job ${job.id}`);
        console.log(`[VIDEO GEN QUEUE] Enqueued NEW job ${job.id}`);
      }

      // Step 3: Wait in queue until it's our turn (Bounded to prevent Vercel timeout)
      // Vercel max duration is 120s. Video gen takes ~30s. Leave 45s for queue waiting.
      const maxWaitTime = 45 * 1000; // 45 seconds max wait in this request
      const pollInterval = 3000; // 3 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        // Check if there's an active job that's NOT ours
        const activeJob = await videoQueueRepository.getActiveJob();
        const position = await videoQueueRepository.getQueuePosition(job.id);
        const pendingCount = await videoQueueRepository.getPendingCount();

        const logMsg = `Job ${job.id} - Position: ${position}, Active: ${activeJob?.id ?? "none"}, Pending Total: ${pendingCount}`;
        logger.info(`Video Gen: ${logMsg}`);
        console.log(`[VIDEO GEN QUEUE POLLING] ${logMsg}`);

        // If no active job, try to claim the next one
        if (!activeJob) {
          const claimed = await videoQueueRepository.claimNextJob();
          if (claimed && claimed.id === job.id) {
            logger.info(
              `Video Gen: Job ${job.id} claimed! Starting generation...`,
            );
            console.log(
              `[VIDEO GEN QUEUE] Job ${job.id} SUCCESSFULLY CLAIMED! Calling Render API...`,
            );
            break;
          } else if (claimed) {
            // Another job got claimed (race condition), keep waiting
            logger.info(
              `Video Gen: Another job ${claimed.id} was claimed first, continuing to wait`,
            );
            console.log(
              `[VIDEO GEN QUEUE] Race condition: Another job ${claimed.id} claimed it first.`,
            );
          }
        }

        // If we're still waiting, sleep
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      // Step 4: Check if we got our turn or timed out from the polling loop
      const currentJob = await videoQueueRepository.getJob(job.id);
      if (!currentJob || currentJob.status !== "processing") {
        const position = await videoQueueRepository.getQueuePosition(job.id);
        const estWait = (position + 1) * ESTIMATED_TIME_PER_VIDEO;

        console.log(
          `[VIDEO GEN QUEUE] Job ${job.id} reached 45s wait limit. Leaving in queue (Position ${position + 1}). Telling AI to inform user.`,
        );

        return {
          video: { url: "" },
          guide: `Your video request is in the global queue (Position #${position + 1}). The server is processing other videos right now. Estimated wait time: ${estWait} seconds. Please ask me to "check my video status" in about a minute, or try generating again later.`,
          queueInfo: {
            position: position + 1,
            estimatedWaitSeconds: estWait,
            totalInQueue: await videoQueueRepository.getPendingCount(),
          },
        };
      }

      // Step 5: Generate the video!
      try {
        console.log(
          `[VIDEO GEN QUEUE] Generating video for job ${job.id} on Render API...`,
        );
        const generatedVideo = await generateVideoWithMeta({ prompt });

        logger.info(
          `Video Gen: Video generated successfully for job ${job.id}`,
        );
        console.log(
          `[VIDEO GEN QUEUE] SUCCESS! Video generated for job ${job.id}. URL: ${generatedVideo.video.url}`,
        );

        // Mark job as completed
        await videoQueueRepository.completeJob(
          job.id,
          generatedVideo.video.url,
        );

        return {
          video: generatedVideo.video,
          guide:
            generatedVideo.video.url.length > 0
              ? "Your video has been generated successfully! You can view it above."
              : "I apologize, but the video generation was not successful. Please try again with a different prompt.",
        };
      } catch (genError: any) {
        logger.error(
          `Video Gen: Generation failed for job ${job.id}:`,
          genError,
        );
        console.error(
          `[VIDEO GEN QUEUE] Render API ERROR for job ${job.id}:`,
          genError.message || genError,
        );

        await videoQueueRepository.failJob(
          job.id,
          genError.message || "Unknown error",
        );
        return {
          video: { url: "" },
          guide: `Error generating video: ${genError.message || "Unknown error"}. Please try again later.`,
        };
      }
    } catch (e: any) {
      logger.error("Video Gen Tool Error:", e);
      console.error("[VIDEO GEN QUEUE] System Error:", e.message || e);
      return {
        video: { url: "" },
        guide: `Error generating video: ${e.message || "Unknown error"}. Please try again later.`,
      };
    }
  },
});
