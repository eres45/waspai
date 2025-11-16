-- Create music_generation table for storing music generation history
CREATE TABLE IF NOT EXISTS music_generation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  lyrics TEXT NOT NULL,
  tags VARCHAR NOT NULL,
  permanent_url TEXT,
  temp_url TEXT,
  file_size BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS music_generation_user_id_idx ON music_generation(user_id);
CREATE INDEX IF NOT EXISTS music_generation_created_at_idx ON music_generation(created_at);
