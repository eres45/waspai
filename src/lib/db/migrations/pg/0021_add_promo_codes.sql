-- Migration: Add promo_code and promo_redemption tables for plan vouchers
CREATE TABLE IF NOT EXISTS "promo_code" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text NOT NULL UNIQUE,
  "plan" text NOT NULL,
  "duration_months" integer NOT NULL DEFAULT 1,
  "max_uses" integer NOT NULL DEFAULT 1,
  "times_redeemed" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp with time zone,
  "notes" text,
  "created_by" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "promo_redemption" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "promo_id" uuid REFERENCES "promo_code"("id") ON DELETE CASCADE,
  "promo_code" text NOT NULL,
  "user_id" uuid REFERENCES "user"("id") ON DELETE CASCADE,
  "user_email" text NOT NULL,
  "user_name" text,
  "plan" text NOT NULL,
  "duration_months" integer NOT NULL DEFAULT 1,
  "previous_tier" text,
  "new_expires_at" timestamp with time zone NOT NULL,
  "redeemed_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "promo_code_code_idx" ON "promo_code"("code");
CREATE INDEX IF NOT EXISTS "promo_redemption_user_id_idx" ON "promo_redemption"("user_id");
CREATE INDEX IF NOT EXISTS "promo_redemption_promo_id_idx" ON "promo_redemption"("promo_id");
