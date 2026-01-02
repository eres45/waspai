-- Migration: Add telegram_uploads table for tracking Telegram Bot API file uploads
-- This replaces Snapzion for file storage

CREATE TABLE IF NOT EXISTS telegram_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL UNIQUE,
  message_id INTEGER NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'document')),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  filename TEXT,
  content_type TEXT,
  size_bytes BIGINT,
  telegram_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_telegram_uploads_user_id ON telegram_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_uploads_file_id ON telegram_uploads(file_id);
CREATE INDEX IF NOT EXISTS idx_telegram_uploads_created_at ON telegram_uploads(created_at DESC);

-- Comment
COMMENT ON TABLE telegram_uploads IS 'Tracks files uploaded via Telegram Bot API';
COMMENT ON COLUMN telegram_uploads.file_id IS 'Telegram file_id for retrieving the file';
COMMENT ON COLUMN telegram_uploads.message_id IS 'Telegram message_id in the channel';
COMMENT ON COLUMN telegram_uploads.file_type IS 'Type of file: image, video, pdf, or document';
