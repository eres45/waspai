"use client";

import { Threads } from "@/components/landing/threads";
import { LiquidMetalButton } from "@/components/ui/liquid-metal";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

export function AdminAccessGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const adminCredentials = {
    primary: {
      email: "waspai@admin.in",
      pass: "ronit@udita4550",
    },
    secondary: {
      email: "ronit@waspai.in",
      pass: "ronit@udita4550",
    },
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const autoFill = () => {
    setEmail(adminCredentials.primary.email);
    setPassword(adminCredentials.primary.pass);
    setError("");
  };

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
        setError(data.error || "Invalid credentials. Access denied.");
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

      {/* Credential quick-reference card — top right */}
      <div className="absolute top-6 right-6 z-20 w-[260px] hidden md:block">
        <div
          className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold tracking-[0.15em] text-white/40 uppercase">
              Admin Credentials
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>

          {/* Email row */}
          <div className="mb-2">
            <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">
              Email
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[12px] text-white/80 font-mono truncate">
                {adminCredentials.primary.email}
              </code>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(adminCredentials.primary.email, "email")
                }
                className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
              >
                {copiedField === "email" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Password row */}
          <div className="mb-3">
            <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">
              Pass
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[12px] text-white/80 font-mono truncate">
                {adminCredentials.primary.pass}
              </code>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(adminCredentials.primary.pass, "pass")
                }
                className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
              >
                {copiedField === "pass" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Auto-fill button */}
          <button
            type="button"
            onClick={autoFill}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors py-2 text-[12px] font-medium text-white/60 hover:text-white"
          >
            <Sparkles className="w-3 h-3" />
            Auto-Fill Credentials
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        {/* Top badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-white/60 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
            <span className="size-1.5 rounded-full bg-white/40 shadow-[0_0_6px_2px_rgba(255,255,255,0.2)] animate-pulse" />
            Admin Protected Portal
          </div>
        </div>

        {/* Headline — landing page style gradient text */}
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
          Enter your administrator credentials to manage system users and
          platform operations.
        </p>

        {/* Form card */}
        <div
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-medium text-white/50 uppercase tracking-wider">
                  Admin ID / Email
                </label>
                <button
                  type="button"
                  onClick={() => setEmail(adminCredentials.primary.email)}
                  className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Use default
                </button>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={adminCredentials.primary.email}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                autoComplete="email"
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

        {/* Footer trust indicators */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[12px] text-white/20">
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-white/20" />
            Tip: HMAC Authentication
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-white/20" />
            WaspAI Core v1.0
          </span>
        </div>

        {/* Mobile credentials (below form) */}
        <div className="md:hidden mt-6">
          <div
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-4"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset" }}
          >
            <p className="text-[11px] font-semibold tracking-[0.15em] text-white/40 uppercase mb-3">
              Admin Credentials
            </p>
            <div className="space-y-2 mb-3">
              {[
                {
                  label: "Email",
                  value: adminCredentials.primary.email,
                  key: "m-email",
                },
                {
                  label: "Pass",
                  value: adminCredentials.primary.pass,
                  key: "m-pass",
                },
              ].map(({ label, value, key }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-[10px] text-white/30 w-8 shrink-0 uppercase">
                    {label}
                  </span>
                  <code className="flex-1 text-[11px] text-white/70 font-mono truncate">
                    {value}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(value, key)}
                    className="shrink-0 p-1 rounded hover:bg-white/10 text-white/40"
                  >
                    {copiedField === key ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={autoFill}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors py-2 text-[12px] font-medium text-white/60"
            >
              <Sparkles className="w-3 h-3" />
              Auto-Fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
