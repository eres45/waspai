import fs from "fs";
import path from "path";
import crypto from "crypto";
import { supabaseRest } from "@/lib/db/supabase-rest";
import type {
  PromoCode,
  PromoRedemption,
  CreatePromoInput,
  RedeemResult,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROMOS_FILE = path.join(DATA_DIR, "promo-codes.json");
const REDEMPTIONS_FILE = path.join(DATA_DIR, "promo-redemptions.json");

// Initial seed codes if none exist
const DEFAULT_SEED_PROMOS: PromoCode[] = [
  {
    id: "promo-seed-1",
    code: "WELCOME-PRO-1M",
    plan: "pro",
    durationMonths: 1,
    maxUses: 100,
    timesRedeemed: 0,
    isActive: true,
    expiresAt: null,
    notes: "Default community starter code",
    createdBy: "System",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "promo-seed-2",
    code: "WASP-MAX-VIP",
    plan: "max",
    durationMonths: 1,
    maxUses: 50,
    timesRedeemed: 0,
    isActive: true,
    expiresAt: null,
    notes: "VIP 1-Month Max Plan access voucher",
    createdBy: "System",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let inMemoryPromos: PromoCode[] | null = null;
let inMemoryRedemptions: PromoRedemption[] | null = null;

function ensureStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROMOS_FILE)) {
      fs.writeFileSync(
        PROMOS_FILE,
        JSON.stringify(DEFAULT_SEED_PROMOS, null, 2),
        "utf8",
      );
    }
    if (!fs.existsSync(REDEMPTIONS_FILE)) {
      fs.writeFileSync(REDEMPTIONS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    console.warn("[PromoService] Storage initialization notice:", err);
  }
}

function loadLocalPromos(): PromoCode[] {
  if (inMemoryPromos) return inMemoryPromos;
  ensureStorage();
  try {
    if (fs.existsSync(PROMOS_FILE)) {
      const data = fs.readFileSync(PROMOS_FILE, "utf8");
      inMemoryPromos = JSON.parse(data);
      return inMemoryPromos || [];
    }
  } catch (err) {
    console.warn("[PromoService] Failed to read promos file:", err);
  }
  inMemoryPromos = [...DEFAULT_SEED_PROMOS];
  return inMemoryPromos;
}

function saveLocalPromos(promos: PromoCode[]): void {
  inMemoryPromos = promos;
  ensureStorage();
  try {
    fs.writeFileSync(PROMOS_FILE, JSON.stringify(promos, null, 2), "utf8");
  } catch (err) {
    console.warn("[PromoService] Failed to write promos file:", err);
  }
}

function loadLocalRedemptions(): PromoRedemption[] {
  if (inMemoryRedemptions) return inMemoryRedemptions;
  ensureStorage();
  try {
    if (fs.existsSync(REDEMPTIONS_FILE)) {
      const data = fs.readFileSync(REDEMPTIONS_FILE, "utf8");
      inMemoryRedemptions = JSON.parse(data);
      return inMemoryRedemptions || [];
    }
  } catch (err) {
    console.warn("[PromoService] Failed to read redemptions file:", err);
  }
  inMemoryRedemptions = [];
  return inMemoryRedemptions;
}

function saveLocalRedemptions(redemptions: PromoRedemption[]): void {
  inMemoryRedemptions = redemptions;
  ensureStorage();
  try {
    fs.writeFileSync(
      REDEMPTIONS_FILE,
      JSON.stringify(redemptions, null, 2),
      "utf8",
    );
  } catch (err) {
    console.warn("[PromoService] Failed to write redemptions file:", err);
  }
}

/**
 * Generate a random promo code formatted cleanly
 * Example: MAX-1M-7K8P or PRO-3M-4W2Z
 */
export function generateRandomCode(
  plan: "pro" | "max",
  durationMonths: number,
): string {
  const prefix = plan.toUpperCase();
  const dur = `${durationMonths}M`;
  const randomSuffix = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()
    .slice(0, 5);
  return `${prefix}-${dur}-${randomSuffix}`;
}

export class PromoService {
  /**
   * Reset in-memory and local storage to default state (for testing)
   */
  static _resetForTesting(): void {
    inMemoryPromos = [...DEFAULT_SEED_PROMOS];
    inMemoryRedemptions = [];
    saveLocalPromos(inMemoryPromos);
    saveLocalRedemptions(inMemoryRedemptions);
  }

  /**
   * List all promo codes (reads from Supabase if table exists, with fallback to local file)
   */
  static async listPromoCodes(): Promise<PromoCode[]> {
    try {
      const { data, error } = await supabaseRest
        .from("promo_code")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        // Map database row snake_case to camelCase
        return data.map((row: any) => ({
          id: row.id,
          code: row.code,
          plan: row.plan as "pro" | "max",
          durationMonths: Number(row.duration_months || 1),
          maxUses: Number(row.max_uses ?? 1),
          timesRedeemed: Number(row.times_redeemed || 0),
          isActive: Boolean(row.is_active ?? true),
          expiresAt: row.expires_at || null,
          notes: row.notes || "",
          createdBy: row.created_by || "Admin",
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Supabase table not created yet, fallback gracefully
    }

    return loadLocalPromos().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * List recent promo redemptions
   */
  static async listRedemptions(): Promise<PromoRedemption[]> {
    try {
      const { data, error } = await supabaseRest
        .from("promo_redemption")
        .select("*")
        .order("redeemed_at", { ascending: false })
        .limit(50);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          promoId: row.promo_id,
          promoCode: row.promo_code,
          userId: row.user_id,
          userEmail: row.user_email,
          userName: row.user_name || undefined,
          plan: row.plan as "pro" | "max",
          durationMonths: Number(row.duration_months || 1),
          previousTier: row.previous_tier || undefined,
          newExpiresAt: row.new_expires_at,
          redeemedAt: row.redeemed_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Fallback
    }

    return loadLocalRedemptions().sort(
      (a, b) =>
        new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime(),
    );
  }

  /**
   * Create a new promo code
   */
  static async createPromoCode(input: CreatePromoInput): Promise<PromoCode> {
    const plan = input.plan === "max" ? "max" : "pro";
    const durationMonths = Math.max(1, Number(input.durationMonths) || 1);
    const maxUses = input.maxUses !== undefined ? Number(input.maxUses) : 1; // 1 = single use, -1 = unlimited
    const code = (
      input.code?.trim() || generateRandomCode(plan, durationMonths)
    ).toUpperCase();

    // Check existing
    const existing = await this.listPromoCodes();
    if (existing.some((p) => p.code.toUpperCase() === code)) {
      throw new Error(`Promo code "${code}" already exists.`);
    }

    const newPromo: PromoCode = {
      id: crypto.randomUUID(),
      code,
      plan,
      durationMonths,
      maxUses,
      timesRedeemed: 0,
      isActive: true,
      expiresAt: input.expiresAt || null,
      notes: input.notes?.trim() || "",
      createdBy: input.createdBy || "Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local storage
    const currentLocal = loadLocalPromos();
    currentLocal.unshift(newPromo);
    saveLocalPromos(currentLocal);

    // Save to Supabase if table is available
    try {
      await supabaseRest.from("promo_code").insert({
        id: newPromo.id,
        code: newPromo.code,
        plan: newPromo.plan,
        duration_months: newPromo.durationMonths,
        max_uses: newPromo.maxUses,
        times_redeemed: 0,
        is_active: true,
        expires_at: newPromo.expiresAt,
        notes: newPromo.notes,
        created_by: newPromo.createdBy,
        created_at: newPromo.createdAt,
        updated_at: newPromo.updatedAt,
      });
    } catch (err) {
      console.warn("[PromoService] Supabase insert notice (using file):", err);
    }

    return newPromo;
  }

  /**
   * Delete or revoke a promo code
   */
  static async deletePromoCode(id: string): Promise<boolean> {
    const local = loadLocalPromos().filter((p) => p.id !== id);
    saveLocalPromos(local);

    try {
      await supabaseRest.from("promo_code").delete().eq("id", id);
    } catch {}

    return true;
  }

  /**
   * Toggle promo active status
   */
  static async togglePromoActive(
    id: string,
    isActive: boolean,
  ): Promise<PromoCode | null> {
    const local = loadLocalPromos();
    const target = local.find((p) => p.id === id);
    if (target) {
      target.isActive = isActive;
      target.updatedAt = new Date().toISOString();
      saveLocalPromos(local);
    }

    try {
      await supabaseRest
        .from("promo_code")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch {}

    return target || null;
  }

  /**
   * Redeem a promo code for a given user
   */
  static async redeemPromoCode(
    rawCode: string,
    user: { id: string; email: string; name?: string; tier?: string },
  ): Promise<RedeemResult> {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { success: false, message: "Please enter a valid promo code." };
    }

    // 1. Fetch promo
    const promos = await this.listPromoCodes();
    const promo = promos.find((p) => p.code.toUpperCase() === code);

    if (!promo) {
      return {
        success: false,
        message: "Invalid promo code. Please check and try again.",
      };
    }

    // 2. Active check
    if (!promo.isActive) {
      return {
        success: false,
        message: "This promo code is currently inactive or paused.",
      };
    }

    // 3. Expiry check
    if (promo.expiresAt) {
      const expiry = new Date(promo.expiresAt).getTime();
      if (Date.now() > expiry) {
        return {
          success: false,
          message: "This promo code has expired.",
        };
      }
    }

    // 4. Max uses check
    if (promo.maxUses > 0 && promo.timesRedeemed >= promo.maxUses) {
      return {
        success: false,
        message: "This promo code has reached its maximum redemption limit.",
      };
    }

    // 5. Already redeemed check for this user
    const redemptions = await this.listRedemptions();
    const alreadyUsed = redemptions.some(
      (r) =>
        (r.userId === user.id ||
          r.userEmail.toLowerCase() === user.email.toLowerCase()) &&
        (r.promoId === promo.id || r.promoCode.toUpperCase() === code),
    );

    if (alreadyUsed) {
      return {
        success: false,
        message: "You have already redeemed this promo code on your account.",
      };
    }

    // 6. Calculate new tier expiration
    const durationMs = promo.durationMonths * 30 * 24 * 60 * 60 * 1000;
    let newExpiresAt: Date;

    // Check user's current tier expiration in DB
    try {
      const { data: dbUser } = await supabaseRest
        .from("user")
        .select("tier, tier_expires_at")
        .eq("id", user.id)
        .single();

      const currentTier = dbUser?.tier || user.tier || "free";
      const currentExpiresAt = dbUser?.tier_expires_at
        ? new Date(dbUser.tier_expires_at).getTime()
        : 0;

      // If user is already on this tier and it's active in the future, extend it!
      if (
        (currentTier === promo.plan ||
          (promo.plan === "max" && currentTier === "ultra")) &&
        currentExpiresAt > Date.now()
      ) {
        newExpiresAt = new Date(currentExpiresAt + durationMs);
      } else {
        newExpiresAt = new Date(Date.now() + durationMs);
      }
    } catch {
      newExpiresAt = new Date(Date.now() + durationMs);
    }

    // 7. Update User Tier in Database
    try {
      await supabaseRest
        .from("user")
        .update({
          tier: promo.plan,
          tier_expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", user.id);
    } catch (err) {
      console.error(
        "[PromoService] Failed to update user tier in database:",
        err,
      );
      return {
        success: false,
        message:
          "Could not apply plan to your account. Please try again later.",
      };
    }

    // 8. Increment redemption count on promo
    promo.timesRedeemed += 1;
    promo.updatedAt = new Date().toISOString();
    const localPromos = loadLocalPromos();
    const idx = localPromos.findIndex((p) => p.id === promo.id);
    if (idx !== -1) {
      localPromos[idx] = promo;
      saveLocalPromos(localPromos);
    }

    try {
      await supabaseRest
        .from("promo_code")
        .update({
          times_redeemed: promo.timesRedeemed,
          updated_at: promo.updatedAt,
        })
        .eq("id", promo.id);
    } catch {}

    // 9. Record redemption log
    const redemptionRecord: PromoRedemption = {
      id: crypto.randomUUID(),
      promoId: promo.id,
      promoCode: promo.code,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      plan: promo.plan,
      durationMonths: promo.durationMonths,
      previousTier: user.tier || "free",
      newExpiresAt: newExpiresAt.toISOString(),
      redeemedAt: new Date().toISOString(),
    };

    const localReds = loadLocalRedemptions();
    localReds.unshift(redemptionRecord);
    saveLocalRedemptions(localReds);

    try {
      await supabaseRest.from("promo_redemption").insert({
        id: redemptionRecord.id,
        promo_id: redemptionRecord.promoId,
        promo_code: redemptionRecord.promoCode,
        user_id: redemptionRecord.userId,
        user_email: redemptionRecord.userEmail,
        user_name: redemptionRecord.userName,
        plan: redemptionRecord.plan,
        duration_months: redemptionRecord.durationMonths,
        previous_tier: redemptionRecord.previousTier,
        new_expires_at: redemptionRecord.newExpiresAt,
        redeemed_at: redemptionRecord.redeemedAt,
      });
    } catch {}

    const planDisplayName = promo.plan === "max" ? "Max Plan" : "Pro Plan";
    const durationText =
      promo.durationMonths === 1
        ? "1 month"
        : promo.durationMonths === 12
          ? "1 year"
          : `${promo.durationMonths} months`;

    return {
      success: true,
      message: `🎉 Success! Your account has been upgraded to ${planDisplayName} for ${durationText}.`,
      plan: promo.plan,
      durationMonths: promo.durationMonths,
      expiresAt: newExpiresAt.toISOString(),
    };
  }
}
