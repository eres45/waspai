CREATE TABLE "model_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"status" varchar NOT NULL,
	"response_time" bigint,
	"error_message" text,
	"tested_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" varchar DEFAULT 'unknown' NOT NULL,
	"response_time" bigint,
	"error_message" text,
	"tested_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "model_status_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE INDEX "model_status_history_model_id_idx" ON "model_status_history" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "model_status_history_tested_at_idx" ON "model_status_history" USING btree ("tested_at");--> statement-breakpoint
CREATE INDEX "model_status_model_id_idx" ON "model_status" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "model_status_tested_at_idx" ON "model_status" USING btree ("tested_at");