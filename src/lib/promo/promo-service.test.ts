import { beforeEach, describe, expect, it, vi } from "vitest";
import { PromoService, generateRandomCode } from "./promo-service";

vi.mock("@/lib/db/supabase-rest", () => ({
  supabaseRest: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

describe("PromoService Unit Tests", () => {
  beforeEach(() => {
    PromoService._resetForTesting();
  });

  const testUser = {
    id: "user-promo-test-1",
    email: "testuser@waspai.in",
    name: "Promo Tester",
    tier: "free",
  };

  it("generates a cleanly formatted random promo code", () => {
    const code = generateRandomCode("max", 1);
    expect(code).toMatch(/^MAX-1M-[A-F0-9]{4,5}$/);

    const proCode = generateRandomCode("pro", 3);
    expect(proCode).toMatch(/^PRO-3M-[A-F0-9]{4,5}$/);
  });

  it("creates a new promo code with specified plan and duration", async () => {
    const promo = await PromoService.createPromoCode({
      code: "TEST-MAX-1M",
      plan: "max",
      durationMonths: 1,
      maxUses: 5,
      notes: "Unit test promo code",
    });

    expect(promo.code).toBe("TEST-MAX-1M");
    expect(promo.plan).toBe("max");
    expect(promo.durationMonths).toBe(1);
    expect(promo.maxUses).toBe(5);
    expect(promo.timesRedeemed).toBe(0);
    expect(promo.isActive).toBe(true);
  });

  it("prevents creating duplicate promo codes", async () => {
    await PromoService.createPromoCode({
      code: "TEST-DUP-1M",
      plan: "max",
      durationMonths: 1,
    });

    await expect(
      PromoService.createPromoCode({
        code: "TEST-DUP-1M",
        plan: "max",
        durationMonths: 1,
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("redeems an active promo code and upgrades user tier", async () => {
    await PromoService.createPromoCode({
      code: "REDEEM-MAX-1M",
      plan: "max",
      durationMonths: 1,
      maxUses: 10,
    });

    const result = await PromoService.redeemPromoCode(
      "REDEEM-MAX-1M",
      testUser,
    );

    expect(result.success).toBe(true);
    expect(result.plan).toBe("max");
    expect(result.durationMonths).toBe(1);
    expect(result.expiresAt).toBeDefined();

    // Verify expiration is roughly 30 days ahead
    const expiry = new Date(result.expiresAt!).getTime();
    const now = Date.now();
    expect(expiry).toBeGreaterThan(now + 28 * 24 * 60 * 60 * 1000);
  });

  it("prevents double-redemption of the same promo code by the same user", async () => {
    await PromoService.createPromoCode({
      code: "DOUBLE-REDEEM-1M",
      plan: "max",
      durationMonths: 1,
      maxUses: 10,
    });

    const firstResult = await PromoService.redeemPromoCode(
      "DOUBLE-REDEEM-1M",
      testUser,
    );
    expect(firstResult.success).toBe(true);

    const secondResult = await PromoService.redeemPromoCode(
      "DOUBLE-REDEEM-1M",
      testUser,
    );
    expect(secondResult.success).toBe(false);
    expect(secondResult.message).toContain("already redeemed");
  });

  it("rejects redemption of non-existent promo codes", async () => {
    const result = await PromoService.redeemPromoCode("NON-EXISTENT-XYZ", {
      id: "other-user",
      email: "other@waspai.in",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid promo code");
  });

  it("rejects redemption of paused/inactive promo codes", async () => {
    const promo = await PromoService.createPromoCode({
      code: "PAUSED-PRO-1M",
      plan: "pro",
      durationMonths: 1,
      maxUses: 10,
    });

    await PromoService.togglePromoActive(promo.id, false);

    const result = await PromoService.redeemPromoCode("PAUSED-PRO-1M", {
      id: "new-user-2",
      email: "new2@waspai.in",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("inactive or paused");
  });

  it("rejects redemption of expired promo codes", async () => {
    await PromoService.createPromoCode({
      code: "EXPIRED-CODE-1M",
      plan: "pro",
      durationMonths: 1,
      maxUses: 10,
      expiresAt: new Date(Date.now() - 10000).toISOString(),
    });

    const result = await PromoService.redeemPromoCode("EXPIRED-CODE-1M", {
      id: "new-user-3",
      email: "new3@waspai.in",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("expired");
  });

  it("rejects redemption when max uses limit is reached", async () => {
    await PromoService.createPromoCode({
      code: "SINGLE-USE-MAX",
      plan: "max",
      durationMonths: 2,
      maxUses: 1,
    });

    // 1st redemption succeeds
    const res1 = await PromoService.redeemPromoCode("SINGLE-USE-MAX", {
      id: "user-a",
      email: "usera@waspai.in",
    });
    expect(res1.success).toBe(true);

    // 2nd redemption by different user fails due to limit
    const res2 = await PromoService.redeemPromoCode("SINGLE-USE-MAX", {
      id: "user-b",
      email: "userb@waspai.in",
    });
    expect(res2.success).toBe(false);
    expect(res2.message).toContain("maximum redemption limit");
  });
});
