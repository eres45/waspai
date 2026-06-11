CREATE TABLE "system_error" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"error_name" text NOT NULL,
	"error_message" text NOT NULL,
	"error_stack" text,
	"path" text,
	"method" text,
	"status_code" integer,
	"metadata" json,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_daily_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" varchar NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tier" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "welcome_email_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "system_error" ADD CONSTRAINT "system_error_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_usage" ADD CONSTRAINT "user_daily_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "system_error_created_at_idx" ON "system_error" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "system_error_error_name_idx" ON "system_error" USING btree ("error_name");--> statement-breakpoint
CREATE INDEX "user_daily_usage_user_action_date_idx" ON "user_daily_usage" USING btree ("user_id","action_type","created_at");