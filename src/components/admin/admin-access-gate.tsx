"use client";

import { Threads } from "@/components/landing/threads";
import { LiquidMetalButton } from "@/components/ui/liquid-metal";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

export function AdminAccessGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-panel/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => window.location.reload(), 900);
      } else {
        setError(data.error || "Access denied.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#161618] flex items-center justify-center overflow-hidden">
      {/* WebGL Threads — same as landing hero */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Threads amplitude={1} distance={0} enableMouseInteraction />
      </div>

      {/* Ambient glow orbs */}
      <div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(251,191,36,0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        {/* Top badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-white/60 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
            <span className="size-1.5 rounded-full bg-white/40 shadow-[0_0_6px_2px_rgba(255,255,255,0.2)] animate-pulse" />
            Admin Protected Portal
          </div>
        </div>

        {/* Headline */}
        <h1
          className="text-center font-extrabold leading-[1.04] tracking-[-0.03em] mb-3"
          style={{ fontSize: "clamp(32px, 6vw, 52px)" }}
        >
          <span
            style={{
              display: "block",
              background:
                "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.82) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 24px rgba(255,255,255,0.08))",
            }}
          >
            Authorize
          </span>
          <span
            style={{
              display: "block",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Admin Access
          </span>
        </h1>

        <p className="text-center text-[14px] text-white/35 mb-8 leading-relaxed">
          Restricted area. Authorized personnel only.
        </p>

        {/* Form card */}
        <div
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="············"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pr-12 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[13px] text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-1">
              {success ? (
                <div className="flex items-center justify-center gap-2 w-full rounded-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[14px]">
                  <ShieldCheck className="w-4 h-4" />
                  Access Granted · Redirecting…
                </div>
              ) : (
                <LiquidMetalButton
                  type="submit"
                  disabled={loading}
                  size="md"
                  icon={<ArrowRight className="w-5 h-5" />}
                  metalConfig={{
                    colorBack: "#555555",
                    colorTint: "#ffffff",
                    distortion: 0.15,
                    speed: 0.4,
                  }}
                  className="w-full"
                >
                  {loading ? "Verifying…" : "Unlock Admin Panel"}
                </LiquidMetalButton>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[12px] text-white/20">
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-white/20" />
            HMAC-secured session
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-white/20" />
            WaspAI Core v1.0
          </span>
        </div>
      </div>
    </div>
  );
}
