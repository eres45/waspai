import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("auth/server", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/db/repository", () => ({
  userRepository: {
    getUserById: vi.fn(),
    getUserByReferralCode: vi.fn(),
    updateReferralInfo: vi.fn(),
  },
}));

vi.mock("next/headers", () => {
  const mockCookieStore = {
    get: vi.fn().mockReturnValue({ value: "mock_cookie_ref" }),
    delete: vi.fn(),
  };
  return {
    cookies: vi.fn().mockImplementation(() => Promise.resolve(mockCookieStore)),
  };
});

import { POST } from "./route";
import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { userRepository } from "@/lib/db/repository";

describe("Referral API POST apply endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/referral/apply", {
      method: "POST",
      body: JSON.stringify({ ref: "referrer_code" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 400 if self-referral", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "user1@example.com" },
    } as any);

    vi.mocked(userRepository.getUserById).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      referredBy: null,
    } as any);

    vi.mocked(userRepository.getUserByReferralCode).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
    } as any);

    const request = new NextRequest("http://localhost/api/referral/apply", {
      method: "POST",
      body: JSON.stringify({ ref: "user-1-ref-code" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Self-referral is not allowed");
  });

  it("should return 400 if same email domain", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "user1@example.com" },
    } as any);

    vi.mocked(userRepository.getUserById).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      referredBy: null,
    } as any);

    vi.mocked(userRepository.getUserByReferralCode).mockResolvedValue({
      id: "user-2",
      email: "user2@example.com",
    } as any);

    const request = new NextRequest("http://localhost/api/referral/apply", {
      method: "POST",
      body: JSON.stringify({ ref: "user-2-ref-code" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("same email domain");
  });

  it("should return 400 if same IP address", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "user1@domain1.com" },
    } as any);

    vi.mocked(userRepository.getUserById).mockResolvedValue({
      id: "user-1",
      email: "user1@domain1.com",
      referredBy: null,
    } as any);

    vi.mocked(userRepository.getUserByReferralCode).mockResolvedValue({
      id: "user-2",
      email: "user2@domain2.com",
      lastSignInIp: "192.168.1.50",
    } as any);

    const request = new NextRequest("http://localhost/api/referral/apply", {
      method: "POST",
      headers: {
        "x-forwarded-for": "192.168.1.50",
      },
      body: JSON.stringify({ ref: "user-2-ref-code" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("same network connection");
  });

  it("should apply referral and increment count without tier rewards for < 3 referrals", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-referred", email: "referred@domain1.com" },
    } as any);

    vi.mocked(userRepository.getUserById).mockResolvedValue({
      id: "user-referred",
      email: "referred@domain1.com",
      referredBy: null,
    } as any);

    vi.mocked(userRepository.getUserByReferralCode).mockResolvedValue({
      id: "user-referrer",
      email: "referrer@domain2.com",
      referralCount: 1,
      referralRewardClaimed: "none",
      tier: "free",
      tierExpiresAt: null,
    } as any);

    const request = new NextRequest("http://localhost/api/referral/apply", {
      method: "POST",
      body: JSON.stringify({ ref: "referrer-ref-code" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    expect(userRepository.updateReferralInfo).toHaveBeenCalledWith(
      "user-referred",
      {
        referredBy: "referrer-ref-code",
      },
    );

    expect(userRepository.updateReferralInfo).toHaveBeenCalledWith(
      "user-referrer",
      {
        referralCount: 2,
        referralRewardClaimed: "none",
        referralWidgetHidden: false,
        tier: "free",
        tierExpiresAt: null,
      },
    );
  });

  it("should grant 14 days Pro for the 3rd referral", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-referred", email: "referred@domain1.com" },
    } as any);

    vi.mocked(userRepository.getUserById).mockResolvedValue({
      id: "user-referred",
      email: "referred@domain1.com",
      referredBy: null,
    } as any);

    vi.mocked(userRepository.getUserByReferralCode).mockResolvedValue({
      id: "user-referrer",
      email: "referrer@domain2.com",
      referralCount: 2,
      referralRewardClaimed: "none",
      tier: "free",
      tierExpiresAt: null,
    } as any);

    const request = new NextRequest("http://localhost/api/referral/apply", {
      method: "POST",
      body: JSON.stringify({ ref: "referrer-ref-code" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    expect(userRepository.updateReferralInfo).toHaveBeenCalledWith(
      "user-referrer",
      expect.objectContaining({
        referralCount: 3,
        referralRewardClaimed: "14days",
        tier: "pro",
        tierExpiresAt: expect.any(Date),
      }),
    );
  });

  it("should extend tier expiry by 30 more days for the 5th referral and hide widget", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-referred", email: "referred@domain1.com" },
    } as any);

    vi.mocked(userRepository.getUserById).mockResolvedValue({
      id: "user-referred",
      email: "referred@domain1.com",
      referredBy: null,
    } as any);

    const initialExpiry = new Date();
    vi.mocked(userRepository.getUserByReferralCode).mockResolvedValue({
      id: "user-referrer",
      email: "referrer@domain2.com",
      referralCount: 4,
      referralRewardClaimed: "14days",
      tier: "pro",
      tierExpiresAt: initialExpiry,
    } as any);

    const request = new NextRequest("http://localhost/api/referral/apply", {
      method: "POST",
      body: JSON.stringify({ ref: "referrer-ref-code" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    expect(userRepository.updateReferralInfo).toHaveBeenCalledWith(
      "user-referrer",
      expect.objectContaining({
        referralCount: 5,
        referralRewardClaimed: "1month",
        referralWidgetHidden: true,
        tier: "pro",
        tierExpiresAt: expect.any(Date),
      }),
    );
  });
});
