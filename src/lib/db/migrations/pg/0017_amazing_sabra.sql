CREATE TABLE "deployed_site" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"html_content" text NOT NULL,
	"author_id" uuid,
	"is_public" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "deployed_site_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "skill_rating" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "skill_rating_user_id_skill_id_unique" UNIQUE("user_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"category" varchar DEFAULT 'other' NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"author_id" uuid NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"install_count" integer DEFAULT 0 NOT NULL,
	"icon" text DEFAULT '🔧' NOT NULL,
	"tools_required" json DEFAULT '[]'::json,
	"tier_required" varchar DEFAULT 'free' NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "skill_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"installed_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_skill_user_id_skill_id_unique" UNIQUE("user_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "video_gen_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"prompt" text NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"video_url" text,
	"error_message" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deployed_site" ADD CONSTRAINT "deployed_site_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_rating" ADD CONSTRAINT "skill_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_rating" ADD CONSTRAINT "skill_rating_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill" ADD CONSTRAINT "user_skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill" ADD CONSTRAINT "user_skill_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_gen_queue" ADD CONSTRAINT "video_gen_queue_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_rating_skill_id_idx" ON "skill_rating" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_category_idx" ON "skill" USING btree ("category");--> statement-breakpoint
CREATE INDEX "skill_author_id_idx" ON "skill" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "skill_is_public_idx" ON "skill" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "skill_is_featured_idx" ON "skill" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "skill_tier_required_idx" ON "skill" USING btree ("tier_required");--> statement-breakpoint
CREATE INDEX "user_skill_user_id_idx" ON "user_skill" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_skill_skill_id_idx" ON "user_skill" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "video_gen_queue_status_idx" ON "video_gen_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "video_gen_queue_created_at_idx" ON "video_gen_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "video_gen_queue_user_id_idx" ON "video_gen_queue" USING btree ("user_id");