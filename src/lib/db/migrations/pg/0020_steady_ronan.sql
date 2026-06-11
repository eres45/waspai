CREATE TABLE "browser_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"allocated_duration" integer DEFAULT 120 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "browser_usage_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "browser_usage" ADD CONSTRAINT "browser_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "browser_usage_user_id_idx" ON "browser_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "browser_usage_created_at_idx" ON "browser_usage" USING btree ("created_at");