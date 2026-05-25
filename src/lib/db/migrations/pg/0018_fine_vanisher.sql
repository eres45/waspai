CREATE TABLE "deployed_site_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"path" text NOT NULL,
	"content" text NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "deployed_site_file_site_id_path_unique" UNIQUE("site_id","path")
);
--> statement-breakpoint
ALTER TABLE "deployed_site" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "deployed_site_file" ADD CONSTRAINT "deployed_site_file_site_id_deployed_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."deployed_site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployed_site" ADD CONSTRAINT "deployed_site_project_id_archive_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."archive"("id") ON DELETE cascade ON UPDATE no action;