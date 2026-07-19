"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, FileText, Copy, Check, UserPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReferralInfo {
  referralCode: string;
  referralCount: number;
  referralRewardClaimed: string;
  referralWidgetHidden: boolean;
  inviteLink: string;
}

// Cards ordered left → right in the fan
// center card = index 2 (the active reward)
const TIERS = [
  {
    days: 365,
    label: "days",
    gradient: "from-[#3b2f6e] via-[#4c3a8c] to-[#2a2060]",
    border: "rgba(120,80,220,0.5)",
    rotate: -28,
    translateY: 36,
    translateX: -40,
    scale: 0.72,
    opacity: 0.7,
    glow: false,
  },
  {
    days: 30,
    label: "days",
    gradient: "from-[#1a3a5c] via-[#1d4e7a] to-[#132a42]",
    border: "rgba(60,140,220,0.5)",
    rotate: -14,
    translateY: 16,
    translateX: -16,
    scale: 0.84,
    opacity: 0.85,
    glow: false,
  },
  {
    days: 7,
    label: "days",
    gradient: "from-[#0f3a3a] via-[#0e5050] to-[#083030]",
    border: "rgba(40,200,180,0.7)",
    rotate: 0,
    translateY: 0,
    translateX: 0,
    scale: 1,
    opacity: 1,
    glow: true,
  },
  {
    days: 15,
    label: "days",
    gradient: "from-[#1a3a5c] via-[#1d4e7a] to-[#132a42]",
    border: "rgba(60,140,220,0.5)",
    rotate: 14,
    translateY: 16,
    translateX: 16,
    scale: 0.84,
    opacity: 0.85,
    glow: false,
  },
  {
    days: 3,
    label: "days",
    gradient: "from-[#2a2060] via-[#1e1850] to-[#130f40]",
    border: "rgba(100,80,200,0.4)",
    rotate: 28,
    translateY: 36,
    translateX: 40,
    scale: 0.72,
    opacity: 0.7,
    glow: false,
  },
];

function K3Card({
  days,
  label,
  gradient,
  border,
  rotate,
  translateY,
  translateX,
  scale,
  opacity,
  glow,
}: (typeof TIERS)[0]) {
  return (
    <div
      className="absolute"
      style={{
        transform: `rotate(${rotate}deg) translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`,
        opacity,
        zIndex: glow ? 10 : 1,
        transition: "all 0.3s ease",
      }}
    >
      {/* Glow halo behind center card */}
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: "0 0 60px 20px rgba(20, 180, 160, 0.35)",
            zIndex: -1,
          }}
        />
      )}
      {/* Card itself — landscape credit-card proportions */}
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br p-px shadow-2xl",
          gradient,
        )}
        style={{
          width: 160,
          height: 104,
          border: `1px solid ${border}`,
        }}
      >
        <div className="w-full h-full rounded-2xl bg-[#0b0d14]/80 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Top shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none" />
          {/* Branding label at top */}
          <span className="absolute top-2.5 left-0 right-0 text-center text-[8px] uppercase tracking-[0.2em] text-white/30 font-semibold">
            WaspAI
          </span>
          {/* Big number */}
          <span
            className="font-bold text-white leading-none z-10"
            style={{ fontSize: glow ? 38 : 32 }}
          >
            {days}
          </span>
          {/* "days" below */}
          <span className="text-[10px] text-white/45 z-10 mt-0.5">{label}</span>
          {/* Bottom shimmer line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export default function InviteClient() {
  const router = useRouter();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/info")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setInfo(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = useCallback(async () => {
    const link = info?.inviteLink;
    if (!link) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const el = document.createElement("textarea");
        el.value = link;
        el.style.position = "fixed";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  }, [info]);

  const invitesLeft = Math.max(0, 5 - (info?.referralCount ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      {/* Dialog */}
      <div
        className="relative w-full max-w-3xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "#0d0f18",
          border: "1px solid rgba(255,255,255,0.07)",
          minHeight: 520,
        }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: 0.25,
          }}
        />

        {/* Radial glow behind cards */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 480,
            height: 280,
            background:
              "radial-gradient(ellipse, rgba(20,160,140,0.18) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />

        {/* Top-right actions */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
          <button
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Terms"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header */}
        <div className="relative z-10 pt-9 text-center px-8">
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Earn Together
          </h1>
          <p className="mt-1 text-[13px] text-white/40">
            Invite friends to WaspAI for guaranteed K3 Credits
          </p>
        </div>

        {/* Card fan */}
        <div
          className="relative z-10 flex items-center justify-center"
          style={{ height: 200, marginTop: 24 }}
        >
          {TIERS.map((tier) => (
            <K3Card key={tier.days} {...tier} />
          ))}
        </div>

        {/* Active tier label */}
        <div className="relative z-10 text-center mt-4">
          <p className="text-[14px] font-semibold text-white">
            7-Day K3 Credits
          </p>
        </div>

        {/* CTA */}
        <div className="relative z-10 flex flex-col items-center gap-3 mt-4">
          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-1.5 rounded-full border border-white/15 bg-white/8 hover:bg-white/12 text-white text-[13px] font-medium transition-all duration-200 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 opacity-60" />
                Invite to earn chances
              </>
            )}
          </button>

          <div className="flex items-center gap-4 text-[12px] text-white/35">
            <span>
              Invites Left:{" "}
              <span className="text-white/60 font-medium">
                {loading ? "—" : invitesLeft}
              </span>
            </span>
            <span className="w-px h-3 bg-white/10" />
            <button
              onClick={() => router.push("/invite/history")}
              className="hover:text-white/60 transition-colors flex items-center gap-0.5"
            >
              My Invites <span className="ml-0.5 text-white/40">›</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative z-10 mx-6 mt-5 mb-4 border-t border-white/[0.06]" />

        {/* Bottom task cards */}
        <div className="relative z-10 px-6 pb-7">
          <p className="text-center text-[11px] text-white/30 mb-4">
            Complete any task below, and both of you get{" "}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-white/10 text-white/70 text-[10px] font-bold mx-0.5">
              1
            </span>{" "}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-white/10 text-white/70 text-[10px] font-bold mx-0.5">
              1
            </span>{" "}
            draw.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Task 1 */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-start gap-2">
                <UserPlus className="w-3.5 h-3.5 text-white/40 mt-0.5 flex-shrink-0" />
                <span className="text-[12px] text-white/70 font-medium leading-snug">
                  Invite a friend to join WaspAI
                </span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                {/* Avatar stack */}
                <div className="flex items-center">
                  {["L", "J", "Z", "O"].map((l, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-[#0d0f18]"
                      style={{
                        background: `hsl(${i * 60 + 200}, 60%, 45%)`,
                        marginLeft: i === 0 ? 0 : -6,
                        zIndex: 4 - i,
                      }}
                    >
                      {l}
                    </div>
                  ))}
                  <div
                    className="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/40 text-[9px]"
                    style={{ marginLeft: -6 }}
                  >
                    +
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-1 rounded-md text-[11px] font-medium text-white transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {copied ? "Copied!" : "Invite"}
                </button>
              </div>
            </div>

            {/* Task 2 */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-white/40 mt-0.5 flex-shrink-0" />
                <span className="text-[12px] text-white/70 font-medium leading-snug">
                  Invite a friend to subscribe to WaspAI Pro
                </span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="w-5 h-5 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/35 text-[11px]">
                  +
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-1 rounded-md text-[11px] font-medium text-white transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {copied ? "Copied!" : "Invite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
