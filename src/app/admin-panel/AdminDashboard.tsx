"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
} from "recharts";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  banned: boolean | null;
};

type Stats = {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalAgents: number;
  totalWorkflows: number;
  totalSites: number;
  recentUsers: User[];
  usersByRole: { role: string; count: number }[];
  totalTokens: number;
  totalApiCalls: number;
  totalCreditsUsed: number;
  subscriptions: { tier: string; count: number }[];
  analytics: {
    registrations: { date: string; count: number }[];
    traffic: { date: string; count: number; tokens: number }[];
    models: { model: string; tokens: number; count: number }[];
  };
  error: string | null;
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "analytics", label: "Analytics", icon: "📈" },
] as const;

export default function AdminDashboard({
  stats,
  adminEmail,
}: {
  stats: Stats;
  adminEmail: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "users" | "analytics">(
    "overview",
  );
  const [mounted, setMounted] = useState(false);
  const [subSort, setSubSort] = useState<"tier" | "count">("tier");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredUsers = stats.recentUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleLogout() {
    await fetch("/api/admin-panel/auth", { method: "DELETE" });
    startTransition(() => {
      router.push("/admin-panel/login");
      router.refresh();
    });
  }

  // Formatting helpers
  const formatTokens = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatCredits = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(num);
  };

  // Sort active subscriptions bought
  // Order definition for tier sorting
  const tierOrder: Record<string, number> = { ultra: 3, pro: 2, free: 1 };
  const sortedSubscriptions = [...stats.subscriptions].sort((a, b) => {
    if (subSort === "tier") {
      const orderA = tierOrder[a.tier.toLowerCase()] ?? 0;
      const orderB = tierOrder[b.tier.toLowerCase()] ?? 0;
      return orderB - orderA; // High tier first
    } else {
      return b.count - a.count; // Highest subscriber counts first
    }
  });

  // Calculate percentages for subscriptions
  const totalSubscribers =
    stats.subscriptions.reduce((sum, s) => sum + s.count, 0) || 1;

  // Pie chart colors for subscriptions
  const COLORS = {
    ultra: "#ec4899", // pink-500
    pro: "#3b82f6", // blue-500
    free: "#6b7280", // gray-500
  };

  const subscriptionPieData = sortedSubscriptions.map((s) => ({
    name: s.tier.toUpperCase(),
    value: s.count,
    color: COLORS[s.tier.toLowerCase() as keyof typeof COLORS] ?? "#10b981",
  }));

  return (
    <div className="flex min-h-screen bg-[#09090b] text-[#fafafa] font-sans">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-[#27272a] bg-[#18181b] flex flex-col justify-between py-4 sticky top-0 h-screen">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shrink-0">
              W
            </div>
            <div>
              <p className="text-sm font-semibold text-[#fafafa] leading-none">
                Wasp AI
              </p>
              <p className="text-[11px] text-[#a1a1aa] mt-0.5">Admin Panel</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-2 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  tab === item.id
                    ? "bg-[#27272a] text-[#fafafa]"
                    : "text-[#a1a1aa] hover:bg-[#27272a]/50 hover:text-[#fafafa]"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="px-2 space-y-2">
          {/* Admin info */}
          <div className="px-3 py-2.5 rounded-lg bg-[#27272a]/40">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <p className="text-xs font-medium text-[#fafafa] truncate">
                {adminEmail}
              </p>
            </div>
            <p className="text-[11px] text-[#a1a1aa] pl-3.5">Super Admin</p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-lg text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors text-left disabled:opacity-60"
          >
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Page header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-[#fafafa]">
              {tab === "overview" && "Overview"}
              {tab === "users" && "Users"}
              {tab === "analytics" && "Analytics"}
            </h1>
            <p className="text-sm text-[#a1a1aa] mt-0.5">
              {tab === "overview" && "Live metrics and active totals"}
              {tab === "users" && "User directory and system roles"}
              {tab === "analytics" &&
                "Real-time usage and traffic analytics charts"}
            </p>
          </div>
          {tab === "analytics" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-500 animate-pulse" />
              Real-time
            </span>
          )}
        </div>

        {/* DB error banner */}
        {stats.error && (
          <div className="mb-4 flex items-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] rounded-lg px-4 py-3 text-sm">
            ⚠ {stats.error}
          </div>
        )}

        {/* ── Overview Tab ──────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Database Metrics Grid */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-3">
                Database Records
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: "Total Users", value: stats.totalUsers, icon: "👥" },
                  {
                    label: "Chat Threads",
                    value: stats.totalChats,
                    icon: "💬",
                  },
                  {
                    label: "Total Messages",
                    value: stats.totalMessages,
                    icon: "📨",
                  },
                  { label: "AI Agents", value: stats.totalAgents, icon: "🤖" },
                  {
                    label: "Workflows",
                    value: stats.totalWorkflows,
                    icon: "⚡",
                  },
                  {
                    label: "Deployed Sites",
                    value: stats.totalSites,
                    icon: "🌐",
                  },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="bg-[#18181b] border border-[#27272a] rounded-xl p-4"
                  >
                    <p className="text-xl mb-1">{c.icon}</p>
                    <p className="text-xl font-bold text-[#fafafa] tabular-nums">
                      {c.value.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#a1a1aa] mt-1">{c.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Usage Metrics Grid */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-3">
                Usage & Credit Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Token Consumption",
                    value: formatTokens(stats.totalTokens),
                    desc: "Accumulated LLM input & output tokens",
                    icon: "🧮",
                    color: "border-blue-500/20 bg-blue-500/5 text-blue-400",
                  },
                  {
                    label: "Total API Requests",
                    value: stats.totalApiCalls.toLocaleString(),
                    desc: "Total completed assistant responses generated",
                    icon: "🚀",
                    color:
                      "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
                  },
                  {
                    label: "Estimated Credit Cost",
                    value: formatCredits(stats.totalCreditsUsed),
                    desc: "Est. model cost (Input $1.5/M, Output $5/M)",
                    icon: "🪙",
                    color: "border-pink-500/20 bg-pink-500/5 text-pink-400",
                  },
                ].map((c) => (
                  <div
                    key={c.label}
                    className={`border rounded-xl p-5 ${c.color.split(" ")[0]} ${c.color.split(" ")[1]}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl">{c.icon}</span>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/50`}
                      >
                        Live
                      </span>
                    </div>
                    <p className="text-3xl font-extrabold tracking-tight tabular-nums text-[#fafafa]">
                      {c.value}
                    </p>
                    <p className="text-sm font-semibold text-[#fafafa] mt-1">
                      {c.label}
                    </p>
                    <p className="text-xs text-[#a1a1aa] mt-1">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Subscriptions Bought Breakdown */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[#fafafa]">
                      Subscriptions Bought
                    </h2>
                    <p className="text-xs text-[#a1a1aa]">
                      Real-time user tier breakdown
                    </p>
                  </div>
                  <div className="flex items-center bg-[#27272a] rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setSubSort("tier")}
                      className={`px-2 py-1 rounded-md transition-colors ${subSort === "tier" ? "bg-[#09090b] text-[#fafafa]" : "text-[#a1a1aa]"}`}
                    >
                      Tier Rank
                    </button>
                    <button
                      onClick={() => setSubSort("count")}
                      className={`px-2 py-1 rounded-md transition-colors ${subSort === "count" ? "bg-[#09090b] text-[#fafafa]" : "text-[#a1a1aa]"}`}
                    >
                      Volume
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedSubscriptions.length === 0 ? (
                    <p className="text-xs text-[#a1a1aa] text-center py-6">
                      No subscription data found
                    </p>
                  ) : (
                    sortedSubscriptions.map((s) => {
                      const percentage = Math.round(
                        (s.count / totalSubscribers) * 100,
                      );
                      const colorClass =
                        s.tier.toLowerCase() === "ultra"
                          ? "bg-pink-500 text-pink-400"
                          : s.tier.toLowerCase() === "pro"
                            ? "bg-blue-500 text-blue-400"
                            : "bg-[#71717a] text-[#a1a1aa]";

                      return (
                        <div key={s.tier} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="capitalize flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${colorClass.split(" ")[0]}`}
                              />
                              {s.tier} plan
                            </span>
                            <span className="text-[#a1a1aa] tabular-nums">
                              {s.count} users ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#27272a] rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${colorClass.split(" ")[0]}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Role breakdown & user rates */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#fafafa] mb-4">
                    System User Roles
                  </h2>
                  <div className="flex gap-4">
                    {stats.usersByRole.map((r) => (
                      <div
                        key={r.role}
                        className="flex-1 bg-[#27272a]/30 border border-[#27272a] rounded-lg p-3 text-center"
                      >
                        <RoleBadge role={r.role} />
                        <p className="text-2xl font-bold text-[#fafafa] tabular-nums mt-2">
                          {Number(r.count).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-[#a1a1aa] uppercase tracking-wider">
                          Users
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#27272a] mt-4 flex items-center justify-between text-xs text-[#a1a1aa]">
                  <span>System security tier:</span>
                  <span className="font-semibold text-white">
                    Better-Auth RBAC Enabled
                  </span>
                </div>
              </div>
            </div>

            {/* Recent users */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#fafafa]">
                    Recently Registered
                  </h2>
                  <p className="text-xs text-[#a1a1aa]">
                    Latest users to join Wasp AI
                  </p>
                </div>
                <button
                  onClick={() => setTab("users")}
                  className="text-xs text-blue-500 hover:underline font-medium"
                >
                  View all directory →
                </button>
              </div>
              <UsersTable users={stats.recentUsers.slice(0, 5)} />
            </div>
          </div>
        )}

        {/* ── Users Tab ─────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 animate-in fade-in duration-300">
            {/* Search and Filters */}
            <div className="flex items-center gap-2 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2.5 mb-4">
              <svg
                className="w-4 h-4 text-[#a1a1aa] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search registered users by name or email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#fafafa] placeholder:text-[#a1a1aa] outline-none"
              />
              <span className="text-xs text-[#a1a1aa] bg-[#27272a] px-2 py-0.5 rounded shrink-0">
                {filteredUsers.length} matched / {stats.recentUsers.length}{" "}
                total
              </span>
            </div>
            <UsersTable users={filteredUsers} />
          </div>
        )}

        {/* ── Analytics Tab ─────────────────────────────────────────────── */}
        {tab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {!mounted ? (
              // Hydration safe loading screen
              <div className="flex flex-col items-center justify-center py-20 gap-3 bg-[#18181b] border border-[#27272a] rounded-xl">
                <div className="w-8 h-8 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <p className="text-sm text-[#a1a1aa]">
                  Loading interactive charts...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top Row Charts: Traffic & Tokens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Messages (Traffic) Area Chart */}
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-[#fafafa]">
                      API Traffic & Completions
                    </h3>
                    <p className="text-xs text-[#a1a1aa] mb-4">
                      Daily total API responses sent to users (last 30 days)
                    </p>
                    <div className="h-72 w-full">
                      {stats.analytics.traffic.length === 0 ? (
                        <EmptyChartState />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={stats.analytics.traffic}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="colorTraffic"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#18181b",
                                borderColor: "#27272a",
                                borderRadius: "8px",
                                color: "#fafafa",
                              }}
                              labelClassName="text-[#a1a1aa] text-xs"
                            />
                            <Area
                              type="monotone"
                              dataKey="count"
                              name="API Calls"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorTraffic)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Daily Token Consumption Bar Chart */}
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-[#fafafa]">
                      Daily Token Consumption
                    </h3>
                    <p className="text-xs text-[#a1a1aa] mb-4">
                      Total active token volume usage per day (last 30 days)
                    </p>
                    <div className="h-72 w-full">
                      {stats.analytics.traffic.length === 0 ? (
                        <EmptyChartState />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={stats.analytics.traffic}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -10,
                              bottom: 0,
                            }}
                          >
                            <XAxis
                              dataKey="date"
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#71717a"
                              fontSize={10}
                              tickFormatter={(tick) => formatTokens(tick)}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#18181b",
                                borderColor: "#27272a",
                                borderRadius: "8px",
                                color: "#fafafa",
                              }}
                              formatter={(value) => [
                                Number(value).toLocaleString() + " tokens",
                                "Usage",
                              ]}
                              labelClassName="text-[#a1a1aa] text-xs"
                            />
                            <Bar
                              dataKey="tokens"
                              name="Tokens"
                              fill="#10b981"
                              radius={[4, 4, 0, 0]}
                            >
                              {stats.analytics.traffic.map((_entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill="#10b981"
                                  fillOpacity={0.8}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Row Charts: Registrations & Subscription Pie */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Daily Registrations Line Chart */}
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-[#fafafa]">
                      New User Signups
                    </h3>
                    <p className="text-xs text-[#a1a1aa] mb-4">
                      Daily registration rate (last 30 days)
                    </p>
                    <div className="h-72 w-full">
                      {stats.analytics.registrations.length === 0 ? (
                        <EmptyChartState />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={stats.analytics.registrations}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <XAxis
                              dataKey="date"
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#18181b",
                                borderColor: "#27272a",
                                borderRadius: "8px",
                                color: "#fafafa",
                              }}
                              labelClassName="text-[#a1a1aa] text-xs"
                            />
                            <Line
                              type="monotone"
                              dataKey="count"
                              name="Signups"
                              stroke="#6366f1"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Active Subscription Donut Chart */}
                  <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#fafafa]">
                        Plan Allocation
                      </h3>
                      <p className="text-xs text-[#a1a1aa] mb-2">
                        Total active subscriptions bought breakdown
                      </p>
                    </div>
                    <div className="h-52 w-full flex items-center justify-center relative">
                      {totalSubscribers === 0 ? (
                        <EmptyChartState />
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={subscriptionPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {subscriptionPieData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#18181b",
                                  borderColor: "#27272a",
                                  borderRadius: "8px",
                                  color: "#fafafa",
                                }}
                                formatter={(value) => [`${value} subscribers`]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold tracking-tight text-[#fafafa]">
                              {totalSubscribers}
                            </span>
                            <span className="text-[10px] uppercase text-[#a1a1aa] font-semibold tracking-wider">
                              Subscribers
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-center gap-4 text-xs pt-2 border-t border-[#27272a]">
                      {sortedSubscriptions.map((s) => (
                        <div key={s.tier} className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-sm`}
                            style={{
                              backgroundColor:
                                COLORS[
                                  s.tier.toLowerCase() as keyof typeof COLORS
                                ] ?? "#10b981",
                            }}
                          />
                          <span className="capitalize">{s.tier}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Row Charts: Model Breakdown */}
                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#fafafa]">
                    Model Token Usage breakdown
                  </h3>
                  <p className="text-xs text-[#a1a1aa] mb-4">
                    Total tokens spent per specific AI model (sorted highest
                    usage first)
                  </p>

                  {stats.analytics.models.length === 0 ? (
                    <EmptyChartState />
                  ) : (
                    <div className="space-y-4">
                      {stats.analytics.models.map((m) => {
                        const maxTokens = Math.max(
                          ...stats.analytics.models.map((x) => x.tokens),
                          1,
                        );
                        const percentage = Math.round(
                          (m.tokens / maxTokens) * 100,
                        );

                        return (
                          <div
                            key={m.model}
                            className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 text-xs"
                          >
                            <div className="md:col-span-1">
                              <span
                                className="font-semibold text-[#fafafa] truncate block max-w-full"
                                title={m.model}
                              >
                                {m.model}
                              </span>
                            </div>
                            <div className="md:col-span-2">
                              <div className="w-full bg-[#27272a] h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="md:col-span-1 text-right text-[#a1a1aa] tabular-nums font-mono">
                              {m.tokens.toLocaleString()} tokens ({m.count}{" "}
                              calls)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    editor: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    user: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize tracking-wide ${styles[role] ?? styles.user}`}
    >
      {role}
    </span>
  );
}

function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-[#27272a] text-[#a1a1aa] text-xs uppercase tracking-wider">
            {[
              "User",
              "Email Address",
              "System Role",
              "Usage Tier",
              "Banned Status",
              "Joined Date",
            ].map((h) => (
              <th key={h} className="pb-3 px-3 first:pl-0 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#27272a]">
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center py-10 text-[#a1a1aa] text-sm font-medium"
              >
                No users found matching query
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-[#27272a]/20 transition-colors"
              >
                <td className="py-3 px-3 first:pl-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400 shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span
                      className="font-semibold text-[#fafafa] truncate max-w-[130px]"
                      title={u.name}
                    >
                      {u.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span
                    className="text-[#a1a1aa] truncate block max-w-[200px]"
                    title={u.email}
                  >
                    {u.email}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      (u as any).tier?.toLowerCase() === "ultra"
                        ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                        : (u as any).tier?.toLowerCase() === "pro"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-[#27272a] text-[#a1a1aa] border border-transparent"
                    }`}
                  >
                    {(u as any).tier || "free"}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      u.banned ? "text-[#ef4444]" : "text-green-500"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {u.banned ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="py-3 px-3 last:pr-0">
                  <span className="text-[#a1a1aa] font-medium font-mono text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex items-center justify-center h-full text-[#a1a1aa] text-xs font-medium">
      No activity recorded yet for this period
    </div>
  );
}
