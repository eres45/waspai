"use client";

import { useState } from "react";
import {
  Ticket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "auth/client";
import { toast } from "sonner";
import Link from "next/link";

interface PromoRedeemCardProps {
  onSuccess?: (plan: string) => void;
}

export function PromoRedeemCard({ onSuccess }: PromoRedeemCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    plan: string;
    durationMonths: number;
    expiresAt: string;
  } | null>(null);

  const { data: session } = authClient.useSession();

  const handleRedeem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError("Please enter a promo code.");
      return;
    }

    if (!session?.user) {
      setError("Please sign in first to redeem a promo code on your account.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to redeem promo code.");
      }

      setSuccessData({
        message: data.message,
        plan: data.plan,
        durationMonths: data.durationMonths,
        expiresAt: data.expiresAt,
      });

      toast.success(data.message || "Promo code activated successfully!");
      onSuccess?.(data.plan);

      // Refresh window after brief moment so all UI gates & models update seamlessly
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Invalid promo code.");
      toast.error(err.message || "Failed to redeem code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto transition-all">
      {/* ── Toggle Line ── */}
      <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <Ticket className="w-4 h-4 text-primary shrink-0" />
        <span>Have a promo?</span>
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setError(null);
          }}
          className="font-medium text-primary hover:underline focus:outline-none transition-colors"
        >
          {isOpen ? "Close box" : "redeem it"}
        </button>
      </div>

      {/* ── Expandable Redeem Box ── */}
      {isOpen && (
        <div className="mt-3 relative rounded-2xl border border-primary/20 bg-background/80 backdrop-blur-xl p-4 sm:p-5 shadow-2xl animate-in fade-in-50 slide-in-from-top-3 duration-200">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {successData ? (
            <div className="text-center py-2 space-y-2.5">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                Promo Code Activated!
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {successData.message}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {successData.plan.toUpperCase()} Plan active for{" "}
                  {successData.durationMonths}{" "}
                  {successData.durationMonths === 1 ? "month" : "months"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/80 font-mono">
                Syncing your account perks...
              </p>
            </div>
          ) : !session?.user ? (
            <div className="text-center py-2 space-y-3">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Sign in to Redeem
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You need an active account to link your subscription perks.
                </p>
              </div>
              <Button asChild size="sm" className="font-semibold gap-1.5">
                <Link href="/auth">
                  <span>Sign In / Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRedeem} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="Enter promo code (e.g. WASP-MAX-VIP)"
                    className="pl-9 font-mono uppercase text-sm tracking-wider h-10 bg-background/50 border-muted-foreground/30 focus-visible:border-primary"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="h-10 px-5 font-semibold gap-1.5 shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Redeeming...</span>
                    </>
                  ) : (
                    <span>Redeem</span>
                  )}
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center">
                Vouchers instantly unlock full Pro or Max features with zero
                charges.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
