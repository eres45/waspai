-- WaspAI: user_daily_usage table for tracking daily search & image generation limits
-- Run this in Supabase SQL Editor to create the table

-- 1. Create table
CREATE TABLE IF NOT EXISTS "user_daily_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
  "action_type" text NOT NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create index for fast query lookups
CREATE INDEX IF NOT EXISTS "user_daily_usage_user_action_date_idx" 
ON "user_daily_usage" ("user_id", "action_type", "created_at");

-- 3. Enable Row Level Security
ALTER TABLE "user_daily_usage" ENABLE ROW LEVEL SECURITY;

-- 4. Enable service role full access bypass policy
DROP POLICY IF EXISTS "service_role_user_daily_usage_all" ON "user_daily_usage";
CREATE POLICY "service_role_user_daily_usage_all" ON "user_daily_usage"
  FOR ALL TO service_role USING (true) WITH CHECK (true);
