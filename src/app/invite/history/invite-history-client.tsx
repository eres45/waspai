"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  Award,
  Calendar,
  Sparkles,
  Ticket,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReferralEntry {
  id: string;
  name: string;
  maskedEmail: string;
  joinedAt: string;
}

interface HistoryData {
  referralCode: string;
  referralCount: number;
  referralRewardClaimed: string;
  tier: string;
  tierExpiresAt: string | null;
  inviteLink: string;
  referrals: ReferralEntry[];
}

export default function InviteHistoryClient() {
  const router = useRouter();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/history")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load history");
        return res.json();
      })
      .then((json: HistoryData) => {
        setData(json);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load referral history");
      })
      .finally(() => setLoading(false));
  }, []);

  const copyLink = async () => {
    if (!data?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(data.inviteLink);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const getRewardBadge = (claimed: string) => {
    switch (claimed) {
      case "1month":
        return "1 Month Pro Active";
      case "14days":
        return "14 Days Pro Active";
      default:
        return "In Progress";
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-[#e8eaed] font-sans flex flex-col items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#1a3a5c]/20 via-[#3b2f6e]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push("/invite")}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors duration-150 py-1.5 px-2.5 rounded-lg hover:bg-white/[0.04]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invite</span>
          </button>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/60 flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-emerald-400" />
            <span>K3 Rewards</span>
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            My Invites & Referral History
          </h1>
          <p className="text-sm text-white/50">
            Track friends who joined via your link and monitor your earned Pro
            credits.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Friends Invited</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {loading ? "..." : (data?.referralCount ?? 0)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Reward Status</span>
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {loading
                ? "..."
                : getRewardBadge(data?.referralRewardClaimed || "none")}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Current Tier</span>
            </div>
            <div className="text-sm font-semibold text-white capitalize flex items-center gap-1.5">
              <span>{loading ? "..." : (data?.tier ?? "Free")}</span>
              {data?.tier === "pro" && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
          </div>
        </div>

        {/* Invite Link Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/[0.08] mb-6">
          <label className="text-xs text-white/40 mb-2 block font-medium">
            Your Personal Invite Link
          </label>
          <div className="flex items-center gap-2 bg-black/40 border border-white/[0.06] rounded-lg px-3 py-2">
            <input
              type="text"
              readOnly
              value={data?.inviteLink || "https://waspai.in/sign-up?ref=..."}
              className="bg-transparent text-sm text-white/70 w-full focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={copyLink}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all duration-150",
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-black hover:bg-white/90",
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Invited Users List */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-white/50" />
              <span>Joined Friends</span>
            </h2>
            <span className="text-xs text-white/40">
              {data?.referrals?.length ?? 0} total
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-white/30">
              Loading invitations...
            </div>
          ) : !data?.referrals || data.referrals.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-white/70 mb-1">
                No friends invited yet
              </p>
              <p className="text-xs text-white/40 max-w-sm mb-4">
                Share your invite link with colleagues and friends. Once they
                sign up, they will appear here and you will unlock K3 Pro
                credits!
              </p>
              <button
                type="button"
                onClick={copyLink}
                className="text-xs bg-white/[0.06] hover:bg-white/[0.1] text-white px-3.5 py-1.5 rounded-lg border border-white/[0.1] transition-colors"
              >
                Copy Invite Link
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {data.referrals.map((friend) => (
                <div
                  key={friend.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-white/60">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white leading-tight">
                        {friend.name}
                      </p>
                      <p className="text-xs text-white/40 leading-tight mt-0.5">
                        {friend.maskedEmail}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                    <p className="text-[11px] text-white/30 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(friend.joinedAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
