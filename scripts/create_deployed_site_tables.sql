-- WaspAI: deployed_site and deployed_site_file tables
-- Run this in Supabase SQL Editor if these tables don't exist yet

-- 1. deployed_site table
CREATE TABLE IF NOT EXISTS "deployed_site" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "html_content" text NOT NULL DEFAULT '',
  "author_id" uuid REFERENCES "public"."user"("id") ON DELETE CASCADE,
  "project_id" uuid,
  "is_public" boolean DEFAULT true NOT NULL,
  "view_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "deployed_site_slug_unique" UNIQUE("slug")
);

-- 2. deployed_site_file table
CREATE TABLE IF NOT EXISTS "deployed_site_file" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL REFERENCES "public"."deployed_site"("id") ON DELETE CASCADE,
  "path" text NOT NULL,
  "content" text NOT NULL,
  "mime_type" text NOT NULL DEFAULT 'text/html; charset=utf-8',
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "deployed_site_file_site_id_path_unique" UNIQUE("site_id", "path")
);

-- 3. Add project_id FK if archive table exists (optional)
-- ALTER TABLE "deployed_site" ADD CONSTRAINT "deployed_site_project_id_archive_id_fk"
--   FOREIGN KEY ("project_id") REFERENCES "public"."archive"("id") ON DELETE CASCADE;

-- 4. Enable Row Level Security (allow service role full access)
ALTER TABLE "deployed_site" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deployed_site_file" ENABLE ROW LEVEL SECURITY;

-- 5. Service role bypass policy
CREATE POLICY IF NOT EXISTS "service_role_deployed_site_all" ON "deployed_site"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role_deployed_site_file_all" ON "deployed_site_file"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Public read policy for deployed sites
CREATE POLICY IF NOT EXISTS "public_read_deployed_site" ON "deployed_site"
  FOR SELECT TO anon USING (is_public = true);
