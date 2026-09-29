"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Trash2,
  Pause,
  Play,
  RotateCw,
  Search,
  Sparkles,
  Users,
  Loader2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { PromoCode, PromoRedemption } from "@/lib/promo/types";

export function PromoManagement() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<PromoRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "pro" | "max">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Form state
  const [formPlan, setFormPlan] = useState<"pro" | "max">("max");
  const [formDuration, setFormDuration] = useState<number>(1);
  const [customDuration, setCustomDuration] = useState<string>("");
  const [formMaxUses, setFormMaxUses] = useState<number>(1);
  const [customMaxUses, setCustomMaxUses] = useState<string>("");
  const [formCode, setFormCode] = useState<string>("");
  const [formExpiresAt, setFormExpiresAt] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch promo codes
  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin-panel/promos");
      if (!res.ok) throw new Error("Failed to load promo codes");
      const data = await res.json();
      setPromos(data.promos || []);
      setRedemptions(data.redemptions || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  // Auto-generate code helper
  const handleAutoGenerate = () => {
    const months = customDuration ? Number(customDuration) : formDuration;
    const prefix = formPlan.toUpperCase();
    const dur = `${months}M`;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormCode(`${prefix}-${dur}-${random}`);
  };

  // Create promo code
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDuration = customDuration
      ? Number(customDuration)
      : formDuration;
    const finalMaxUses = customMaxUses ? Number(customMaxUses) : formMaxUses;

    if (!finalDuration || finalDuration < 1) {
      toast.error("Please enter a valid duration in months.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin-panel/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode.trim() ? formCode.trim().toUpperCase() : undefined,
          plan: formPlan,
          durationMonths: finalDuration,
          maxUses: finalMaxUses,
          expiresAt: formExpiresAt
            ? new Date(formExpiresAt).toISOString()
            : null,
          notes: formNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create promo code");
      }

      toast.success(data.message || "Promo code created!");
      setFormCode("");
      setFormNotes("");
      setFormExpiresAt("");
      setCustomDuration("");
      setCustomMaxUses("");
      fetchPromos();
    } catch (err: any) {
      toast.error(err.message || "Failed to create promo code");
    } finally {
      setCreating(false);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin-panel/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update promo");
      toast.success(data.message || "Status updated");
      fetchPromos();
    } catch (err: any) {
      toast.error(err.message || "Failed to update promo status");
    }
  };

  // Delete promo
  const handleDeletePromo = async (id: string, code: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete promo code "${code}"?`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin-panel/promos?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete promo");
      toast.success("Promo code deleted");
      fetchPromos();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete promo");
    }
  };

  // Copy code to clipboard
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered promos
  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const matchesSearch =
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

      const matchesPlan =
        planFilter === "all" ? true : p.plan.toLowerCase() === planFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? p.isActive
            : !p.isActive;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [promos, search, planFilter, statusFilter]);

  // Derived stats
  const activeCount = promos.filter((p) => p.isActive).length;
  const totalRedemptions = promos.reduce(
    (sum, p) => sum + (p.timesRedeemed || 0),
    0,
  );
  const maxCodesCount = promos.filter((p) => p.plan === "max").length;
  const proCodesCount = promos.filter((p) => p.plan === "pro").length;

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] shadow-sm">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-2">
            <span className="text-xs uppercase font-medium">
              Total Promo Codes
            </span>
            <Ticket className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[#fafafa]">
            {promos.length}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">
            Generated vouchers in system
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] shadow-sm">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-2">
            <span className="text-xs uppercase font-medium">Active Codes</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {activeCount}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">
            Ready for redemption
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] shadow-sm">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-2">
            <span className="text-xs uppercase font-medium">
              Total Redemptions
            </span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {totalRedemptions}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">
            Claimed user upgrades
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] shadow-sm">
          <div className="flex items-center justify-between text-[#a1a1aa] mb-2">
            <span className="text-xs uppercase font-medium">
              Plan Distribution
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20">
              {maxCodesCount} Max
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {proCodesCount} Pro
            </span>
          </div>
          <p className="text-[11px] text-[#71717a] mt-1.5">
            Across active voucher pools
          </p>
        </div>
      </div>

      {/* ── Promo Code Generator Card ── */}
      <div className="rounded-xl bg-[#18181b] border border-[#27272a] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#27272a]">
          <div>
            <h2 className="text-base font-semibold text-[#fafafa] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Generate New Promo Code
            </h2>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Create instant upgrade vouchers for Pro or Max plans with custom
              durations and usage limits.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoGenerate}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#27272a] text-[#fafafa] hover:bg-[#3f3f46] transition-colors flex items-center gap-1.5 border border-[#3f3f46]"
          >
            <RotateCw className="w-3.5 h-3.5 text-pink-400" />
            Auto Generate Code
          </button>
        </div>

        <form onSubmit={handleCreatePromo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Plan Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
                Target Plan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormPlan("max")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    formPlan === "max"
                      ? "bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-sm"
                      : "bg-[#09090b] border-[#27272a] text-[#71717a] hover:text-[#a1a1aa]"
                  }`}
                >
                  Max Plan
                </button>
                <button
                  type="button"
                  onClick={() => setFormPlan("pro")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    formPlan === "pro"
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-sm"
                      : "bg-[#09090b] border-[#27272a] text-[#71717a] hover:text-[#a1a1aa]"
                  }`}
                >
                  Pro Plan
                </button>
              </div>
            </div>

            {/* 2. Duration Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
                Duration (Months)
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setFormDuration(m);
                      setCustomDuration("");
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      formDuration === m && !customDuration
                        ? "bg-[#27272a] text-[#fafafa] border-pink-500/40"
                        : "bg-[#09090b] text-[#71717a] border-[#27272a] hover:text-[#fafafa]"
                    }`}
                  >
                    {m === 12 ? "1 Year" : `${m}M`}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="60"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="Or custom months (e.g. 5)"
                className="mt-2 w-full h-8 px-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] placeholder-[#52525b] outline-none focus:border-pink-500/50"
              />
            </div>

            {/* 3. Max Uses */}
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
                Redemption Limit (Max Users)
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "1 User", val: 1 },
                  { label: "5 Users", val: 5 },
                  { label: "10 Users", val: 10 },
                  { label: "Unlimited", val: -1 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setFormMaxUses(item.val);
                      setCustomMaxUses("");
                    }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      formMaxUses === item.val && !customMaxUses
                        ? "bg-[#27272a] text-[#fafafa] border-pink-500/40"
                        : "bg-[#09090b] text-[#71717a] border-[#27272a] hover:text-[#fafafa]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                value={customMaxUses}
                onChange={(e) => setCustomMaxUses(e.target.value)}
                placeholder="Or custom count (e.g. 50)"
                className="mt-2 w-full h-8 px-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] placeholder-[#52525b] outline-none focus:border-pink-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Promo Code string */}
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
                Promo Code
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="e.g. MAX-1M-SPECIAL (or leave blank to auto-generate)"
                className="w-full h-9 px-3 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono uppercase text-[#fafafa] placeholder-[#52525b] outline-none focus:border-pink-500/50"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] outline-none focus:border-pink-500/50 cursor-pointer"
              />
            </div>

            {/* Campaign Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2">
                Campaign / Notes
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. Twitter giveaway, partner promo"
                className="w-full h-9 px-3 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] placeholder-[#52525b] outline-none focus:border-pink-500/50"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white transition-all shadow-md shadow-pink-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Voucher...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Promo Code</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Promo Codes List & Search ── */}
      <div className="rounded-xl bg-[#18181b] border border-[#27272a] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#27272a]">
          <div>
            <h3 className="text-base font-semibold text-[#fafafa]">
              Active Promo Codes ({filteredPromos.length})
            </h3>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Manage vouchers, inspect usage, copy codes, and pause or revoke
              access.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717a]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or notes..."
                className="h-8 pl-8 pr-3 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] placeholder-[#52525b] outline-none focus:border-[#3f3f46]"
              />
            </div>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="h-8 px-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] outline-none cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="max">Max Only</option>
              <option value="pro">Pro Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-8 px-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#fafafa] outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Paused Only</option>
            </select>

            <button
              type="button"
              onClick={fetchPromos}
              className="p-2 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-[#fafafa] transition-colors"
              title="Refresh"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#a1a1aa] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
              <span>Loading promo codes...</span>
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#71717a]">
              No promo codes found matching your filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#27272a] text-[#71717a] font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Target Plan</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Redemptions</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Expires</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/50">
                {filteredPromos.map((p) => {
                  const isExpired =
                    p.expiresAt && new Date(p.expiresAt) < new Date();
                  const isMaxedOut =
                    p.maxUses > 0 && p.timesRedeemed >= p.maxUses;
                  const isCopied = copiedCode === p.code;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#27272a]/20 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#fafafa] bg-[#09090b] px-2 py-0.5 rounded border border-[#27272a] tracking-wide">
                            {p.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.code)}
                            className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                            title="Copy code"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {p.notes && (
                          <span className="text-[10px] text-[#71717a] block mt-0.5 truncate max-w-xs">
                            {p.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            p.plan === "max"
                              ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {p.plan === "max" ? "Max Plan" : "Pro Plan"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#fafafa] font-medium">
                        {p.durationMonths === 12
                          ? "1 Year"
                          : `${p.durationMonths} ${p.durationMonths === 1 ? "Month" : "Months"}`}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#a1a1aa]">
                            {p.timesRedeemed} /{" "}
                            {p.maxUses === -1 ? "∞" : p.maxUses}
                          </span>
                          {p.maxUses > 0 && (
                            <div className="w-16 h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                              <div
                                className={`h-full ${
                                  isMaxedOut ? "bg-amber-400" : "bg-pink-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (p.timesRedeemed / p.maxUses) * 100,
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isExpired
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : isMaxedOut
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : p.isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-[#27272a] text-[#71717a]"
                          }`}
                        >
                          {isExpired
                            ? "Expired"
                            : isMaxedOut
                              ? "Exhausted"
                              : p.isActive
                                ? "Active"
                                : "Paused"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#71717a] font-mono text-[11px]">
                        {p.expiresAt
                          ? new Date(p.expiresAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Never"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(p.id, p.isActive)}
                            className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                            title={
                              p.isActive ? "Pause voucher" : "Activate voucher"
                            }
                          >
                            {p.isActive ? (
                              <Pause className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePromo(p.id, p.code)}
                            className="p-1 rounded hover:bg-red-500/10 text-[#71717a] hover:text-red-400 transition-colors"
                            title="Delete voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Recent Redemptions Log ── */}
      {redemptions.length > 0 && (
        <div className="rounded-xl bg-[#18181b] border border-[#27272a] p-5 sm:p-6 shadow-sm">
          <div className="mb-4 pb-2 border-b border-[#27272a]">
            <h3 className="text-sm font-semibold text-[#fafafa] flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Recent Redemptions Log ({redemptions.length})
            </h3>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Live audit record of subscribers who unlocked perks via promo
              vouchers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#27272a] text-[#71717a] font-mono uppercase tracking-wider">
                  <th className="py-2 px-3">Subscriber</th>
                  <th className="py-2 px-3">Code Used</th>
                  <th className="py-2 px-3">Plan Granted</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Redeemed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/30">
                {redemptions.slice(0, 15).map((r) => (
                  <tr key={r.id} className="hover:bg-[#27272a]/20">
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-[#fafafa] block">
                        {r.userName || r.userEmail}
                      </span>
                      {r.userName && (
                        <span className="text-[10px] text-[#71717a] font-mono">
                          {r.userEmail}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-pink-400 font-bold bg-[#09090b] px-2 py-0.5 rounded border border-[#27272a]">
                        {r.promoCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.plan === "max"
                            ? "bg-pink-500/10 text-pink-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {r.plan}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#a1a1aa]">
                      {r.durationMonths}{" "}
                      {r.durationMonths === 1 ? "Month" : "Months"}
                    </td>
                    <td className="py-2.5 px-3 text-[#71717a] font-mono text-[11px]">
                      {new Date(r.redeemedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
