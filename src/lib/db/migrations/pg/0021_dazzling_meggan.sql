ALTER TABLE "user" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referred_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referral_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referral_reward_claimed" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referral_widget_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tier_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_referral_code_unique" UNIQUE("referral_code");