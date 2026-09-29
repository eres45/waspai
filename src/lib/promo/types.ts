export interface PromoCode {
  id: string;
  code: string; // Uppercase, alphanumeric with hyphens, e.g. "MAX-1M-VIP"
  plan: "pro" | "max";
  durationMonths: number; // 1, 2, 3, 6, 12 etc.
  maxUses: number; // 1 for single-use, -1 for unlimited
  timesRedeemed: number;
  isActive: boolean;
  expiresAt?: string | null; // ISO string or null
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoRedemption {
  id: string;
  promoId: string;
  promoCode: string;
  userId: string;
  userEmail: string;
  userName?: string;
  plan: "pro" | "max";
  durationMonths: number;
  previousTier?: string;
  newExpiresAt: string;
  redeemedAt: string;
}

export interface CreatePromoInput {
  code?: string;
  plan: "pro" | "max";
  durationMonths: number;
  maxUses?: number;
  expiresAt?: string | null;
  notes?: string;
  createdBy?: string;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  plan?: "pro" | "max";
  durationMonths?: number;
  expiresAt?: string;
}
