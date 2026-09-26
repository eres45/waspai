"use client";

import { AdminUserListItem } from "app-types/admin";
import { format } from "date-fns";
import { AdminDashboardStats } from "lib/admin/dashboard";
import { getUserAvatar } from "lib/user/utils";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  Edit3,
  Layers,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

export function AdminDashboard({
  stats,
  users,
  total,
  page,
  limit,
  query,
}: {
  stats: AdminDashboardStats;
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  query?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "models" | "security"
  >("overview");
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "12m">(
    "30d",
  );
  const [userFilter, setUserFilter] = useState<
    "all" | "pro" | "admin" | "banned"
  >("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [tableSearch, setTableSearch] = useState(query ?? "");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    router.refresh();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((item) => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (userFilter === "pro" && u.tier !== "pro") return false;
    if (userFilter === "admin" && u.role !== "admin") return false;
    if (userFilter === "banned" && !u.banned) return false;
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / limit);
  const maxSignupCount = Math.max(
    ...stats.monthlySignups.map((m) => m.count),
    1,
  );

  // Model fleet telemetry
  const modelFleet = [
    {
      name: "OpenAI GPT-5",
      provider: "OpenAI",
      latency: "190ms",
      status: "Operational",
      load: "78%",
    },
    {
      name: "Claude 3.7 Sonnet",
      provider: "Anthropic",
      latency: "210ms",
      status: "Operational",
      load: "64%",
    },
    {
      name: "Gemini 2.0 Flash",
      provider: "Google",
      latency: "120ms",
      status: "Operational",
      load: "42%",
    },
    {
      name: "DeepSeek R1",
      provider: "DeepSeek",
      latency: "340ms",
      status: "Operational",
      load: "88%",
    },
    {
      name: "Grok 3 Reasoning",
      provider: "xAI",
      latency: "250ms",
      status: "Operational",
      load: "56%",
    },
    {
      name: "Flux.1 Pro Image",
      provider: "Black Forest",
      latency: "1.2s",
      status: "Operational",
      load: "35%",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#161618] text-[#e3e5ec] font-sans antialiased relative overflow-x-hidden selection:bg-violet-600/30">
      {/* Background radial atmosphere inspired by landing page */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[560px] bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(139,92,246,0.15),transparent_75%)]" />
      <div className="pointer-events-none absolute top-40 -left-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-80 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Main Container */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        {/* ============================================================ */}
        {/* 1. FLOATING SPOTLIGHT COMMAND BAR                            */}
        {/* ============================================================ */}
        <header className="w-full rounded-2xl bg-[#1d1e23]/80 border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_1px_rgba(255,255,255,0.06)] px-4 lg:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 group-hover:ring-violet-500/50 transition-all">
                <Image
                  src="/wasp-ai-logo.png"
                  alt="Wasp AI"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-extrabold text-[18px] text-white tracking-tight">
                Wasp AI
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              US-EAST · 99.98% Uptime
            </span>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#161618] border border-white/[0.06] p-1 rounded-xl shadow-inner">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "users", label: "User Directory", icon: Users },
              { id: "models", label: "Model Fleet", icon: Cpu },
              { id: "security", label: "Security & Audit", icon: Shield },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                  activeTab === id
                    ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.08]"
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${activeTab === id ? "text-violet-400" : ""}`}
                />
                {label}
              </button>
            ))}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            {/* Live Search Trigger */}
            <div className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Search telemetry & users…"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-56 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 pl-8 pr-10 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
              />
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded-md">
                ⌘K
              </span>
            </div>

            {/* Refresh telemetry */}
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh Telemetry"
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-violet-400" : ""}`}
              />
            </button>

            {/* Admin Profile Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-[12px] font-extrabold text-white shadow-md">
                R
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-[12px] font-bold text-white leading-tight">
                  Ronit
                </span>
                <span className="text-[10px] text-violet-400 font-semibold">
                  Master Admin
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ============================================================ */}
        {/* 2. HERO HEADLINE & LIVE MODEL FLEET TICKER                   */}
        {/* ============================================================ */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1 text-[12px] font-medium text-white/70 backdrop-blur-md mb-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Next-Gen Multi-Model Control Plane
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.08]">
                <span className="bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                  Command Center &amp; Intelligence Hub
                </span>
              </h1>
              <p className="text-white/40 text-[14px] md:text-[15px] mt-1.5 max-w-2xl font-normal">
                Real-time monitoring of user velocity, multi-model token
                throughput, subscription conversions, and cluster health.
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-[#1a1b20] border border-white/[0.08] p-1 rounded-xl self-start md:self-end">
              {(["24h", "7d", "30d", "12m"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase transition-all ${
                    timeframe === tf
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Model Status Ticker Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {modelFleet.map((m) => (
              <div
                key={m.name}
                className="rounded-xl bg-[#1a1b20]/80 border border-white/[0.07] p-3 flex flex-col justify-between backdrop-blur-md hover:border-white/[0.15] transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider">
                    {m.provider}
                  </span>
                  <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                </div>
                <p className="text-[13px] font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                  {m.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-white/40 mt-2 pt-2 border-t border-white/[0.04]">
                  <span>{m.latency}</span>
                  <span className="font-mono text-violet-400 font-semibold">
                    {m.load} load
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. MASTER TELEMETRY BENTO GRID (Real DB Data)                */}
        {/* ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {/* BENTO 1: User Base & Conversion Economics (Col 4) */}
          <div className="lg:col-span-4 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/40 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                  User Velocity &amp; Tiers
                </span>
                <span className="text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +18.4%
                </span>
              </div>

              {/* Big Stat */}
              <div className="mt-4">
                <span className="text-[44px] font-black text-white tracking-tight leading-none">
                  {stats.totalUsers.toLocaleString()}
                </span>
                <p className="text-[12px] text-white/40 mt-1">
                  Total registered intelligence accounts (
                  {stats.newUsersThisMonth} new this month)
                </p>
              </div>

              {/* Multi-tier segmented progress */}
              <div className="mt-6 space-y-2.5">
                <div className="w-full h-3 rounded-full bg-white/[0.05] p-[2px] flex gap-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                    style={{
                      width: `${Math.max(12, Math.min(85, (stats.proUsers / Math.max(1, stats.totalUsers)) * 100))}%`,
                    }}
                  />
                  <div className="h-full rounded-full bg-amber-400/80 flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[11px] text-white/40 font-medium">
                      Pro Subscribers
                    </p>
                    <p className="text-[18px] font-bold text-white mt-0.5">
                      {stats.proUsers}
                    </p>
                    <span className="text-[10px] text-violet-400 font-semibold">
                      $10/mo recurring
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[11px] text-white/40 font-medium">
                      Free Accounts
                    </p>
                    <p className="text-[18px] font-bold text-white mt-0.5">
                      {stats.freeUsers}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Active Free Tier
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/[0.05] flex items-center justify-between text-[12px] text-white/40">
              <span>Conversion Index</span>
              <span className="font-bold text-white">
                {(
                  (stats.proUsers / Math.max(1, stats.totalUsers)) *
                  100
                ).toFixed(1)}
                % Paid Rate
              </span>
            </div>
          </div>

          {/* BENTO 2: 12-Month Throughput & Activity Timeline (Col 5) */}
          <div className="lg:col-span-5 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/40 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                  Throughput &amp; Growth Matrix
                </span>
                <span className="text-[11px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/25 px-2.5 py-0.5 rounded-full">
                  Peak: {stats.peakHours}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-3">
                <div>
                  <span className="text-[32px] font-black text-white tracking-tight">
                    {stats.totalMessages.toLocaleString()}
                  </span>
                  <span className="text-[13px] text-white/40 ml-2">
                    Total AI Generations
                  </span>
                </div>
                <span className="text-[12px] font-semibold text-white/60">
                  {stats.totalChats.toLocaleString()} Sessions
                </span>
              </div>

              {/* 12-Month Dynamic Bar Visualization */}
              <div className="flex items-end justify-between gap-2 h-44 mt-6 pt-4 px-1">
                {stats.monthlySignups.map((m) => {
                  const barPct = Math.max(14, (m.count / maxSignupCount) * 100);
                  return (
                    <div
                      key={m.month}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-full h-32 flex items-end justify-center relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#272935] border border-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xl whitespace-nowrap z-20 pointer-events-none">
                          {m.count} signups
                        </div>
                        {/* Bar Track */}
                        <div className="w-full max-w-[24px] h-full rounded-xl bg-white/[0.03] flex items-end overflow-hidden p-[2px]">
                          <div
                            className={`w-full rounded-lg transition-all duration-500 ${
                              m.isCurrent
                                ? "bg-gradient-to-t from-violet-600 via-indigo-500 to-cyan-300 shadow-[0_0_12px_rgba(139,92,246,0.8)]"
                                : "bg-violet-600/35 group-hover:bg-violet-600/70"
                            }`}
                            style={{ height: `${barPct}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-medium ${m.isCurrent ? "text-white font-bold" : "text-white/35"}`}
                      >
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-white/40">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                Verified Registration &amp; Activity Volume
              </span>
              <span>12 Months Telemetry</span>
            </div>
          </div>

          {/* BENTO 3: Workload & Security Telemetry (Col 3) */}
          <div className="lg:col-span-3 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/40 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-violet-400" />
                  Engine Workload
                </span>
                <span className="text-[11px] font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-full">
                  ⭐ {stats.rating.toFixed(1)}/5
                </span>
              </div>

              <div className="mt-4">
                <span className="text-[38px] font-black text-white tracking-tight leading-none">
                  {stats.workload.totalHours} hrs
                </span>
                <p className="text-[12px] text-white/40 mt-1">
                  Active GPU inference computation
                </p>
              </div>

              {/* Categorized Workload Breakdown */}
              <div className="space-y-3 mt-6">
                <div>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-white/70 flex items-center gap-1.5 font-medium">
                      <Bot className="w-3.5 h-3.5 text-violet-400" />
                      Model Chat &amp; Code
                    </span>
                    <span className="font-bold text-white">
                      {stats.workload.chatReception} hrs
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: "65%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-white/70 flex items-center gap-1.5 font-medium">
                      <Brain className="w-3.5 h-3.5 text-indigo-400" />
                      Document &amp; PDF AI
                    </span>
                    <span className="font-bold text-white">
                      {stats.workload.documentProcessing} hrs
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: "25%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-white/70 flex items-center gap-1.5 font-medium">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      MCP &amp; Tools
                    </span>
                    <span className="font-bold text-white">
                      {stats.workload.onlineConsultations} hrs
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: "10%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-white/40">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {stats.adminUsers} Admins · {stats.bannedUsers} Banned
              </span>
              <span className="text-white/60">HMAC-SHA256</span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. BESPOKE USER DIRECTORY & MANAGEMENT SUITE                 */}
        {/* ============================================================ */}
        <section className="rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl">
          {/* Header Controls: Title + Tab Filters + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/[0.06]">
            <div>
              <h3 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
                User Directory &amp; Access Controls
              </h3>
              <p className="text-[12px] text-white/40 mt-0.5">
                Direct management of account authorizations, subscription tiers,
                and system access
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Tab Pills */}
              <div className="flex items-center gap-1 bg-[#15161c] border border-white/[0.08] p-1 rounded-xl">
                {[
                  { id: "all", label: `All (${total})` },
                  { id: "pro", label: `Pro (${stats.proUsers})` },
                  { id: "admin", label: `Admins (${stats.adminUsers})` },
                  { id: "banned", label: `Banned (${stats.bannedUsers})` },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setUserFilter(id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      userFilter === id
                        ? "bg-white/[0.1] text-white shadow-sm"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Table search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter users…"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-52 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 pl-8 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05] text-[11px] uppercase tracking-wider text-white/35 font-semibold">
                  <th className="pb-3 pl-2 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedUserIds.length === users.length &&
                        users.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-white/20 bg-white/5 accent-violet-600 cursor-pointer"
                    />
                  </th>
                  <th className="pb-3 px-4">User Account</th>
                  <th className="pb-3 px-4">Email</th>
                  <th className="pb-3 px-4">Role</th>
                  <th className="pb-3 px-4">Subscription Tier</th>
                  <th className="pb-3 px-4">Registration</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredUsers.map((u) => {
                  const createdDate = u.createdAt
                    ? new Date(u.createdAt)
                    : new Date();
                  const isSelected = selectedUserIds.includes(u.id);

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors group ${
                        isSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(u.id)}
                          className="rounded border-white/20 bg-white/5 accent-violet-600 cursor-pointer"
                        />
                      </td>

                      {/* User Account / Avatar */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="flex items-center gap-3 group/link"
                        >
                          <Avatar className="w-9 h-9 rounded-xl border border-white/[0.08] shadow-sm">
                            <AvatarImage src={getUserAvatar(u) ?? ""} />
                            <AvatarFallback className="bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 text-white font-bold text-[11px] rounded-xl">
                              {u.name?.slice(0, 2).toUpperCase() || "WA"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[13px] font-bold text-white group-hover/link:text-violet-300 transition-colors">
                              {u.name || "Anonymous User"}
                            </p>
                            <p className="text-[11px] text-white/35 font-mono">
                              ID: {u.id.slice(0, 8)}…
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-[13px] text-white/60 font-mono">
                        {u.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                            <ShieldCheck className="w-3 h-3 text-violet-400" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] text-white/60 border border-white/[0.08]">
                            Member
                          </span>
                        )}
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-4">
                        {u.tier === "pro" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                            <Zap className="w-3 h-3 text-amber-400" />
                            Pro Tier
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] text-white/50 border border-white/[0.08]">
                            Free Tier
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-4 text-[12px] text-white/50 font-mono">
                        {format(createdDate, "MMM d, yyyy")}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.banned ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-2 text-white/30">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="p-1.5 rounded-lg hover:text-white hover:bg-white/[0.06] transition-colors"
                            title="Inspect User Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-5 mt-3 border-t border-white/[0.05]">
              <span className="text-[12px] text-white/35 font-mono">
                Showing page {page} of {totalPages} ({total} accounts)
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin?page=${page - 1}${query ? `&query=${query}` : ""}`}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin?page=${page + 1}${query ? `&query=${query}` : ""}`}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
