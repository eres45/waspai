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

      // Step 1: Cleanup any stale jobs (stuck in processing > 3min)
      const staleCount = await videoQueueRepository.cleanupStaleJobs();
      if (staleCount > 0) {
        logger.info(`Video Gen: Cleaned up ${staleCount} stale queue jobs`);
      }

      // Step 2: Enqueue this request
      // We use a placeholder userId since in tool context we don't have the user.
      // The queue still works globally — it serializes ALL requests.
      const job = await videoQueueRepository.enqueue(null, prompt);
      logger.info(`Video Gen: Enqueued job ${job.id}`);

      // Step 3: Wait in queue until it's our turn
      const maxWaitTime = 5 * 60 * 1000; // 5 minutes max wait
      const pollInterval = 3000; // 3 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        // Check if there's an active job that's NOT ours
        const activeJob = await videoQueueRepository.getActiveJob();
        const position = await videoQueueRepository.getQueuePosition(job.id);
        const pendingCount = await videoQueueRepository.getPendingCount();

        logger.info(
          `Video Gen: Job ${job.id} - Position: ${position}, Active: ${activeJob?.id ?? "none"}, Pending: ${pendingCount}`,
        );

        // If no active job, try to claim the next one
        if (!activeJob) {
          const claimed = await videoQueueRepository.claimNextJob();
          if (claimed && claimed.id === job.id) {
            logger.info(
              `Video Gen: Job ${job.id} claimed! Starting generation...`,
            );
            break;
          } else if (claimed) {
            // Another job got claimed (race condition), keep waiting
            logger.info(
              `Video Gen: Another job ${claimed.id} was claimed first, continuing to wait`,
            );
          }
        }

        // If we're still waiting, sleep
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      // Step 4: Check if we got our turn or timed out
      const currentJob = await videoQueueRepository.getJob(job.id);
      if (!currentJob || currentJob.status !== "processing") {
        // Timed out waiting in queue
        await videoQueueRepository.failJob(job.id, "Queue wait timeout");
        const position = await videoQueueRepository.getQueuePosition(job.id);
        return {
          video: { url: "" },
          guide: `Your video generation request is still in queue (position #${position + 1}). The server is busy processing other videos. Please try again in a few minutes.`,
          queueInfo: {
            position: position + 1,
            estimatedWaitSeconds: (position + 1) * ESTIMATED_TIME_PER_VIDEO,
            totalInQueue: await videoQueueRepository.getPendingCount(),
          },
        };
      }

      // Step 5: Generate the video!
      try {
        const generatedVideo = await generateVideoWithMeta({ prompt });
        logger.info(
          `Video Gen: Video generated successfully for job ${job.id}`,
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
      return {
        video: { url: "" },
        guide: `Error generating video: ${e.message || "Unknown error"}. Please try again later.`,
      };
    }
  },
});
