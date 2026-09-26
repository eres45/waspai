"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  Shield,
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
      pass: "ronit@9325296264",
    },
    secondary: {
      email: "ronit@waspai.in",
      pass: "ronit@1070576",
    },
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const autoFill = (pair: { email: string; pass: string }) => {
    setEmail(pair.email);
    setPassword(pair.pass);
    setError("");
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both Admin ID and Password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-panel/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid Admin Credentials");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Refresh page so server component layout detects the authenticated admin session
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 md:p-8 overflow-hidden bg-background">
      {/* Background Landing-Page Grid & Glow Accents */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-primary/25 to-blue-500/20 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Floating Corner Credentials Badge (Desktop View) */}
      <div className="hidden lg:block absolute top-8 right-8 z-20 w-80 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-4 shadow-2xl transition hover:border-white/20">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="p-1 rounded-md bg-primary/20 text-primary">
            <KeyRound className="size-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-wide uppercase text-foreground">
            Admin Credentials
          </span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
            Active
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2 rounded-lg bg-background/60 border border-border/40 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-muted-foreground block text-[10px]">
                ID:
              </span>
              <span className="font-mono text-foreground select-all">
                {adminCredentials.primary.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(adminCredentials.primary.email, "corner-email")
              }
              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition"
              title="Copy ID"
            >
              {copiedField === "corner-email" ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>

          <div className="p-2 rounded-lg bg-background/60 border border-border/40 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-muted-foreground block text-[10px]">
                PASS:
              </span>
              <span className="font-mono text-foreground select-all">
                {adminCredentials.primary.pass}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(adminCredentials.primary.pass, "corner-pass")
              }
              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition"
              title="Copy Password"
            >
              {copiedField === "corner-pass" ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => autoFill(adminCredentials.primary)}
            className="w-full mt-2 py-1.5 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="size-3.5" /> Auto-Fill Credentials
          </button>
        </div>
      </div>

      {/* Main Glassmorphic Access Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glow Border Frame */}
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-2xl">
          <div className="rounded-3xl bg-card/80 backdrop-blur-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="size-12 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-blue-500 p-[1px] mb-4 shadow-lg shadow-primary/25">
                <div className="size-full rounded-2xl bg-background flex items-center justify-center">
                  <Shield className="size-6 text-primary" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="size-3" /> Admin Protected Portal
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Authorize Admin Access
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Enter your administrative credentials to manage system users and
                platform operations.
              </p>
            </div>

            {/* Mobile / Tablet Credentials Accordion */}
            <div className="lg:hidden mb-6 p-3 rounded-xl bg-background/60 border border-border/50 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="size-3 text-primary" /> Quick
                  Credentials:
                </span>
                <button
                  type="button"
                  onClick={() => autoFill(adminCredentials.primary)}
                  className="text-primary text-[11px] hover:underline font-medium"
                >
                  Auto-Fill
                </button>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between items-center">
                  <span>
                    ID:{" "}
                    <strong className="text-foreground">
                      {adminCredentials.primary.email}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        adminCredentials.primary.email,
                        "mob-email",
                      )
                    }
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "mob-email" ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    Pass:{" "}
                    <strong className="text-foreground">
                      {adminCredentials.primary.pass}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(adminCredentials.primary.pass, "mob-pass")
                    }
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === "mob-pass" ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="size-4 shrink-0" />
                <span>Access Granted! Redirecting to user panel...</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Admin ID / Email</span>
                  <button
                    type="button"
                    onClick={() => autoFill(adminCredentials.primary)}
                    className="text-[11px] text-muted-foreground hover:text-primary transition"
                  >
                    Use default
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="waspai@admin.in"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/70 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/70 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary via-purple-600 to-blue-600 text-white font-medium text-sm shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? (
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Unlock Admin Panel</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Features */}
            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="size-3 text-primary" /> Full RBAC Enforcement
              </span>
              <span className="flex items-center gap-1 font-mono">
                WaspAI Core v1.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
