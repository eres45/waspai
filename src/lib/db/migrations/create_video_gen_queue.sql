-- Video Generation Queue Table
-- Run this on your Supabase SQL Editor to create the queue table

CREATE TABLE IF NOT EXISTS video_gen_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  video_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queue operations
CREATE INDEX IF NOT EXISTS video_gen_queue_status_idx ON video_gen_queue(status);
CREATE INDEX IF NOT EXISTS video_gen_queue_created_at_idx ON video_gen_queue(created_at);
CREATE INDEX IF NOT EXISTS video_gen_queue_user_id_idx ON video_gen_queue(user_id);
