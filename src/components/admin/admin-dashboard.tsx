"use client";

import { AdminUserListItem } from "app-types/admin";
import { format } from "date-fns";
import { AdminDashboardStats } from "lib/admin/dashboard";
import { getUserAvatar } from "lib/user/utils";
import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  Film,
  Globe,
  HardDrive,
  Layers,
  LogOut,
  Music,
  Radio,
  RefreshCw,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Video,
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
    "overview" | "users" | "models" | "security" | "ecosystem"
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
      u.role?.toLowerCase().includes(q) ||
      ((u as any).lastSignInIp &&
        String((u as any).lastSignInIp)
          .toLowerCase()
          .includes(q))
    );
  });

  const totalPages = Math.ceil(total / limit);
  const maxSignupCount = Math.max(
    ...stats.monthlySignups.map((m) => m.count),
    1,
  );

  return (
    <div className="min-h-screen w-full bg-[#0e0e11] text-white selection:bg-violet-500 selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* Dynamic Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[25%] -left-[10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-violet-600/10 via-purple-800/5 to-transparent blur-[140px]" />
        <div className="absolute top-[35%] -right-[15%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-indigo-600/10 via-cyan-800/5 to-transparent blur-[140px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[45%] h-[45%] rounded-full bg-gradient-to-t from-violet-900/10 to-transparent blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto gap-7">
        {/* ============================================================ */}
        {/* 1. FLOATING SPOTLIGHT COMMAND DECK (Edge-to-Edge Header)    */}
        {/* ============================================================ */}
        <header className="w-full rounded-2xl bg-[#16161a]/85 backdrop-blur-2xl border border-white/[0.08] px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_1px_rgba(255,255,255,0.06)]">
          {/* Brand & System Node Status */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 group transition-transform hover:scale-105"
            >
              <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 p-[1.5px] shadow-[0_0_18px_rgba(139,92,246,0.35)]">
                <div className="w-full h-full bg-[#16161a] rounded-[10px] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/wasp-ai-logo.png"
                    alt="Wasp AI"
                    width={32}
                    height={32}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                    WASP AI
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300">
                    Command Center
                  </span>
                </div>
                <span className="text-[11px] text-white/40 font-medium">
                  Autonomous Multi-Agent Admin Deck
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            {/* Live Cluster Heartbeat */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-400">
                US-EAST · 99.98% SLA
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              {
                id: "users",
                label: `Users (${stats.totalUsers})`,
                icon: Users,
              },
              { id: "models", label: "Model Fleet", icon: Cpu },
              {
                id: "security",
                label: `Security & Errors (${stats.systemHealth.totalErrors24h})`,
                icon: ShieldAlert,
              },
              { id: "ecosystem", label: "Ecosystem & Queues", icon: Database },
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
        {/* 2. HERO HEADLINE & TOP CONTROLS                              */}
        {/* ============================================================ */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1 text-[12px] font-medium text-white/70 backdrop-blur-md mb-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Live PostgreSQL Telemetry Plane
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.08]">
                <span className="bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                  Wasp AI Operating Hub
                </span>
              </h1>
              <p className="text-white/40 text-[14px] md:text-[15px] mt-1 max-w-2xl font-normal">
                Direct visibility into active users, multi-model token
                throughput, generation queues, and system error streams.
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-[#1a1b20] border border-white/[0.08] p-1 rounded-xl self-start md:self-end">
              {(["24h", "7d", "30d", "12m"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all ${
                    timeframe === tf
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Model fleet quick ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.modelFleet.slice(0, 6).map((m) => (
              <div
                key={m.modelId}
                className="rounded-2xl bg-[#16161a]/90 border border-white/[0.06] p-3 flex flex-col justify-between hover:border-white/[0.15] transition-all group backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    {m.provider}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {m.status}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[13px] font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                    {m.name}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-white/50">
                  <span>{m.latency}ms</span>
                  <span className="font-mono text-violet-400 font-semibold">
                    Inference
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* TAB 1: OVERVIEW & MASTER TELEMETRY BENTO                     */}
        {/* ============================================================ */}
        {activeTab === "overview" && (
          <section className="space-y-6">
            {/* Top Stat Row: Key Performance Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1 */}
              <div className="rounded-2xl bg-[#1a1b20]/90 border border-white/[0.08] p-5 shadow-lg backdrop-blur-2xl">
                <div className="flex items-center justify-between text-[12px] font-bold text-white/40 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-400" />
                    Total Users
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[11px]">
                    +{stats.newUsersThisMonth} MoM
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {stats.totalUsers.toLocaleString()}
                  </span>
                  <span className="text-xs text-white/50">
                    {stats.verifiedUsers} verified
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-white/40">
                  <span>{stats.proUsers} Pro Subscriptions</span>
                  <span className="text-violet-400 font-semibold">
                    {(
                      (stats.proUsers / Math.max(1, stats.totalUsers)) *
                      100
                    ).toFixed(1)}
                    % Paid
                  </span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="rounded-2xl bg-[#1a1b20]/90 border border-white/[0.08] p-5 shadow-lg backdrop-blur-2xl">
                <div className="flex items-center justify-between text-[12px] font-bold text-white/40 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    AI Generations
                  </span>
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[11px]">
                    {stats.messagesToday} Today
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {stats.totalMessages.toLocaleString()}
                  </span>
                  <span className="text-xs text-white/50">
                    {stats.totalChats} Threads
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-white/40">
                  <span>Peak Window</span>
                  <span className="text-amber-400 font-semibold">
                    {stats.peakHours}
                  </span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="rounded-2xl bg-[#1a1b20]/90 border border-white/[0.08] p-5 shadow-lg backdrop-blur-2xl">
                <div className="flex items-center justify-between text-[12px] font-bold text-white/40 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    Active Live Sessions
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    ● LIVE
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {stats.activeSessions.toLocaleString()}
                  </span>
                  <span className="text-xs text-white/50">Online Now</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-white/40">
                  <span>Referral Signups</span>
                  <span className="text-emerald-400 font-semibold">
                    {stats.totalReferrals} referrals
                  </span>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="rounded-2xl bg-[#1a1b20]/90 border border-white/[0.08] p-5 shadow-lg backdrop-blur-2xl">
                <div className="flex items-center justify-between text-[12px] font-bold text-white/40 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    System Reliability
                  </span>
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 text-[11px]">
                    99.98%
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">
                    {stats.systemHealth.totalErrors24h === 0
                      ? "Healthy"
                      : `${stats.systemHealth.totalErrors24h} errs`}
                  </span>
                  <span className="text-xs text-white/50">Last 24h</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-white/40">
                  <span>Admins: {stats.adminUsers}</span>
                  <span className="text-rose-400 font-semibold">
                    {stats.bannedUsers} Banned
                  </span>
                </div>
              </div>
            </div>

            {/* Master Bento Grid (Real DB Data) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
              {/* BENTO 1: Daily Feature Usage Breakdown (Col 4) */}
              <div className="lg:col-span-4 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/40 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-violet-400" />
                      Daily Feature Workload
                    </span>
                    <span className="text-[11px] font-bold bg-violet-500/10 border border-violet-500/25 text-violet-400 px-2.5 py-0.5 rounded-full">
                      Last 24h
                    </span>
                  </div>

                  <div className="mt-4">
                    <span className="text-[40px] font-black text-white tracking-tight leading-none">
                      {(
                        stats.dailyUsage.chatMessage +
                        stats.dailyUsage.webSearch +
                        stats.dailyUsage.imageGen
                      ).toLocaleString()}
                    </span>
                    <p className="text-[12px] text-white/40 mt-1">
                      Total AI feature actions performed today
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="text-white/80 font-medium flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-violet-400" />
                          Chat &amp; Reasoning Messages
                        </span>
                        <span className="font-bold text-white">
                          {stats.dailyUsage.chatMessage.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                15,
                                (stats.dailyUsage.chatMessage /
                                  Math.max(
                                    1,
                                    stats.dailyUsage.chatMessage +
                                      stats.dailyUsage.webSearch +
                                      stats.dailyUsage.imageGen,
                                  )) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="text-white/80 font-medium flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          Live Web Searches &amp; Grounding
                        </span>
                        <span className="font-bold text-white">
                          {stats.dailyUsage.webSearch.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                10,
                                (stats.dailyUsage.webSearch /
                                  Math.max(
                                    1,
                                    stats.dailyUsage.chatMessage +
                                      stats.dailyUsage.webSearch +
                                      stats.dailyUsage.imageGen,
                                  )) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="text-white/80 font-medium flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Image Generations (Flux.1)
                        </span>
                        <span className="font-bold text-white">
                          {stats.dailyUsage.imageGen.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                8,
                                (stats.dailyUsage.imageGen /
                                  Math.max(
                                    1,
                                    stats.dailyUsage.chatMessage +
                                      stats.dailyUsage.webSearch +
                                      stats.dailyUsage.imageGen,
                                  )) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.05] flex items-center justify-between text-[12px] text-white/40">
                  <span>Engine Efficiency</span>
                  <span className="font-bold text-emerald-400">
                    Optimal Latency
                  </span>
                </div>
              </div>

              {/* BENTO 2: 12-Month Throughput & Signups (Col 5) */}
              <div className="lg:col-span-5 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/40 flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                      12-Month Signups &amp; Velocity
                    </span>
                    <span className="text-[11px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/25 px-2.5 py-0.5 rounded-full">
                      Peak: {stats.peakHours}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-3">
                    <div>
                      <span className="text-[32px] font-black text-white tracking-tight">
                        {stats.totalUsers.toLocaleString()}
                      </span>
                      <span className="text-[13px] text-white/40 ml-2">
                        Total Registered Accounts
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold text-white/60">
                      {stats.totalMessages.toLocaleString()} Generations
                    </span>
                  </div>

                  {/* 12-Month Dynamic Bar Visualization */}
                  <div className="flex items-end justify-between gap-2 h-44 mt-6 pt-4 px-1">
                    {stats.monthlySignups.map((m) => {
                      const barPct = Math.max(
                        14,
                        (m.count / maxSignupCount) * 100,
                      );
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
                    PostgreSQL Monthly Growth Trend
                  </span>
                  <span>12 Months History</span>
                </div>
              </div>

              {/* BENTO 3: Media Pipeline & Storage (Col 3) */}
              <div className="lg:col-span-3 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/40 flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-violet-400" />
                      Media &amp; Queues
                    </span>
                    <span className="text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="mt-4">
                    <span className="text-[34px] font-black text-white tracking-tight leading-none">
                      {stats.mediaPipeline.totalVideos +
                        stats.mediaPipeline.totalMusic +
                        stats.mediaPipeline.totalFiles}
                    </span>
                    <p className="text-[12px] text-white/40 mt-1">
                      Total media generation artifacts
                    </p>
                  </div>

                  {/* Media items */}
                  <div className="space-y-3 mt-5">
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Video className="w-4 h-4 text-violet-400" />
                        <div>
                          <p className="text-[12px] font-bold text-white">
                            Video Gen Queue
                          </p>
                          <p className="text-[10px] text-white/40">
                            {stats.mediaPipeline.videoCompleted} completed ·{" "}
                            {stats.mediaPipeline.videoPending} queued
                          </p>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-white">
                        {stats.mediaPipeline.totalVideos}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Music className="w-4 h-4 text-indigo-400" />
                        <div>
                          <p className="text-[12px] font-bold text-white">
                            Music Generations
                          </p>
                          <p className="text-[10px] text-white/40">
                            {stats.mediaPipeline.musicStorageMb} MB bandwidth
                          </p>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-white">
                        {stats.mediaPipeline.totalMusic}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HardDrive className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-[12px] font-bold text-white">
                            File &amp; Document AI
                          </p>
                          <p className="text-[10px] text-white/40">
                            {stats.mediaPipeline.filesStorageMb} MB storage
                          </p>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-white">
                        {stats.mediaPipeline.totalFiles}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-white/40">
                  <span>Artifact Storage</span>
                  <span className="text-white/70 font-semibold">
                    PostgreSQL
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Ecosystem Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-[#16161a]/80 border border-white/[0.06] flex items-center gap-3">
                <Globe className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-[11px] text-white/40">Deployed Sites</p>
                  <p className="text-lg font-black text-white">
                    {stats.ecosystem.deployedSites}
                  </p>
                  <p className="text-[10px] text-white/50">
                    {stats.ecosystem.siteViews} total views
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#16161a]/80 border border-white/[0.06] flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-violet-400" />
                <div>
                  <p className="text-[11px] text-white/40">Skill Marketplace</p>
                  <p className="text-lg font-black text-white">
                    {stats.ecosystem.totalSkills}
                  </p>
                  <p className="text-[10px] text-white/50">
                    {stats.ecosystem.skillInstalls} installs
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#16161a]/80 border border-white/[0.06] flex items-center gap-3">
                <Terminal className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-[11px] text-white/40">MCP Servers</p>
                  <p className="text-lg font-black text-white">
                    {stats.ecosystem.mcpServers}
                  </p>
                  <p className="text-[10px] text-white/50">Configured tools</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#16161a]/80 border border-white/[0.06] flex items-center gap-3">
                <Bot className="w-6 h-6 text-indigo-400" />
                <div>
                  <p className="text-[11px] text-white/40">Custom Agents</p>
                  <p className="text-lg font-black text-white">
                    {stats.ecosystem.customAgents}
                  </p>
                  <p className="text-[10px] text-white/50">Created by users</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#16161a]/80 border border-white/[0.06] flex items-center gap-3">
                <Share2 className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-[11px] text-white/40">AI Workflows</p>
                  <p className="text-lg font-black text-white">
                    {stats.ecosystem.workflows}
                  </p>
                  <p className="text-[10px] text-white/50">Automation graphs</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 2: USER DIRECTORY & ACCESS CONTROL SUITE                 */}
        {/* ============================================================ */}
        {(activeTab === "users" || activeTab === "overview") && (
          <section className="rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
            {/* Header Controls: Title + Tab Filters + Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  User Directory &amp; Security Controls
                </h3>
                <p className="text-[12px] text-white/40 mt-0.5">
                  Direct management of account authorizations, subscription
                  tiers, verification status, and network origins
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Tab Pills */}
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
                  {[
                    { id: "all", label: "All Users" },
                    { id: "pro", label: `Pro (${stats.proUsers})` },
                    { id: "admin", label: `Admins (${stats.adminUsers})` },
                    { id: "banned", label: `Banned (${stats.bannedUsers})` },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setUserFilter(id as any)}
                      className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all ${
                        userFilter === id
                          ? "bg-white/[0.1] text-white shadow-sm"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by name, email, IP…"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-56 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] px-2.5 pl-8 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-violet-500/50"
                  />
                  <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* User Directory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/40 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          selectedUserIds.length === users.length &&
                          users.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-white/20 bg-white/5 accent-violet-600"
                      />
                    </th>
                    <th className="py-3 px-3">Identity &amp; Account</th>
                    <th className="py-3 px-3">Role &amp; Plan</th>
                    <th className="py-3 px-3">Security &amp; IP Origin</th>
                    <th className="py-3 px-3">Referrals</th>
                    <th className="py-3 px-3">Registered</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-white/40"
                      >
                        No users found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      const isVerified = (u as any).emailVerified;
                      const lastIp = (u as any).lastSignInIp;
                      const refCount = (u as any).referralCount ?? 0;

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-white/[0.02] transition-colors group ${
                            isSelected ? "bg-violet-500/5" : ""
                          }`}
                        >
                          <td className="py-3.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(u.id)}
                              className="rounded border-white/20 bg-white/5 accent-violet-600"
                            />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 border border-white/10">
                                <AvatarImage
                                  src={getUserAvatar(u)}
                                  alt={u.name || "User"}
                                />
                                <AvatarFallback className="bg-violet-900/50 text-white font-bold text-xs">
                                  {(u.name || u.email || "U")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-white">
                                  <span>{u.name || "Anonymous User"}</span>
                                  {isVerified && (
                                    <span
                                      title="Verified Email"
                                      className="inline-flex text-emerald-400"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-white/40 block font-mono">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  u.tier === "pro"
                                    ? "bg-violet-500/15 border border-violet-500/30 text-violet-300"
                                    : "bg-white/[0.04] border border-white/[0.08] text-white/60"
                                }`}
                              >
                                {u.tier === "pro" ? "⭐ Pro $10/mo" : "Free"}
                              </span>
                              {u.role === "admin" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/25 text-amber-300">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col text-[11px]">
                              {u.banned ? (
                                <span className="text-rose-400 font-bold flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  Suspended ({u.banReason || "Policy Violation"}
                                  )
                                </span>
                              ) : (
                                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                                  <ShieldCheck className="w-3 h-3" />
                                  Active &amp; Authorized
                                </span>
                              )}
                              <span className="text-white/40 font-mono mt-0.5">
                                IP: {lastIp || "Direct / Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-white/80 font-semibold">
                              {refCount} users
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-white/50 text-[12px] whitespace-nowrap">
                            {u.createdAt
                              ? format(new Date(u.createdAt), "MMM d, yyyy")
                              : "N/A"}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/admin/users?query=${encodeURIComponent(u.email || "")}`}
                                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-[11px] font-semibold border border-white/[0.08] transition-all"
                              >
                                Inspect
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[12px] text-white/40">
              <span>
                Showing {filteredUsers.length} of {total.toLocaleString()} users
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin?page=${Math.max(1, page - 1)}&limit=${limit}${query ? `&query=${query}` : ""}`}
                  className={`px-3 py-1 rounded-lg border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.04] transition-all ${
                    page <= 1 ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Previous
                </Link>
                <span className="text-white font-mono">
                  {page} / {Math.max(1, totalPages)}
                </span>
                <Link
                  href={`/admin?page=${page + 1}&limit=${limit}${query ? `&query=${query}` : ""}`}
                  className={`px-3 py-1 rounded-lg border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.04] transition-all ${
                    page >= totalPages ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 3: LIVE MODEL FLEET & PROVIDER TELEMETRY                */}
        {/* ============================================================ */}
        {activeTab === "models" && (
          <section className="space-y-6">
            <div className="rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 shadow-lg backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-violet-400" />
                    Live Model Fleet &amp; Latency Probes
                  </h3>
                  <p className="text-[12px] text-white/40 mt-0.5">
                    Real-time status probes from PostgreSQL ModelStatusTable
                    across all integrated AI engines
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                  ● All Systems Nominal
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {stats.modelFleet.map((m) => (
                  <div
                    key={m.modelId}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-violet-400 uppercase">
                          {m.provider}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            m.status === "operational"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white mt-2">
                        {m.name}
                      </h4>
                      <p className="text-xs text-white/40 font-mono mt-0.5">
                        ID: {m.modelId}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/50">Probe Latency</span>
                        <span className="font-mono font-bold text-white">
                          {m.latency}ms
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, (m.latency / 1000) * 100))}%`,
                          }}
                        />
                      </div>
                      {m.testedAt && (
                        <p className="text-[10px] text-white/30 text-right">
                          Tested: {format(new Date(m.testedAt), "HH:mm:ss")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 4: SYSTEM HEALTH & LIVE ERROR LOG STREAM                 */}
        {/* ============================================================ */}
        {activeTab === "security" && (
          <section className="space-y-6">
            <div className="rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] p-6 shadow-lg backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-[20px] font-bold text-white tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    System Reliability &amp; Exception Stream
                  </h3>
                  <p className="text-[12px] text-white/40 mt-0.5">
                    Live telemetry stream from SystemErrorTable tracking server
                    crashes, 500s, and API route exceptions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 font-bold">
                    {stats.systemHealth.totalErrors24h} Errors (Last 24h)
                  </span>
                </div>
              </div>

              {stats.systemHealth.recentErrors.length === 0 ? (
                <div className="py-16 text-center text-white/40 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <p className="text-base font-bold text-white">
                    Zero System Exceptions Detected
                  </p>
                  <p className="text-xs text-white/40">
                    All API routes, database queries, and AI streaming models
                    are executing cleanly.
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-white/40 uppercase font-mono text-[11px]">
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Exception Type</th>
                        <th className="py-2.5 px-3">Path &amp; Endpoint</th>
                        <th className="py-2.5 px-3">Message</th>
                        <th className="py-2.5 px-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {stats.systemHealth.recentErrors.map((err) => (
                        <tr
                          key={err.id}
                          className="hover:bg-white/[0.02] font-mono"
                        >
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                              {err.statusCode || 500}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            {err.errorName}
                          </td>
                          <td className="py-3 px-3 text-cyan-300">
                            {err.path || "/api/chat"}
                          </td>
                          <td className="py-3 px-3 text-white/70 max-w-md truncate">
                            {err.errorMessage}
                          </td>
                          <td className="py-3 px-3 text-right text-white/40">
                            {format(
                              new Date(err.createdAt),
                              "HH:mm:ss · MMM d",
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 5: ECOSYSTEM & QUEUES PIPELINE                           */}
        {/* ============================================================ */}
        {activeTab === "ecosystem" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1 */}
              <div className="p-6 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] shadow-lg backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">
                      Video Generation Queue
                    </h4>
                    <p className="text-xs text-white/40">
                      Asynchronous video render serialization
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                    <span className="text-white/60">Completed Renders</span>
                    <span className="font-bold text-emerald-400">
                      {stats.mediaPipeline.videoCompleted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                    <span className="text-white/60">Currently Processing</span>
                    <span className="font-bold text-amber-400">
                      {stats.mediaPipeline.videoProcessing}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                    <span className="text-white/60">Pending in Queue</span>
                    <span className="font-bold text-cyan-400">
                      {stats.mediaPipeline.videoPending}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2">
                    <span className="text-white/60">Failed Jobs</span>
                    <span className="font-bold text-rose-400">
                      {stats.mediaPipeline.videoFailed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] shadow-lg backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">
                      Live Deployed Sites
                    </h4>
                    <p className="text-xs text-white/40">
                      Interactive HTML artifacts hosted on Wasp
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                    <span className="text-white/60">Total Active Sites</span>
                    <span className="font-bold text-white">
                      {stats.ecosystem.deployedSites}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                    <span className="text-white/60">Total View Traffic</span>
                    <span className="font-bold text-cyan-400">
                      {stats.ecosystem.siteViews} views
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2">
                    <span className="text-white/60">Hosting Status</span>
                    <span className="font-bold text-emerald-400">
                      Active Edge Delivery
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-3xl bg-[#1a1b20]/90 border border-white/[0.08] shadow-lg backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">
                      Developer Marketplace
                    </h4>
                    <p className="text-xs text-white/40">
                      Extensions, MCP tools &amp; custom skills
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                    <span className="text-white/60">Custom Skills</span>
                    <span className="font-bold text-white">
                      {stats.ecosystem.totalSkills}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                    <span className="text-white/60">Skill Installs</span>
                    <span className="font-bold text-violet-400">
                      {stats.ecosystem.skillInstalls}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-white/[0.04]">
                    <span className="text-white/60">Connected MCP Servers</span>
                    <span className="font-bold text-white">
                      {stats.ecosystem.mcpServers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2">
                    <span className="text-white/60">Custom AI Agents</span>
                    <span className="font-bold text-white">
                      {stats.ecosystem.customAgents}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
