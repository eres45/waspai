"use client";

import { AdminUserListItem } from "app-types/admin";
import { format } from "date-fns";
import { AdminDashboardStats } from "lib/admin/dashboard";
import { getUserAvatar } from "lib/user/utils";
import {
  ArrowUpRight,
  Bell,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  LayoutGrid,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Search,
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(5);

  const handleLogout = async () => {
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    router.refresh();
  };

  // Calendar days generation (current month)
  const today = new Date();
  const currentDayNum = today.getDate();
  const daysHeader = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const calendarDays = [
    { num: 27, currentMonth: false },
    { num: 28, currentMonth: false },
    { num: 29, currentMonth: false },
    { num: 30, currentMonth: false },
    { num: 1, currentMonth: true },
    { num: 2, currentMonth: true },
    { num: 3, currentMonth: true },
    { num: 4, currentMonth: true },
    { num: 5, currentMonth: true },
    { num: 6, currentMonth: true },
    { num: 7, currentMonth: true },
    { num: 8, currentMonth: true },
    { num: 9, currentMonth: true },
    { num: 10, currentMonth: true },
    { num: 11, currentMonth: true },
    { num: 12, currentMonth: true },
    { num: 13, currentMonth: true },
    { num: currentDayNum, currentMonth: true, isToday: true },
    { num: 15, currentMonth: true },
    { num: 16, currentMonth: true },
    { num: 17, currentMonth: true },
    { num: 18, currentMonth: true },
    { num: 19, currentMonth: true },
    { num: 20, currentMonth: true },
    { num: 21, currentMonth: true },
    { num: 22, currentMonth: true },
    { num: 23, currentMonth: true },
    { num: 24, currentMonth: true },
    { num: 25, currentMonth: true },
    { num: 26, currentMonth: true },
    { num: 27, currentMonth: true },
    { num: 28, currentMonth: true },
    { num: 1, currentMonth: false },
    { num: 2, currentMonth: false },
    { num: 3, currentMonth: false },
  ];

  // Filter users in table
  const filteredUsers = users.filter((u) => {
    if (statusFilter === "banned" && !u.banned) return false;
    if (statusFilter === "active" && u.banned) return false;
    if (statusFilter === "admin" && u.role !== "admin") return false;
    if (tierFilter === "pro" && u.tier !== "pro") return false;
    if (tierFilter === "free" && u.tier === "pro") return false;
    return true;
  });

  const maxSignup = Math.max(...stats.monthlySignups.map((s) => s.count), 1);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="w-full min-h-screen bg-[#14151b] text-[#e1e4ea] font-sans antialiased flex flex-col lg:flex-row overflow-x-hidden">
      {/* ============================================================ */}
      {/* LEFT DOCK + SUB-SIDEBAR (Schedule & Queue)                   */}
      {/* ============================================================ */}
      <div className="w-full lg:w-[410px] shrink-0 bg-[#101116] border-b lg:border-b-0 lg:border-r border-white/[0.06] flex">
        {/* Far-left Icon Rail */}
        <div className="w-[72px] shrink-0 border-r border-white/[0.05] py-6 flex flex-col items-center justify-between bg-[#0e0f13]">
          {/* Logo */}
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/admin"
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-400 p-[1px] shadow-lg flex items-center justify-center group"
            >
              <div className="w-full h-full bg-[#121319] rounded-[15px] flex items-center justify-center">
                <span className="font-extrabold text-white text-base tracking-tighter">
                  W
                </span>
              </div>
            </Link>

            {/* Navigation Rail */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveNav("dashboard")}
                title="Dashboard"
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  activeNav === "dashboard"
                    ? "bg-violet-600/25 text-violet-300 shadow-[inset_0_0_12px_rgba(139,92,246,0.3)] border border-violet-500/30"
                    : "text-white/35 hover:text-white/80 hover:bg-white/[0.05]"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveNav("users")}
                title="Users Management"
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  activeNav === "users"
                    ? "bg-violet-600/25 text-violet-300 shadow-[inset_0_0_12px_rgba(139,92,246,0.3)] border border-violet-500/30"
                    : "text-white/35 hover:text-white/80 hover:bg-white/[0.05]"
                }`}
              >
                <Users className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveNav("chats")}
                title="Chat Threads"
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  activeNav === "chats"
                    ? "bg-violet-600/25 text-violet-300 shadow-[inset_0_0_12px_rgba(139,92,246,0.3)] border border-violet-500/30"
                    : "text-white/35 hover:text-white/80 hover:bg-white/[0.05]"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveNav("calendar")}
                title="Calendar & Timeline"
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  activeNav === "calendar"
                    ? "bg-violet-600/25 text-violet-300 shadow-[inset_0_0_12px_rgba(139,92,246,0.3)] border border-violet-500/30"
                    : "text-white/35 hover:text-white/80 hover:bg-white/[0.05]"
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Sidebar: My Schedule Calendar + Users Today List */}
        <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
          {/* CARD 1: My Schedule (Calendar Widget matching mockup) */}
          <div className="bg-[#171821] border border-white/[0.06] rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-semibold text-white tracking-tight">
                My Schedule
              </span>
              <div className="flex items-center gap-1 text-white/40">
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysHeader.map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-medium text-white/35 uppercase tracking-wider"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`h-8 flex items-center justify-center rounded-xl cursor-pointer transition-all ${
                    day.isToday
                      ? "bg-violet-600 text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                      : day.currentMonth
                        ? "text-white/80 hover:bg-white/[0.05]"
                        : "text-white/20"
                  }`}
                >
                  {day.num}
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: Today's Queue / Users Today (matching mockup) */}
          <div className="mt-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  {stats.todayUsers.length || stats.totalUsers} Users active
                  today
                </span>
              </div>
              <div className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Scrollable list of recent active users */}
            <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
              {stats.todayUsers.slice(0, 6).map((u, i) => (
                <div
                  key={u.id || i}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#171821] border border-white/[0.04] hover:border-white/[0.08] transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 rounded-xl border border-white/[0.08] shrink-0">
                      <AvatarImage src={u.image ?? ""} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-600/30 to-purple-800/30 text-white/90 text-[11px] font-bold rounded-xl">
                        {u.name?.slice(0, 2).toUpperCase() || "WA"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate leading-tight group-hover:text-violet-300 transition-colors">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-white/40 truncate mt-0.5">
                        {u.tag}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {i === 0 ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-white/35 font-medium">
                        {u.time}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT MAIN DASHBOARD CONTENT                                 */}
      {/* ============================================================ */}
      <div className="flex-1 bg-[#14151b] p-6 lg:p-8 flex flex-col justify-between overflow-y-auto">
        {/* Top Header: Greeting + Search + Notifications + Profile */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.05]">
          <div>
            <h1 className="text-[26px] md:text-[28px] font-bold text-white tracking-tight">
              Hello, Ronit!
            </h1>
            <p className="text-[13px] text-white/35 mt-0.5">
              Here is your live Wasp AI platform operations overview
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search accounts or data…"
                defaultValue={query}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value;
                    router.push(`/admin?query=${encodeURIComponent(val)}`);
                  }
                }}
                className="w-56 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 pl-9 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
              />
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="size-2 rounded-full bg-emerald-400 absolute top-2.5 right-2.5 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </button>

            {/* Profile Avatar */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-[1px] shadow-md">
              <div className="w-full h-full bg-[#181920] rounded-[15px] flex items-center justify-center font-bold text-[13px] text-white">
                R
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROW 1: TOP 3 KPI CARDS (Peak Hours, Total Users, Rating)     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {/* CARD 1: Peak Activity Hours */}
          <div className="bg-[#181922] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white/50">
                Peak activity hours
              </span>
              <ArrowUpRight className="w-4 h-4 text-white/30" />
            </div>
            <div className="mt-4">
              <div className="text-[28px] font-bold text-white tracking-tight flex items-baseline gap-2">
                {stats.peakHours.split(" ")[0]}
                <span className="text-[13px] font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/20 px-2 py-0.5 rounded-lg">
                  {stats.peakHours.split(" ")[1] || "PM"}
                </span>
              </div>
              <p className="text-[12px] text-white/30 mt-1">
                Highest AI message traffic window
              </p>
            </div>
          </div>

          {/* CARD 2: Total Users (with +13% and dual-color split bar) */}
          <div className="bg-[#181922] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white/50">
                Total users
              </span>
              <MoreHorizontal className="w-4 h-4 text-white/30 cursor-pointer" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-3">
                <span className="text-[34px] font-extrabold text-white tracking-tight leading-none">
                  {stats.totalUsers}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                  +13% vs last month
                </span>
              </div>

              {/* Progress bar split */}
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mt-3 flex">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{
                    width: `${Math.max(15, Math.min(85, (stats.proUsers / Math.max(1, stats.totalUsers)) * 100))}%`,
                  }}
                />
                <div className="h-full bg-indigo-400/60 rounded-full flex-1 ml-1" />
              </div>

              {/* Legend dots */}
              <div className="flex items-center gap-4 mt-2.5 text-[11px] text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-violet-500" />
                  {stats.proUsers} Pro tier
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-indigo-400/60" />
                  {stats.freeUsers} Free tier
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: Avg Rating / AI Satisfaction */}
          <div className="bg-[#181922] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white/50">
                Avg model rating
              </span>
              <ArrowUpRight className="w-4 h-4 text-white/30" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <span className="text-[34px] font-extrabold text-amber-400 tracking-tight leading-none flex items-center gap-1.5">
                  {stats.rating.toFixed(1)}
                </span>
                <span className="text-[11px] font-semibold bg-amber-500/15 border border-amber-500/25 text-amber-400 px-2.5 py-1 rounded-full">
                  {stats.totalReviews} reviews
                </span>
              </div>
              <p className="text-[12px] text-white/30 mt-2">
                Multi-model response quality index
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROW 2: DUAL CHARTS (Activity Bar Chart + Working Hours Gauge)*/}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mt-6">
          {/* CHART 1: Activity Bar Chart (Jan - Dec) */}
          <div className="bg-[#181922] border border-white/[0.06] rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[16px] font-bold text-white tracking-tight">
                  User Growth & Activity
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/40 bg-white/[0.04] border border-white/[0.07] px-3 py-1 rounded-xl">
                  Signups ▾
                </span>
                <span className="text-[11px] text-white/40 bg-white/[0.04] border border-white/[0.07] px-3 py-1 rounded-xl">
                  Year ▾
                </span>
              </div>
            </div>

            {/* The 12-Month Vertical Bars */}
            <div className="flex items-end justify-between gap-2 h-44 pt-6 px-1">
              {stats.monthlySignups.map((m, i) => {
                const barHeightPct = Math.max(14, (m.count / maxSignup) * 100);
                const isHovered = hoveredMonth === i;
                return (
                  <div
                    key={m.month}
                    onMouseEnter={() => setHoveredMonth(i)}
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-full h-32 flex items-end justify-center relative">
                      {/* Interactive Tooltip above active/hovered bar */}
                      {isHovered && (
                        <div className="absolute -top-9 bg-[#23242e] border border-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl shadow-xl whitespace-nowrap z-20 animate-in fade-in zoom-in-95">
                          {m.count} active
                        </div>
                      )}

                      {/* Background Track Bar */}
                      <div className="w-full max-w-[28px] h-full rounded-2xl bg-white/[0.04] flex items-end overflow-hidden p-[2px]">
                        {/* Filled Bar */}
                        <div
                          className={`w-full rounded-xl transition-all duration-300 ${
                            isHovered
                              ? "bg-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.6)]"
                              : "bg-violet-600/40 group-hover:bg-violet-600/70"
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-medium transition-colors ${
                        isHovered ? "text-white font-bold" : "text-white/30"
                      }`}
                    >
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-4 text-[12px] text-white/40 pt-2 border-t border-white/[0.04]">
              <span className="size-2 rounded-full bg-violet-500" />
              Monthly verified registration volume
            </div>
          </div>

          {/* CHART 2: Semi-Circle Workload Gauge ("Working hours" in mockup) */}
          <div className="bg-[#181922] border border-white/[0.06] rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[16px] font-bold text-white tracking-tight">
                Working hours
              </span>
              <span className="text-[11px] text-white/40 bg-white/[0.04] border border-white/[0.07] px-3 py-1 rounded-xl">
                Week ▾
              </span>
            </div>

            {/* Gauge Graphic */}
            <div className="relative flex flex-col items-center justify-center my-3">
              <svg className="w-52 h-28" viewBox="0 0 200 110">
                <title>Working hours gauge</title>
                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {/* Primary Blue/Violet Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 130 30"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {/* Accent Pink/Amber Arc */}
                <path
                  d="M 134 32 A 80 80 0 0 1 176 96"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Value */}
              <div className="absolute bottom-2 text-center">
                <span className="text-[34px] font-black text-white leading-none">
                  {stats.workload.totalHours}
                </span>
                <p className="text-[11px] font-medium text-white/35 mt-0.5">
                  Total hours
                </p>
              </div>
            </div>

            {/* Workload Breakdown */}
            <div className="space-y-2 mt-2 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-white/70">
                  <span className="size-2 rounded-full bg-violet-500" />
                  AI model chats
                </span>
                <span className="font-semibold text-white">
                  {stats.workload.chatReception} hrs
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-white/70">
                  <span className="size-2 rounded-full bg-indigo-400" />
                  Document processing
                </span>
                <span className="font-semibold text-white">
                  {stats.workload.documentProcessing} hrs
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-white/70">
                  <span className="size-2 rounded-full bg-pink-500" />
                  Tool execution
                </span>
                <span className="font-semibold text-white">
                  {stats.workload.onlineConsultations} hrs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROW 3: RECENT ACCOUNTS TABLE ("Appointment" section)         */}
        {/* ============================================================ */}
        <div className="bg-[#181922] border border-white/[0.06] rounded-[24px] p-6 shadow-sm mt-6">
          {/* Table Header with Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-[16px] font-bold text-white tracking-tight">
                User Accounts & Activity
              </h3>
              <p className="text-[12px] text-white/35 mt-0.5">
                {total} registered platform users
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#20212b] border border-white/[0.08] text-[12px] text-white/70 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-white/20 transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="admin">Admins Only</option>
                <option value="banned">Banned</option>
              </select>

              {/* Tier Filter */}
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-[#20212b] border border-white/[0.08] text-[12px] text-white/70 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-white/20 transition-all"
              >
                <option value="all">All Tiers</option>
                <option value="pro">Pro Tier</option>
                <option value="free">Free Tier</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05] text-[11px] uppercase tracking-wider text-white/35 font-semibold">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Joined Date</th>
                  <th className="pb-3 px-4">Time</th>
                  <th className="pb-3 px-4">Verification</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredUsers.map((u) => {
                  const createdDate = u.createdAt
                    ? new Date(u.createdAt)
                    : new Date();
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Name + Avatar */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 rounded-xl border border-white/[0.08]">
                            <AvatarImage src={getUserAvatar(u) ?? ""} />
                            <AvatarFallback className="bg-white/10 text-white font-bold text-[11px] rounded-xl">
                              {u.name?.slice(0, 2).toUpperCase() || "WA"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[13px] font-semibold text-white group-hover:text-violet-300 transition-colors">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-white/35">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status Badges (Blue First visit, Yellow Follow-up, Green Discharge) */}
                      <td className="py-3.5 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                            Admin
                          </span>
                        ) : u.tier === "pro" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Pro Subscriber
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            Standard User
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[13px] text-white/60">
                        {format(createdDate, "MMM d, yyyy")}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-[12px] text-white/40 font-mono">
                        {format(createdDate, "h:mm a")}
                      </td>

                      {/* Verification (Paid / Pending in mockup) */}
                      <td className="py-3.5 px-4">
                        {u.banned ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-400">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            Banned
                          </span>
                        ) : u.tier === "pro" || u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Verified Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-300/80">
                            <Clock className="w-3.5 h-3.5" />
                            Active Free
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-2 text-right">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-violet-400 hover:text-violet-300 transition-colors bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 rounded-xl border border-white/[0.06]"
                        >
                          Details
                          <ExternalLink className="w-3 h-3" />
                        </Link>
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
      </div>
    </div>
  );
}
