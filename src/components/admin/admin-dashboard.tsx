"use client";

import { AdminUserListItem } from "app-types/admin";
import { format } from "date-fns";
import { AdminDashboardStats } from "lib/admin/dashboard";
import { getUserAvatar } from "lib/user/utils";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  Download,
  Edit3,
  Filter,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Moon,
  MoreVertical,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Users,
} from "lucide-react";
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
  const [activeNav, setActiveNav] = useState("dashboard");
  const [timeframe, setTimeframe] = useState<"12m" | "30d" | "7d" | "24h">(
    "12m",
  );
  const [revenueToggle, setRevenueToggle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [chartRange, setChartRange] = useState<
    "5D" | "2W" | "1M" | "6M" | "1Y"
  >("6M");
  const [isDark, setIsDark] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [tableSearch, setTableSearch] = useState(query ?? "");

  const handleLogout = async () => {
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    router.refresh();
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

  // Filtered users for table
  const displayUsers = users.filter((u) => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / limit);

  // Stepped equalizer ticks for system health
  const totalTicks = 24;
  const activeTicks = 22; // 92% health

  // Impression chart bars (6 columns matching reference)
  const impressionBars = [
    { label: "Mon", height: "48%", val: "4.8k" },
    { label: "Tue", height: "65%", val: "7.2k" },
    { label: "Wed", height: "92%", val: "12.4k" },
    { label: "Thu", height: "80%", val: "9.8k" },
    { label: "Fri", height: "55%", val: "5.5k" },
    { label: "Sat", height: "70%", val: "8.1k" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#090a0f] text-[#d6d9e0] font-sans antialiased relative overflow-x-hidden selection:bg-violet-600/30">
      {/* Background ethereal moonlight haze in top right */}
      <div
        className="pointer-events-none absolute top-[-100px] right-[-50px] w-[750px] h-[550px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.16) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="pointer-events-none absolute top-[120px] right-[240px] w-[350px] h-[350px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      <div className="flex w-full min-h-screen">
        {/* ============================================================ */}
        {/* LEFT SIDEBAR (Apex / Wasp AI Style)                          */}
        {/* ============================================================ */}
        <aside className="w-[260px] shrink-0 bg-[#0e1017]/95 border-r border-white/[0.06] flex flex-col justify-between p-5 relative z-10">
          <div>
            {/* Brand Header */}
            <div className="flex items-center justify-between px-2 py-1 mb-6">
              <Link href="/admin" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-[1px] shadow-lg">
                  <div className="w-full h-full bg-[#12131c] rounded-[11px] flex items-center justify-center">
                    <span className="font-extrabold text-white text-[15px] tracking-tight">
                      W
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-[17px] text-white tracking-tight flex items-center gap-1.5">
                    WaspAI
                  </span>
                </div>
              </Link>
              <button
                type="button"
                className="text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.05]"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#141620] border border-white/[0.07] px-3 pl-8 pr-12 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-violet-500/40 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded-md">
                ⌘K
              </span>
            </div>

            {/* Navigation: MAIN */}
            <div className="space-y-1 mb-6">
              <p className="px-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2">
                Main
              </p>

              <button
                type="button"
                onClick={() => setActiveNav("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  activeNav === "dashboard"
                    ? "bg-[#1d202e] text-white border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                    : "text-white/45 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-violet-400" />
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => setActiveNav("users")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  activeNav === "users"
                    ? "bg-[#1d202e] text-white border border-white/[0.08]"
                    : "text-white/45 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <Users className="w-4 h-4" />
                Users & Accounts
              </button>

              <button
                type="button"
                onClick={() => setActiveNav("analytics")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  activeNav === "analytics"
                    ? "bg-[#1d202e] text-white border border-white/[0.08]"
                    : "text-white/45 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Reporting
              </button>

              <button
                type="button"
                onClick={() => setActiveNav("calendar")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  activeNav === "calendar"
                    ? "bg-[#1d202e] text-white border border-white/[0.08]"
                    : "text-white/45 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>

              <button
                type="button"
                onClick={() => setActiveNav("projects")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  activeNav === "projects"
                    ? "bg-[#1d202e] text-white border border-white/[0.08]"
                    : "text-white/45 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Projects
              </button>
            </div>

            {/* Navigation: HELP CENTER */}
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2">
                Help Center
              </p>

              <Link
                href="/contact"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-white/45 hover:text-white hover:bg-white/[0.03] transition-all"
              >
                <LifeBuoy className="w-4 h-4" />
                Support
              </Link>

              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-white/45 hover:text-white hover:bg-white/[0.03] transition-all"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>

          {/* Bottom Card: "Verify this device" with QR frame */}
          <div className="mt-6 rounded-2xl bg-[#13151f] border border-white/[0.06] p-4 text-center">
            <p className="text-[13px] font-semibold text-white tracking-tight">
              Verify this device
            </p>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed px-1">
              Open the authenticator or scan below to verify session.
            </p>

            {/* QR Mock frame */}
            <div className="my-3 mx-auto w-24 h-24 bg-white p-2 rounded-xl shadow-md flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-neutral-900"
                fill="currentColor"
              >
                <title>QR Code</title>
                {/* Simulated clean QR matrix */}
                <rect x="10" y="10" width="24" height="24" rx="3" />
                <rect x="66" y="10" width="24" height="24" rx="3" />
                <rect x="10" y="66" width="24" height="24" rx="3" />
                <rect x="16" y="16" width="12" height="12" fill="#fff" />
                <rect x="72" y="16" width="12" height="12" fill="#fff" />
                <rect x="16" y="72" width="12" height="12" fill="#fff" />
                <rect x="19" y="19" width="6" height="6" />
                <rect x="75" y="19" width="6" height="6" />
                <rect x="19" y="75" width="6" height="6" />
                <rect x="42" y="12" width="6" height="6" />
                <rect x="52" y="18" width="6" height="12" />
                <rect x="42" y="32" width="16" height="6" />
                <rect x="66" y="44" width="8" height="16" />
                <rect x="42" y="44" width="18" height="12" />
                <rect x="12" y="46" width="18" height="8" />
                <rect x="42" y="66" width="12" height="6" />
                <rect x="42" y="78" width="24" height="12" />
                <rect x="72" y="72" width="18" height="18" />
              </svg>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-[12px] font-medium text-white/50 hover:text-white transition-colors"
            >
              Sign out of panel
            </button>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* RIGHT MAIN CONTENT AREA                                      */}
        {/* ============================================================ */}
        <main className="flex-1 p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto min-h-screen">
          {/* Top Bar: Title + Timeframe Tabs + Theme + Profile */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-[26px] font-bold text-white tracking-tight">
              Dashboard
            </h1>

            {/* Timeframe segmented pill [ 12 months | 30 days | 7 days | 24 hours ] */}
            <div className="flex items-center gap-1 bg-[#12141d] border border-white/[0.07] p-1 rounded-2xl shadow-inner">
              {[
                { id: "12m", label: "12 months" },
                { id: "30d", label: "30 days" },
                { id: "7d", label: "7 days" },
                { id: "24h", label: "24 hours" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
                    timeframe === t.id
                      ? "bg-[#1f2230] text-white shadow-sm border border-white/[0.06]"
                      : "text-white/40 hover:text-white/80"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Right Controls: Theme Toggle + Bell + Admin Profile + Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Switcher pill */}
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className="flex items-center gap-1.5 bg-[#12141d] border border-white/[0.07] p-1 rounded-2xl text-white/50"
              >
                <div
                  className={`p-1 rounded-xl ${isDark ? "bg-white/[0.08] text-white" : ""}`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </div>
                <div
                  className={`p-1 rounded-xl ${!isDark ? "bg-white/[0.08] text-white" : ""}`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Notification Bell */}
              <button
                type="button"
                className="w-9 h-9 rounded-xl bg-[#12141d] border border-white/[0.07] flex items-center justify-center text-white/60 hover:text-white relative"
              >
                <Bell className="w-4 h-4" />
                <span className="size-1.5 rounded-full bg-violet-400 absolute top-2 right-2" />
              </button>

              {/* Profile Chip */}
              <div className="flex items-center gap-2.5 bg-[#12141d] border border-white/[0.07] py-1 pl-2.5 pr-1 rounded-2xl">
                <span className="text-[12px] font-semibold text-white">
                  Ronit
                </span>
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white shadow">
                  R
                </div>
              </div>

              {/* Select dates button */}
              <button
                type="button"
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12141d] border border-white/[0.07] text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-white/40" />
                Select dates
              </button>

              {/* Filters button */}
              <button
                type="button"
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12141d] border border-white/[0.07] text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <Filter className="w-3.5 h-3.5 text-white/40" />
                Filters
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* ROW 1: 3 KPI STAT CARDS (Revenue, Orders, Avg Order Value)   */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Today's revenue */}
            <div className="rounded-[22px] bg-[#12141d]/90 border border-white/[0.06] p-5 shadow-sm relative overflow-hidden backdrop-blur-md">
              <span className="text-[12px] font-medium text-white/45">
                Today&apos;s revenue
              </span>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[32px] font-extrabold text-white tracking-tight">
                  ${Math.max(1280, stats.proUsers * 29).toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  10%
                </span>
              </div>
            </div>

            {/* Card 2: Today's orders / Chat Sessions */}
            <div className="rounded-[22px] bg-[#12141d]/90 border border-white/[0.06] p-5 shadow-sm relative overflow-hidden backdrop-blur-md">
              <span className="text-[12px] font-medium text-white/45">
                Today&apos;s orders &amp; chats
              </span>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[32px] font-extrabold text-white tracking-tight">
                  {Math.max(140, stats.totalChats).toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  12%
                </span>
              </div>
            </div>

            {/* Card 3: Avg. order value */}
            <div className="rounded-[22px] bg-[#12141d]/90 border border-white/[0.06] p-5 shadow-sm relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-white/45">
                  Avg. order value
                </span>
                <MoreVertical className="w-3.5 h-3.5 text-white/30 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[32px] font-extrabold text-white tracking-tight">
                  $91.42
                </span>
                <span className="text-[11px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 rotate-90" />
                  2%
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* ROW 2: COMPLEX CARDS GRID (Total Revenue, Ratings, Chart)   */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT: Total Revenue Card with Neon Glow Bar (Col 4) */}
            <div className="lg:col-span-4 rounded-[24px] bg-[#12141d]/90 border border-white/[0.06] p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white/50">
                    Total Revenue
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Big Metric */}
                <div className="mt-3">
                  <span className="text-[40px] font-black text-white tracking-tight leading-none">
                    $67K
                  </span>
                  <div className="flex items-center gap-2 mt-1.5 text-[12px]">
                    <button
                      type="button"
                      onClick={() => setRevenueToggle("monthly")}
                      className={`font-medium transition-colors ${
                        revenueToggle === "monthly"
                          ? "text-white"
                          : "text-white/40"
                      }`}
                    >
                      Monthly
                    </button>
                    <span className="text-white/20">|</span>
                    <button
                      type="button"
                      onClick={() => setRevenueToggle("yearly")}
                      className={`font-medium transition-colors ${
                        revenueToggle === "yearly"
                          ? "text-white"
                          : "text-white/40"
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {/* Glowing Neon Cyan-Violet Progress Track (matching reference) */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-[12px] text-white/60 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Revenue till {format(new Date(), "do MMM")}</span>
                  </div>

                  {/* Outer track */}
                  <div className="w-full h-3 rounded-full bg-[#1c1f2b] p-[2px] relative overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-300 relative shadow-[0_0_14px_rgba(103,232,249,0.8)]"
                      style={{ width: "68%" }}
                    >
                      {/* Bright glowing head */}
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 size-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                    </div>
                  </div>

                  <p className="text-[11px] text-white/35 mt-2">
                    Best performance of the month
                  </p>
                </div>

                {/* 4-Metrics Sub-grid */}
                <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-white/[0.04]">
                  <div>
                    <p className="text-[10px] text-white/35 uppercase">
                      Top sales
                    </p>
                    <p className="text-[13px] font-bold text-white mt-0.5">
                      9K
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/35 uppercase">
                      Workflows
                    </p>
                    <p className="text-[13px] font-bold text-white mt-0.5">
                      40K
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/35 uppercase">
                      API Calls
                    </p>
                    <p className="text-[13px] font-bold text-white mt-0.5">
                      03K
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/35 uppercase">Tools</p>
                    <p className="text-[13px] font-bold text-white mt-0.5">
                      10K
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-6">
                <button
                  type="button"
                  className="flex-1 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] text-[12px] font-medium text-white/70 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-white/40" />
                  Download
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 rounded-xl bg-[#1d202e] border border-white/[0.08] hover:bg-[#25293b] text-[12px] font-medium text-white transition-all text-center"
                >
                  Track sales
                </button>
              </div>
            </div>

            {/* CENTER: Customer Rating + User Insight (Col 4) */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* Card 1: Customer Rating with glowing peak waveform */}
              <div className="rounded-[24px] bg-[#12141d]/90 border border-white/[0.06] p-5 shadow-sm flex flex-col justify-between backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white/50">
                    Customer Rating
                  </span>
                </div>

                <div className="flex items-center justify-between my-3">
                  <div>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider">
                      Total Rating
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-[20px] font-bold text-white">
                        4.9/5
                      </span>
                      <span className="text-[11px] text-white/40">
                        (Overall 4.8)
                      </span>
                    </div>
                  </div>

                  {/* Sparkline wave with bright star burst peak */}
                  <div className="relative w-28 h-12">
                    <svg
                      viewBox="0 0 100 40"
                      className="w-full h-full overflow-visible"
                    >
                      <title>Rating sparkline</title>
                      <path
                        d="M 0 30 Q 15 32 30 25 T 60 15 T 75 5 T 90 22 T 100 28"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                      />
                      {/* Glowing peak point */}
                      <circle
                        cx="75"
                        cy="5"
                        r="3"
                        fill="#ffffff"
                        className="shadow-[0_0_8px_#ffffff]"
                      />
                    </svg>
                    <div className="absolute top-0 right-7 size-2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.9)] animate-pulse" />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.04] text-[11px] text-white/35 flex items-center justify-between">
                  <span>Total work hours include extra models.</span>
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>

              {/* Card 2: User Insight / Credit score with Stepped LED Equalizer */}
              <div className="rounded-[24px] bg-[#12141d]/90 border border-white/[0.06] p-5 shadow-sm flex flex-col justify-between backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white/50">
                    User insight
                  </span>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-white/60 bg-white/[0.04] border border-white/[0.07] px-2.5 py-0.5 rounded-lg hover:text-white"
                  >
                    Details
                  </button>
                </div>

                <div className="my-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-white">
                      Your platform health index is 98%
                    </span>
                    <span className="text-[16px]">😎</span>
                  </div>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    This operational score is considered Excellent.
                  </p>
                </div>

                {/* Stepped LED Equalizer Bar (matching reference) */}
                <div className="flex items-center gap-1.5 pt-1">
                  {Array.from({ length: totalTicks }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 flex-1 rounded-[2px] transition-all ${
                        i < activeTicks
                          ? "bg-gradient-to-t from-violet-600 via-indigo-400 to-cyan-300 shadow-[0_0_4px_rgba(99,102,241,0.5)]"
                          : "bg-white/[0.06]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Impressions Overview / 3D Illuminated Glass Bars (Col 4) */}
            <div className="lg:col-span-4 rounded-[24px] bg-[#12141d]/90 border border-white/[0.06] p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-white/50">
                    Impressions overview
                  </span>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    See All
                  </button>
                </div>

                {/* Account & Impression Header */}
                <div className="mt-1">
                  <p className="text-[10px] text-white/35 uppercase font-mono">
                    WASP AI CORE ENGINE
                  </p>
                  <p className="text-[26px] font-extrabold text-white tracking-tight mt-0.5">
                    $440,364.20
                  </p>
                </div>

                {/* Range pills [ 5D | 2W | 1M | 6M | 1Y ] */}
                <div className="flex items-center gap-1 mt-4 text-[11px]">
                  {(["5D", "2W", "1M", "6M", "1Y"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setChartRange(r)}
                      className={`px-2.5 py-0.5 rounded-lg font-medium transition-all ${
                        chartRange === r
                          ? "bg-white/[0.1] text-white font-bold"
                          : "text-white/35 hover:text-white/70"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* 3D Glass Cylindrical Bars with glowing neon tops */}
                <div className="flex items-end justify-between gap-3 h-36 mt-4 pt-4 px-2">
                  {impressionBars.map((b) => (
                    <div
                      key={b.label}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-full h-28 flex items-end justify-center relative">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1e202d] border border-white/20 text-white text-[10px] px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                          {b.val}
                        </div>
                        {/* Glass bar column */}
                        <div
                          className="w-full max-w-[20px] rounded-t-lg bg-gradient-to-t from-indigo-950 via-indigo-600/50 to-white/90 shadow-[0_0_12px_rgba(99,102,241,0.6)] group-hover:shadow-[0_0_18px_rgba(139,92,246,0.9)] transition-all relative overflow-hidden"
                          style={{ height: b.height }}
                        >
                          {/* Illuminated top highlight */}
                          <div className="absolute top-0 inset-x-0 h-1.5 bg-white shadow-[0_0_8px_#ffffff]" />
                        </div>
                      </div>
                      <span className="text-[10px] text-white/30 font-medium">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.04] text-[11px] text-white/35 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-400" />
                Discover the impressions of your audience.
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* ROW 3: EMPLOYEES & USERS TABLE (Bottom Card)                 */}
          {/* ============================================================ */}
          <div className="rounded-[24px] bg-[#12141d]/90 border border-white/[0.06] p-6 shadow-sm backdrop-blur-md">
            {/* Header + Search bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight">
                  Employees & Platform Users
                </h3>
                <p className="text-[12px] text-white/35 mt-0.5">
                  {total} registered accounts
                </p>
              </div>

              {/* Table search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-60 h-9 rounded-xl bg-[#171923] border border-white/[0.07] px-3 pl-8 pr-10 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-violet-500/40 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30">
                  ⌘K
                </span>
              </div>
            </div>

            {/* Table */}
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
                    <th className="pb-3 px-4">Customer ↕</th>
                    <th className="pb-3 px-4">Email ↕</th>
                    <th className="pb-3 px-4">Date ↕</th>
                    <th className="pb-3 px-4">Status ↕</th>
                    <th className="pb-3 px-4">Amount ↕</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {displayUsers.map((u) => {
                    const createdDate = u.createdAt
                      ? new Date(u.createdAt)
                      : new Date();
                    const isSelected = selectedUserIds.includes(u.id);
                    const handle = u.email
                      ? `@${u.email.split("@")[0]}`
                      : "@user";

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors group ${
                          isSelected
                            ? "bg-white/[0.04]"
                            : "hover:bg-white/[0.02]"
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

                        {/* Customer / Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 rounded-full border border-white/[0.08]">
                              <AvatarImage src={getUserAvatar(u) ?? ""} />
                              <AvatarFallback className="bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 text-white font-bold text-[11px] rounded-full">
                                {u.name?.slice(0, 2).toUpperCase() || "WA"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[13px] font-semibold text-white group-hover:text-violet-300 transition-colors">
                                {u.name}
                              </p>
                              <p className="text-[11px] text-white/35">
                                {handle}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-[13px] text-white/50 font-mono">
                          {u.email}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-[12px] text-white/60">
                          {format(createdDate, "MMM d, yyyy")}
                        </td>

                        {/* Status (Paid / Pending pill) */}
                        <td className="py-3.5 px-4">
                          {u.banned ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <span className="size-1.5 rounded-full bg-rose-400" />
                              Banned
                            </span>
                          ) : u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25">
                              <span className="size-1.5 rounded-full bg-violet-400" />
                              Admin
                            </span>
                          ) : u.tier === "pro" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              <span className="size-1.5 rounded-full bg-amber-400" />
                              Free
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-[13px] font-semibold text-white">
                          {u.tier === "pro" ? "$98.32" : "$0.00"}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pr-2 text-right">
                          <div className="flex items-center justify-end gap-2 text-white/30">
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="p-1 rounded-lg hover:text-white hover:bg-white/[0.06] transition-colors"
                              title="Edit user"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              className="p-1 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete record"
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
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.05]">
                <span className="text-[12px] text-white/35">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/admin?page=${page - 1}${query ? `&query=${query}` : ""}`}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/admin?page=${page + 1}${query ? `&query=${query}` : ""}`}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
