"use client";

import { AdminUserListItem } from "app-types/admin";
import { format } from "date-fns";
import { AdminDashboardStats } from "lib/admin/dashboard";
import { getUserAvatar } from "lib/user/utils";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  DollarSign,
  Download,
  FileText,
  Filter,
  LayoutGrid,
  LogOut,
  MessageSquare,
  PanelLeft,
  PieChart,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Sparkles,
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

  // Navigation state
  const [activeNav, setActiveNav] = useState<
    | "overview"
    | "funnels"
    | "retention"
    | "revenue"
    | "users"
    | "events"
    | "models"
    | "reports"
    | "insights"
  >("overview");

  const [timeRange, setTimeRange] = useState("Last 7 days");
  const [userSegment, setUserSegment] = useState<
    "all" | "new" | "returning" | "power"
  >("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(true);
  const [pinnedOpen, setPinnedOpen] = useState(true);

  // Table & search state for Users sub-view
  const [userFilter, setUserFilter] = useState<
    "all" | "pro" | "admin" | "banned"
  >("all");
  const [tableSearch, setTableSearch] = useState(query ?? "");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const handleLogout = async () => {
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    router.refresh();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 700);
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

  // Filtered users for Users directory tab
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

  // Discrete Block Heatmap Matrix Data (Exact pattern matching reference image)
  // 8 day columns: Sun, Mon, Tue, Wed, Thu, Fri, Sat, Sun
  // Each day has ghost blocks (last week) and orange blocks (this week)
  const heatmapDays = [
    { day: "Sun", thisWeekBlocks: 9, lastWeekBlocks: 11, count: "17,240" },
    { day: "Mon", thisWeekBlocks: 7, lastWeekBlocks: 10, count: "14,810" },
    { day: "Tue", thisWeekBlocks: 14, lastWeekBlocks: 12, count: "23,900" },
    { day: "Wed", thisWeekBlocks: 15, lastWeekBlocks: 13, count: "24,815" },
    { day: "Thu", thisWeekBlocks: 6, lastWeekBlocks: 8, count: "11,200" },
    { day: "Fri", thisWeekBlocks: 12, lastWeekBlocks: 10, count: "19,450" },
    { day: "Sat", thisWeekBlocks: 7, lastWeekBlocks: 8, count: "13,100" },
    { day: "Sun", thisWeekBlocks: 8, lastWeekBlocks: 9, count: "14,600" },
  ];
  const maxMatrixBlocks = 16; // 16 vertical slots corresponding to 0k to 25k

  // Retention spline chart points (Sun .. Sun)
  const retentionCurve = [
    { day: "Sun", val: 100, x: 20, y: 15 },
    { day: "Mon", val: 38.6, x: 80, y: 72 },
    { day: "Tue", val: 36.2, x: 140, y: 75 },
    { day: "Wed", val: 33.9, x: 200, y: 78 },
    { day: "Thu", val: 32.8, x: 260, y: 79 },
    { day: "Fri", val: 32.4, x: 320, y: 79 },
    { day: "Sat", val: 32.1, x: 380, y: 79 },
    { day: "Sun", val: 32.0, x: 440, y: 79 },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0d0d0f] text-[#f4f4f5] font-sans antialiased flex flex-col md:flex-row selection:bg-orange-500 selection:text-white">
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (Fixed Linear/PostHog Aesthetic)              */}
      {/* ============================================================ */}
      <aside
        className={`${
          sidebarCollapsed ? "w-16" : "w-[260px]"
        } shrink-0 bg-[#121215] border-r border-[#222227] flex flex-col justify-between transition-all duration-300 select-none z-30 min-h-screen`}
      >
        <div className="flex flex-col">
          {/* Workspace Switcher / Header */}
          <div className="p-3.5 border-b border-[#222227] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#1c1c21] border border-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                <Image
                  src="/wasp-ai-logo.png"
                  alt="Wasp AI"
                  width={24}
                  height={24}
                  className="object-contain"
                  priority
                />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col leading-none truncate">
                  <span className="text-[13px] font-bold text-white tracking-tight">
                    Wasp AI
                  </span>
                  <span className="text-[11px] text-[#71717a] mt-1 font-medium">
                    12 members
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#71717a] hover:text-white transition-colors"
              title="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          {!sidebarCollapsed && (
            <div className="px-3 pt-3 pb-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search or jump to..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full h-8 rounded-md bg-[#18181c] border border-white/[0.06] pl-8 pr-8 text-[12px] text-white placeholder:text-[#52525b] outline-none focus:border-white/20 transition-all"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#71717a] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  ⌘K
                </span>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="px-2 py-3 space-y-4 text-[13px]">
            {/* Essentials Section */}
            <div>
              {!sidebarCollapsed && (
                <span className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#71717a]">
                  Essentials
                </span>
              )}
              <div className="mt-1.5 space-y-0.5">
                {[
                  { id: "overview", label: "Overview", icon: LayoutGrid },
                  { id: "funnels", label: "Funnels", icon: Filter },
                  { id: "retention", label: "Retention", icon: RotateCcw },
                  {
                    id: "revenue",
                    label: "Revenue",
                    icon: DollarSign,
                    badge: "$84.3k",
                  },
                  {
                    id: "users",
                    label: "Users",
                    icon: Users,
                    badge: `${stats.totalUsers}`,
                  },
                  { id: "events", label: "Events", icon: Zap },
                ].map(({ id, label, icon: Icon, badge }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveNav(id as any)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-left ${
                      activeNav === id
                        ? "bg-[#222227] text-white font-medium shadow-sm"
                        : "text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          activeNav === id
                            ? "text-orange-400"
                            : "text-[#71717a]"
                        }`}
                      />
                      {!sidebarCollapsed && <span>{label}</span>}
                    </div>
                    {!sidebarCollapsed && badge && (
                      <span className="text-[11px] font-mono font-medium text-[#71717a] bg-white/[0.04] px-1.5 py-0.5 rounded">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Explore Section */}
            <div>
              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setExploreOpen(!exploreOpen)}
                  className="w-full flex items-center justify-between px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] hover:text-white transition-colors"
                >
                  <span>Explore</span>
                  {exploreOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              {exploreOpen && (
                <div className="mt-1.5 space-y-0.5">
                  {[
                    { id: "models", label: "Dashboard", icon: Cpu },
                    { id: "segments", label: "Segments", icon: PieChart },
                    {
                      id: "reports",
                      label: "Reports",
                      icon: FileText,
                      badge: "3",
                      badgeColor: "bg-orange-500/20 text-orange-400",
                    },
                    {
                      id: "insights",
                      label: "Insights",
                      icon: Sparkles,
                      badge: "Beta",
                      badgeColor: "border border-white/10 text-[#71717a]",
                    },
                  ].map(({ id, label, icon: Icon, badge, badgeColor }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveNav(id as any)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-left ${
                        activeNav === id
                          ? "bg-[#222227] text-white font-medium"
                          : "text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0 text-[#71717a]" />
                        {!sidebarCollapsed && <span>{label}</span>}
                      </div>
                      {!sidebarCollapsed && badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${badgeColor}`}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned Funnels */}
            {!sidebarCollapsed && (
              <div>
                <button
                  type="button"
                  onClick={() => setPinnedOpen(!pinnedOpen)}
                  className="w-full flex items-center justify-between px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Explore</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Plus className="w-3 h-3 hover:text-white" />
                    {pinnedOpen ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </button>
                {pinnedOpen && (
                  <div className="mt-1.5 space-y-1">
                    <button
                      type="button"
                      onClick={() => setActiveNav("overview")}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]"
                    >
                      <div className="w-4 h-4 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px]">
                        V
                      </div>
                      <span className="truncate">Activation funnel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNav("overview")}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]"
                    >
                      <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                        ●
                      </div>
                      <span className="truncate">Activation funnel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNav("overview")}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]"
                    >
                      <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                        ■
                      </div>
                      <span className="truncate">Activation funnel</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Bottom Footer */}
        <div className="p-3 border-t border-[#222227] space-y-1">
          {!sidebarCollapsed && (
            <>
              <button
                type="button"
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#71717a]" />
                  <span>What&apos;s new</span>
                </div>
                <span className="text-[10px] font-mono text-[#71717a] bg-white/[0.04] px-1.5 py-0.5 rounded">
                  2
                </span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]"
              >
                <FileText className="w-4 h-4 text-[#71717a]" />
                <span>Docs</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.03]"
              >
                <Settings className="w-4 h-4 text-[#71717a]" />
                <span>Settings</span>
              </button>
            </>
          )}

          {/* Admin User Profile Card */}
          <div className="pt-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                R
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col text-left truncate leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-white truncate">
                      Ronit
                    </span>
                    <span className="text-[9px] font-mono font-semibold px-1 rounded bg-white/10 text-white/70">
                      Pro
                    </span>
                  </div>
                  <span className="text-[11px] text-[#71717a]">Admin</span>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-1 text-[#71717a] hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN CONTENT AREA (Pixel-Perfect Reference Match)         */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col p-6 sm:p-8 lg:p-9 max-w-[1600px] gap-6 overflow-y-auto">
        {/* Main Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-white tracking-tight">
              {activeNav === "users" ? "User Directory" : "Overview"}
            </h1>
            <div className="flex items-center gap-1.5 text-[12px] text-[#71717a] mt-0.5">
              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-orange-400" : ""}`}
                />
                <span>Updated 2mins ago</span>
              </button>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            {/* Overlapping User Avatars Cluster */}
            <div className="flex items-center -space-x-2">
              <div className="w-7 h-7 rounded-full border-2 border-[#0d0d0f] bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                A
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-[#0d0d0f] bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                M
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-[#0d0d0f] bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">
                S
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-[#0d0d0f] bg-[#222227] text-white/60 text-[10px] font-bold flex items-center justify-center font-mono">
                +9
              </div>
            </div>

            {/* Notification bell */}
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-[#18181b] border border-white/[0.08] flex items-center justify-center text-[#a1a1aa] hover:text-white transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Share button */}
            <button
              type="button"
              className="h-8 px-3 rounded-lg bg-[#18181b] border border-white/[0.08] flex items-center gap-1.5 text-[12px] font-semibold text-[#f4f4f5] hover:bg-white/[0.06] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {/* Primary Action Button: + Create Report */}
            <button
              type="button"
              className="h-8 px-3.5 rounded-lg bg-[#e05326] hover:bg-[#c9451d] text-white text-[12px] font-bold tracking-tight shadow-sm shadow-orange-950/40 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Create Report</span>
            </button>
          </div>
        </header>

        {/* Secondary Filter & Segment Row */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Dropdown Pill */}
            <button
              type="button"
              onClick={() =>
                setTimeRange(
                  timeRange === "Last 7 days" ? "Last 30 days" : "Last 7 days",
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] border border-white/[0.08] text-[12px] font-semibold text-[#f4f4f5] cursor-pointer hover:bg-white/[0.04]"
            >
              <Download className="w-3 h-3 text-[#71717a] rotate-180" />
              <span>{timeRange}</span>
              <ChevronDown className="w-3 h-3 text-[#71717a] ml-1" />
            </button>

            {/* Segment Filter Pills */}
            <div className="flex items-center bg-[#151518] border border-white/[0.06] p-0.5 rounded-lg text-[12px]">
              {[
                { id: "all", label: "All users" },
                { id: "new", label: "New" },
                { id: "returning", label: "Returning" },
                { id: "power", label: "Power users" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUserSegment(id as any)}
                  className={`px-3 py-1 rounded-md transition-all font-medium ${
                    userSegment === id
                      ? "bg-[#27272a] text-white font-semibold shadow-sm"
                      : "text-[#71717a] hover:text-[#d4d4d8]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Filters & Export */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-7 px-2.5 rounded-md bg-[#18181b] border border-white/[0.08] flex items-center gap-1.5 text-[11px] font-medium text-[#a1a1aa] hover:text-white"
            >
              <SlidersHorizontal className="w-3 h-3 text-[#71717a]" />
              <span>Filters</span>
            </button>
            <button
              type="button"
              className="h-7 px-2.5 rounded-md bg-[#18181b] border border-white/[0.08] flex items-center gap-1.5 text-[11px] font-medium text-[#a1a1aa] hover:text-white"
            >
              <Download className="w-3 h-3 text-[#71717a]" />
              <span>Export</span>
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/* VIEW 1: OVERVIEW ANALYTICS (Exact match to uploaded image)   */}
        {/* ============================================================ */}
        {activeNav !== "users" && (
          <>
            {/* Top 4 KPI Metrics Row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Weekly active users */}
              <div className="rounded-xl bg-[#161619] border border-white/[0.06] p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#1e293b] text-blue-400 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px] text-[#a1a1aa] font-medium">
                      Weekly active users
                    </span>
                  </div>
                  <div className="mt-3 text-[26px] font-bold text-white tracking-tight leading-none">
                    24,815
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#f87171] font-medium">
                  <span className="size-1.5 rounded-full bg-[#ef4444]" />
                  <span>12.4% decreased than last week</span>
                </div>
              </div>

              {/* Card 2: Week-1 retention */}
              <div className="rounded-xl bg-[#161619] border border-white/[0.06] p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#332219] text-orange-400 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px] text-[#a1a1aa] font-medium">
                      Week-1 retention
                    </span>
                  </div>
                  <div className="mt-3 text-[26px] font-bold text-white tracking-tight leading-none">
                    38.6%
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#f87171] font-medium">
                  <span className="size-1.5 rounded-full bg-[#ef4444]" />
                  <span>1.1% decreased than last week</span>
                </div>
              </div>

              {/* Card 3: Activation rate */}
              <div className="rounded-xl bg-[#161619] border border-white/[0.06] p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#162a38] text-sky-400 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px] text-[#a1a1aa] font-medium">
                      Activation rate
                    </span>
                  </div>
                  <div className="mt-3 text-[26px] font-bold text-white tracking-tight leading-none">
                    33.9%
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#34d399] font-medium">
                  <span className="size-1.5 rounded-full bg-[#10b981]" />
                  <span>12.9% overall conversions</span>
                </div>
              </div>

              {/* Card 4: Net MRR */}
              <div className="rounded-xl bg-[#161619] border border-white/[0.06] p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#132c23] text-emerald-400 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px] text-[#a1a1aa] font-medium">
                      Net MRR
                    </span>
                  </div>
                  <div className="mt-3 text-[26px] font-bold text-white tracking-tight leading-none">
                    $84,320
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[#34d399] font-medium">
                  <span className="size-1.5 rounded-full bg-[#10b981]" />
                  <span>18.1% increased than last week</span>
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* BIG CENTER HEATMAP / DISCRETE BLOCK MATRIX ("Active users")   */}
            {/* ============================================================ */}
            <section className="rounded-2xl bg-[#161619] border border-white/[0.06] p-6 shadow-sm flex flex-col justify-between">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[12px] text-[#a1a1aa] font-medium block">
                    Active users
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-1">
                    <span className="text-[26px] font-bold text-white tracking-tight leading-none">
                      24,815
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#f87171] font-medium">
                      <span className="size-1.5 rounded-full bg-[#ef4444]" />
                      5.6k users lost in last 7 days
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-[12px] text-[#a1a1aa]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2a2a30]" />
                    <span>Last week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#e05326]" />
                    <span className="text-white">This week</span>
                  </div>
                </div>
              </div>

              {/* Heatmap Grid Matrix with Y-Axis */}
              <div className="mt-8 flex gap-4">
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between text-[11px] font-mono text-[#52525b] pb-7 pt-1 select-none">
                  <span>25k</span>
                  <span>20k</span>
                  <span>15k</span>
                  <span>10k</span>
                  <span>5k</span>
                  <span>0k</span>
                </div>

                {/* Grid Columns */}
                <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 overflow-x-auto pb-1">
                  {heatmapDays.map((col, idx) => (
                    <div
                      key={`${col.day}-${idx}`}
                      className="flex-1 flex flex-col items-center gap-2 min-w-[36px]"
                    >
                      {/* Voxel / Discrete Block Stack (16 slots high) */}
                      <div className="w-full flex flex-col-reverse gap-[3px] items-center">
                        {Array.from({ length: maxMatrixBlocks }).map(
                          (_, blockIdx) => {
                            const isThisWeek = blockIdx < col.thisWeekBlocks;
                            const isLastWeekGhost =
                              !isThisWeek && blockIdx < col.lastWeekBlocks;

                            return (
                              <div
                                key={blockIdx}
                                title={`${col.day}: ${col.count} active users`}
                                className={`w-full max-w-[42px] h-[13px] rounded-[3px] transition-all ${
                                  isThisWeek
                                    ? "bg-[#e05326] shadow-[0_0_8px_rgba(224,83,38,0.35)]"
                                    : isLastWeekGhost
                                      ? "bg-[#25252b]"
                                      : "bg-transparent opacity-0"
                                }`}
                              />
                            );
                          },
                        )}
                      </div>

                      {/* Day Label */}
                      <span className="text-[11px] font-medium text-[#71717a] mt-1 select-none">
                        {col.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ============================================================ */}
            {/* BOTTOM SPLIT ROW: CONVERSIONS & WEEKLY RETENTION            */}
            {/* ============================================================ */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card 1: Conversions */}
              <div className="rounded-xl bg-[#161619] border border-white/[0.06] p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[12px] text-[#a1a1aa] font-medium">
                    Conversions
                  </span>
                  <div className="mt-1 flex items-baseline gap-2.5">
                    <span className="text-[26px] font-bold text-white tracking-tight leading-none">
                      24,815
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-sky-400 font-medium">
                      <span className="size-1.5 rounded-full bg-sky-400" />
                      12.9% overall convertion
                    </span>
                  </div>

                  {/* Multi-segmented Horizontal Progress Slices */}
                  <div className="mt-6">
                    <div className="w-full h-3 rounded-full overflow-hidden flex gap-[2px]">
                      {/* Segment 1: Blue (42.0%) */}
                      <div
                        className="h-full bg-[#2563eb] rounded-l-full"
                        style={{ width: "42.0%" }}
                      />
                      {/* Segment 2: Green (27.9%) */}
                      <div
                        className="h-full bg-[#10b981]"
                        style={{ width: "27.9%" }}
                      />
                      {/* Segment 3: Cyan/Sky (17.2%) */}
                      <div
                        className="h-full bg-[#0284c7]"
                        style={{ width: "17.2%" }}
                      />
                      {/* Segment 4: Orange (12.9%) */}
                      <div
                        className="h-full bg-[#ea580c] rounded-r-full"
                        style={{ width: "12.9%" }}
                      />
                    </div>

                    {/* Percentage Breakdown Labels */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-[#71717a]">
                      <span>42.0%</span>
                      <span>27.9%</span>
                      <span>17.2%</span>
                      <span>12.9%</span>
                    </div>
                  </div>

                  {/* Funnel Rows Breakdown */}
                  <div className="mt-6 space-y-3.5 text-[12px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2563eb]" />
                        <span className="text-[#d4d4d8] font-medium">
                          Signed up
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-white">
                        9,420
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#10b981]" />
                        <span className="text-[#d4d4d8] font-medium">
                          Created a project
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-white">
                        6,180
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0284c7]" />
                        <span className="text-[#d4d4d8] font-medium">
                          Invited a teammate
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-white">
                        3,940
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-[#ea580c]" />
                        <span className="text-[#d4d4d8] font-medium">
                          Activated
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-white">
                        3,190
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Weekly retention */}
              <div className="rounded-xl bg-[#161619] border border-white/[0.06] p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[12px] text-[#a1a1aa] font-medium">
                        Weekly retention
                      </span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-[26px] font-bold text-white tracking-tight leading-none">
                          38.6%
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#f87171] font-medium">
                          <span className="size-1.5 rounded-full bg-[#ef4444]" />
                          2.0pts vs last week
                        </span>
                      </div>
                    </div>

                    {/* Retention Legend */}
                    <div className="flex items-center gap-3 text-[11px] text-[#71717a]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-[#3f3f46]" />
                        <span>Last week</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-[#e05326]" />
                        <span className="text-white">This week</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Retention Spline Chart */}
                  <div className="mt-6 flex gap-3">
                    {/* Y-Axis */}
                    <div className="flex flex-col justify-between text-[10px] font-mono text-[#52525b] pb-6 select-none h-28">
                      <span>100</span>
                      <span>75</span>
                      <span>50</span>
                      <span>25</span>
                      <span>0</span>
                    </div>

                    {/* Chart Canvas */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="w-full h-28 relative">
                        <svg
                          className="w-full h-full overflow-visible"
                          viewBox="0 0 460 90"
                          preserveAspectRatio="none"
                        >
                          {/* Baseline dash line at 25 */}
                          <line
                            x1="0"
                            y1="72"
                            x2="460"
                            y2="72"
                            stroke="#27272a"
                            strokeDasharray="2,2"
                            strokeWidth="1"
                          />

                          {/* Smooth orange spline curve */}
                          <path
                            d="M 20 15 Q 60 70, 80 72 T 140 75 T 200 78 T 260 79 T 320 79 T 380 79 T 440 79"
                            fill="none"
                            stroke="#e05326"
                            strokeWidth="2.5"
                            className="drop-shadow-[0_0_8px_rgba(224,83,38,0.4)]"
                          />

                          {/* Data points */}
                          {retentionCurve.map((pt, i) => (
                            <circle
                              key={i}
                              cx={pt.x}
                              cy={pt.y}
                              r="3.5"
                              fill="#e05326"
                              stroke="#161619"
                              strokeWidth="1.5"
                            />
                          ))}
                        </svg>
                      </div>

                      {/* X-Axis labels */}
                      <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-2 px-1">
                        {retentionCurve.map((pt, i) => (
                          <span key={i}>{pt.day}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Retention Metrics Trio */}
                <div className="mt-6 pt-4 border-t border-white/[0.05] grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#71717a] block">This week</span>
                    <div className="mt-1 flex items-center gap-1 font-semibold text-white">
                      <span>38.6%</span>
                      <span className="text-[#f87171] text-[10px] flex items-center">
                        🔴 1.1%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#71717a] block">Last week</span>
                    <div className="mt-1 flex items-center gap-1 font-semibold text-white">
                      <span>40.6%</span>
                      <span className="text-[#34d399] text-[10px] flex items-center">
                        🟢 2.4%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#71717a] block">Plateau</span>
                    <div className="mt-1 flex items-center gap-1 font-semibold text-white">
                      <span>~32%</span>
                      <span className="text-[#71717a] text-[10px]">Stable</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: USERS DIRECTORY SUB-VIEW (When Users Nav is clicked) */}
        {/* ============================================================ */}
        {activeNav === "users" && (
          <section className="rounded-2xl bg-[#161619] border border-white/[0.06] p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Registered Identity Accounts
                </h3>
                <p className="text-xs text-[#71717a] mt-0.5">
                  Direct management of account permissions, subscription tiers,
                  and sign-in telemetry
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#1c1c21] p-1 rounded-lg border border-white/[0.06] text-xs">
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
                      className={`px-3 py-1 rounded-md transition-all font-semibold ${
                        userFilter === id
                          ? "bg-[#27272a] text-white"
                          : "text-[#71717a] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Directory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[#71717a] text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          selectedUserIds.length === users.length &&
                          users.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-white/20 bg-white/5 accent-orange-600"
                      />
                    </th>
                    <th className="py-3 px-3">Identity &amp; Account</th>
                    <th className="py-3 px-3">Tier &amp; Role</th>
                    <th className="py-3 px-3">IP Origin</th>
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
                        className="py-12 text-center text-[#71717a]"
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
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isSelected ? "bg-orange-500/5" : ""
                          }`}
                        >
                          <td className="py-3.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(u.id)}
                              className="rounded border-white/20 bg-white/5 accent-orange-600"
                            />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-white/10">
                                <AvatarImage
                                  src={getUserAvatar(u)}
                                  alt={u.name || "User"}
                                />
                                <AvatarFallback className="bg-orange-950 text-orange-200 font-bold text-xs">
                                  {(u.name || u.email || "U")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-white">
                                  <span>{u.name || "Anonymous User"}</span>
                                  {isVerified && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  )}
                                </div>
                                <span className="text-[11px] text-[#71717a] font-mono">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.tier === "pro"
                                    ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                                    : "bg-white/[0.04] text-[#a1a1aa]"
                                }`}
                              >
                                {u.tier === "pro" ? "Pro $10/mo" : "Free"}
                              </span>
                              {u.role === "admin" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/25 text-amber-300">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-[11px] text-[#71717a]">
                            {lastIp || "Direct / Unknown"}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-white/80">
                            {refCount}
                          </td>
                          <td className="py-3.5 px-3 text-[#71717a] text-[12px] whitespace-nowrap">
                            {u.createdAt
                              ? format(new Date(u.createdAt), "MMM d, yyyy")
                              : "N/A"}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <Link
                              href={`/admin/users?query=${encodeURIComponent(u.email || "")}`}
                              className="px-2.5 py-1 rounded-md bg-[#222227] hover:bg-[#2c2c33] text-white text-[11px] font-semibold transition-all"
                            >
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-[#71717a] pt-2">
              <span>
                Showing {filteredUsers.length} of {total.toLocaleString()} users
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin?page=${Math.max(1, page - 1)}&limit=${limit}${query ? `&query=${query}` : ""}`}
                  className={`px-3 py-1 rounded bg-[#18181b] border border-white/[0.08] hover:bg-white/[0.04] text-white ${
                    page <= 1 ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Previous
                </Link>
                <span className="font-mono text-white">
                  {page} / {Math.max(1, totalPages)}
                </span>
                <Link
                  href={`/admin?page=${page + 1}&limit=${limit}${query ? `&query=${query}` : ""}`}
                  className={`px-3 py-1 rounded bg-[#18181b] border border-white/[0.08] hover:bg-white/[0.04] text-white ${
                    page >= totalPages ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
