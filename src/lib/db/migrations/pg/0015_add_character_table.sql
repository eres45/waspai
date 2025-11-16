CREATE TABLE IF NOT EXISTS "character" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"personality" text NOT NULL,
	"icon" json,
	"user_id" uuid NOT NULL,
	"privacy" varchar DEFAULT 'private' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "character_user_id_idx" on "character" ("user_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "character_privacy_idx" on "character" ("privacy");

--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "character" ADD CONSTRAINT "character_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
