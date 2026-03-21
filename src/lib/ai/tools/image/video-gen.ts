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

      let isOurTurnToGenerate = false;

      // Step 3: Safely wait in queue for up to 5 seconds
      const maxWaitTime = 5 * 1000;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        // Did it finish while we were waiting?
        const currentJob = await videoQueueRepository.getJob(job.id);
        if (
          currentJob?.status === "completed" ||
          currentJob?.status === "failed"
        ) {
          job = currentJob;
          break;
        }

        if (currentJob?.status === "pending") {
          const activeJob = await videoQueueRepository.getActiveJob();
          if (!activeJob) {
            const claimed = await videoQueueRepository.claimNextJob();
            if (claimed && claimed.id === job.id) {
              isOurTurnToGenerate = true;
              break; // We claimed it!
            }
          }
        } else if (currentJob?.status === "processing") {
          // It's processing. But if we didn't just claim it, someone else is generating it.
          // We will wait full 5s to see if they finish.
          if (isOurTurnToGenerate) break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // After wait loop, check if another thread finished it
      if (job.status === "completed" && job.videoUrl) {
        console.log(
          `[VIDEO GEN QUEUE] Pre-existing job finished while waiting!`,
        );
        return {
          video: { url: job.videoUrl },
          guide:
            "Your video has been generated successfully! You can view it above.",
        };
      }

      const position = await videoQueueRepository.getQueuePosition(job.id);
      const pendingCount = await videoQueueRepository.getPendingCount();

      // Step 4: If we claimed it, generate!
      if (
        isOurTurnToGenerate ||
        (!isOurTurnToGenerate && job.status === "pending" && position === 0)
      ) {
        // Secondary safety: if it's our turn but we didn't explicitly claim it in the loop
        if (!isOurTurnToGenerate) {
          const finalClaim = await videoQueueRepository.claimNextJob();
          if (finalClaim?.id !== job.id) {
            // lost the race condition
            return {
              video: { url: "" },
              guide: `Your video request is in the global queue (Position 2). The server is processing other videos right now. Estimated wait: 30 seconds. Please try generating again shortly.`,
            };
          }
        }

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

          await videoQueueRepository.completeJob(
            job.id,
            generatedVideo.video.url,
          );

          return {
            video: generatedVideo.video,
            guide:
              generatedVideo.video.url.length > 0
                ? "Your video has been generated successfully! You can view it above."
                : "I apologize, but the video generation was not successful.",
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
      } else {
        // Step 5: We didn't claim it within 5s because the queue is busy. Leave it pending.
        const currentPos = position === -1 ? 0 : position;
        const estWait = (currentPos + 1) * ESTIMATED_TIME_PER_VIDEO;

        console.log(
          `[VIDEO GEN QUEUE] Job ${job.id} queue active. Left in queue (Position ${currentPos + 1}).`,
        );

        return {
          video: { url: "" },
          guide: `Your video request is in the global queue (Position #${currentPos + 1}). The server is processing other videos right now. Estimated wait time: ${estWait} seconds. Please ask me to "check my video status" shortly.`,
          queueInfo: {
            position: currentPos + 1,
            estimatedWaitSeconds: estWait,
            totalInQueue: pendingCount,
          },
        };
      }
    } catch (e: any) {
      console.error("[VIDEO GEN QUEUE] System Error:", e.message || e);
      return {
        video: { url: "" },
        guide: `Error generating video: ${e.message || "Unknown error"}. Please try again later.`,
      };
    }
  },
});
