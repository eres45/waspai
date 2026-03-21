import { supabaseRest } from "../../supabase-rest";
import logger from "logger";

export interface VideoQueueEntry {
  id: string;
  userId: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapQueueResponse(item: any): VideoQueueEntry {
  return {
    id: item.id,
    userId: item.user_id,
    prompt: item.prompt,
    status: item.status,
    videoUrl: item.video_url,
    errorMessage: item.error_message,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

export const videoQueueRepository = {
  /**
   * Add a new video generation request to the queue
   */
  async enqueue(userId: string, prompt: string): Promise<VideoQueueEntry> {
    const { data, error } = await supabaseRest
      .from("video_gen_queue")
      .insert({
        user_id: userId,
        prompt,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return mapQueueResponse(data);
  },

  /**
   * Get the queue position for a given job (0-based, 0 = next in line)
   */
  async getQueuePosition(jobId: string): Promise<number> {
    // Get this job's created_at
    const { data: job, error: jobError } = await supabaseRest
      .from("video_gen_queue")
      .select("created_at")
      .eq("id", jobId)
      .single();

    if (jobError || !job) return -1;

    // Count pending jobs created before this one
    const { count, error } = await supabaseRest
      .from("video_gen_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", job.created_at);

    if (error) return -1;
    return count ?? 0;
  },

  /**
   * Get the total number of pending jobs (including the current one)
   */
  async getPendingCount(): Promise<number> {
    const { count, error } = await supabaseRest
      .from("video_gen_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) return 0;
    return count ?? 0;
  },

  /**
   * Get the currently processing job (if any)
   */
  async getActiveJob(): Promise<VideoQueueEntry | null> {
    const { data, error } = await supabaseRest
      .from("video_gen_queue")
      .select("*")
      .eq("status", "processing")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapQueueResponse(data);
  },

  /**
   * Atomically claim the next pending job for processing.
   * Returns the claimed job or null if no pending jobs.
   */
  async claimNextJob(): Promise<VideoQueueEntry | null> {
    // First, get the oldest pending job
    const { data: pendingJob, error: fetchError } = await supabaseRest
      .from("video_gen_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError || !pendingJob) return null;

    // Try to claim it by updating status to processing
    // Only update if still pending (optimistic concurrency)
    const { data: claimed, error: claimError } = await supabaseRest
      .from("video_gen_queue")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingJob.id)
      .eq("status", "pending") // Only claim if still pending
      .select()
      .maybeSingle();

    if (claimError || !claimed) return null;
    return mapQueueResponse(claimed);
  },

  /**
   * Mark a job as completed with the video URL
   */
  async completeJob(
    jobId: string,
    videoUrl: string,
  ): Promise<VideoQueueEntry | null> {
    const { data, error } = await supabaseRest
      .from("video_gen_queue")
      .update({
        status: "completed",
        video_url: videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return mapQueueResponse(data);
  },

  /**
   * Mark a job as failed with an error message
   */
  async failJob(
    jobId: string,
    errorMessage: string,
  ): Promise<VideoQueueEntry | null> {
    const { data, error } = await supabaseRest
      .from("video_gen_queue")
      .update({
        status: "failed",
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return mapQueueResponse(data);
  },

  /**
   * Cleanup stale jobs that have been processing for more than 3 minutes
   * (likely the serverless function died)
   */
  async cleanupStaleJobs(): Promise<number> {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    const { data, error } = await supabaseRest
      .from("video_gen_queue")
      .update({
        status: "failed",
        error_message: "Job timed out (stale)",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "processing")
      .lt("updated_at", threeMinutesAgo)
      .select();

    if (error) {
      logger.warn("Failed to cleanup stale video gen jobs:", error);
      return 0;
    }
    return data?.length ?? 0;
  },

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<VideoQueueEntry | null> {
    const { data, error } = await supabaseRest
      .from("video_gen_queue")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (error || !data) return null;
    return mapQueueResponse(data);
  },
};
