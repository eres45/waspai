"use client";

import { AdminUserListItem } from "app-types/admin";
import { format, formatDistanceToNow } from "date-fns";
import { AdminDashboardStats } from "lib/admin/dashboard";
import { getUserAvatar } from "lib/user/utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  ChevronRight,
  Crown,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function AdminSidebar({ activeTab }: { activeTab: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    router.refresh();
  };

  const nav = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/admin",
      id: "dashboard",
    },
    { icon: Users, label: "Users", href: "/admin", id: "users" },
  ];

  return (
    <aside className="w-[220px] shrink-0 flex flex-col border-r border-white/[0.06] bg-white/[0.02] h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        <div>
          <p className="text-white font-semibold text-[14px] leading-none">
            WaspAI
          </p>
          <p className="text-white/30 text-[11px] mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ icon: Icon, label, href, id }) => (
          <Link
            key={id}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
              activeTab === id
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-4 space-y-1">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  iconColor,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  delta?: number;
  deltaLabel?: string;
  iconColor: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-[13px] text-white/40 font-medium">{label}</p>
        <div className={`p-2 rounded-xl ${iconColor}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-[32px] font-bold text-white leading-none tracking-tight">
        {value}
      </p>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5">
          {positive ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
          )}
          <span
            className={`text-[12px] font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}
          >
            {positive ? "+" : ""}
            {delta}
          </span>
          {deltaLabel && (
            <span className="text-[12px] text-white/30">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function SignupsChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[15px] font-semibold text-white">New Users</p>
          <p className="text-[12px] text-white/30 mt-0.5">Last 6 months</p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-white/30">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
          Signups
        </div>
      </div>
      <div className="flex items-end gap-2 h-32">
        {data.length === 0 ? (
          <p className="text-white/20 text-sm self-center mx-auto">
            No data yet
          </p>
        ) : (
          data.map((d, i) => {
            const height = Math.max((d.count / max) * 100, 4);
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 group"
              >
                <div
                  className="relative w-full flex items-end"
                  style={{ height: "100px" }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white whitespace-nowrap z-10">
                    {d.count} users
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 opacity-80 group-hover:opacity-100 transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[11px] text-white/30">{d.month}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Recent Users ─────────────────────────────────────────────────────────────
function RecentUsers({
  users,
}: {
  users: AdminDashboardStats["recentUsers"];
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-semibold text-white">Recent Signups</p>
        <Link
          href="/admin"
          className="text-[12px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/admin/users/${user.id}`}
            className="flex items-center gap-3 group hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition-all"
          >
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={getUserAvatar(user) ?? ""} />
              <AvatarFallback className="bg-white/10 text-white/60 text-[12px] font-semibold">
                {user.name?.slice(0, 2).toUpperCase() ?? "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-white/30 truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {user.tier === "pro" && (
                <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">
                  Pro
                </span>
              )}
              {user.banned && (
                <span className="text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">
                  Banned
                </span>
              )}
              <span className="text-[11px] text-white/20">
                {formatDistanceToNow(new Date(user.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Users Table ──────────────────────────────────────────────────────────────
function UsersTableSection({
  users,
  total,
  page,
  limit,
  query,
}: {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  query?: string;
}) {
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[15px] font-semibold text-white">All Users</p>
          <p className="text-[12px] text-white/30 mt-0.5">
            {total} total accounts
          </p>
        </div>
        <form method="GET">
          <div className="relative">
            <input
              name="query"
              defaultValue={query}
              placeholder="Search users…"
              className="w-48 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 pl-8 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-all"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Search</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["User", "Email", "Role", "Tier", "Joined", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-3.5">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={getUserAvatar(user) ?? ""} />
                      <AvatarFallback className="bg-white/10 text-white/60 text-[11px] font-semibold">
                        {user.name?.slice(0, 2).toUpperCase() ?? "??"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] font-medium text-white group-hover:text-violet-300 transition-colors truncate max-w-[140px]">
                      {user.name}
                    </span>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-[13px] text-white/50 truncate max-w-[180px]">
                  {user.email}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                      user.role === "admin"
                        ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                        : "bg-white/[0.06] text-white/40 border border-white/[0.08]"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                      user.tier === "pro"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "bg-white/[0.06] text-white/40 border border-white/[0.08]"
                    }`}
                  >
                    {user.tier ?? "free"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[13px] text-white/40">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMM d, yyyy")
                    : "—"}
                </td>
                <td className="px-5 py-3.5">
                  {user.banned ? (
                    <span className="text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">
                      Banned
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      Active
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
          <p className="text-[12px] text-white/30">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin?page=${page - 1}${query ? `&query=${query}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-[12px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin?page=${page + 1}${query ? `&query=${query}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-[12px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
  const growth = stats.newUsersThisMonth - stats.newUsersLastMonth;

  return (
    <div className="flex min-h-screen bg-[#161618] text-white">
      <AdminSidebar activeTab="dashboard" />

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-white/[0.06] bg-[#161618]/80 backdrop-blur-xl">
          <div>
            <h1 className="text-[18px] font-bold text-white">Dashboard</h1>
            <p className="text-[12px] text-white/30 mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-[12px] font-bold text-white shadow-lg">
              A
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
              delta={growth}
              deltaLabel="vs last month"
              iconColor="bg-violet-500/20"
            />
            <StatCard
              label="New This Month"
              value={stats.newUsersThisMonth}
              icon={TrendingUp}
              delta={growth}
              deltaLabel="vs last month"
              iconColor="bg-emerald-500/20"
            />
            <StatCard
              label="Total Chats"
              value={stats.totalChats.toLocaleString()}
              icon={MessageSquare}
              iconColor="bg-blue-500/20"
            />
            <StatCard
              label="Pro Users"
              value={stats.proUsers}
              icon={Crown}
              iconColor="bg-amber-500/20"
            />
          </div>

          {/* Row 2: Chart + Recent Users */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <SignupsChart data={stats.monthlySignups} />
            <RecentUsers users={stats.recentUsers} />
          </div>

          {/* Row 3: Secondary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/20">
                <ShieldCheck className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <p className="text-[12px] text-white/40">Admin Users</p>
                <p className="text-[22px] font-bold text-white">
                  {stats.adminUsers}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-[12px] text-white/40">Banned Users</p>
                <p className="text-[22px] font-bold text-white">
                  {stats.bannedUsers}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[12px] text-white/40">Total Messages</p>
                <p className="text-[22px] font-bold text-white">
                  {stats.totalMessages.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Full Users Table */}
          <UsersTableSection
            users={users}
            total={total}
            page={page}
            limit={limit}
            query={query}
          />
        </div>
      </main>
    </div>
  );
}
