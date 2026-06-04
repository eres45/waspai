"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  error: string | null;
};

const STAT_CARDS = (stats: Stats) => [
  { label: "Total Users", value: stats.totalUsers, icon: "👥" },
  { label: "Chat Threads", value: stats.totalChats, icon: "💬" },
  { label: "Messages", value: stats.totalMessages, icon: "📨" },
  { label: "Agents", value: stats.totalAgents, icon: "🤖" },
  { label: "Workflows", value: stats.totalWorkflows, icon: "⚡" },
  { label: "Deployed Sites", value: stats.totalSites, icon: "🌐" },
];

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "▪" },
  { id: "users", label: "Users", icon: "▪" },
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
  const [tab, setTab] = useState<"overview" | "users">("overview");

  const filtered = stats.recentUsers.filter(
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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col justify-between py-4 sticky top-0 h-screen">
        {/* Top */}
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-4 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shrink-0">
              W
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground leading-none">
                Wasp AI
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Admin Panel
              </p>
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
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <span className="text-[10px]">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="px-2 space-y-2">
          {/* Admin info */}
          <div className="px-3 py-2.5 rounded-lg bg-sidebar-accent/50">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {adminEmail}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground pl-3.5">
              Super Admin
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors text-left disabled:opacity-60"
          >
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">
            {tab === "overview" ? "Overview" : "Users"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tab === "overview"
              ? "Live stats from your Wasp AI database"
              : "All registered users"}
          </p>
        </div>

        {/* DB error banner */}
        {stats.error && (
          <div className="mb-4 flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">
            ⚠ {stats.error}
          </div>
        )}

        {/* ── Overview Tab ──────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              {STAT_CARDS(stats).map((c) => (
                <div
                  key={c.label}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <p className="text-2xl mb-1">{c.icon}</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {c.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Role breakdown */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Users by Role
              </h2>
              <div className="flex gap-3">
                {stats.usersByRole.map((r) => (
                  <div
                    key={r.role}
                    className="flex-1 bg-muted/50 rounded-lg p-3 text-center"
                  >
                    <RoleBadge role={r.role} />
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-2">
                      {Number(r.count)}
                    </p>
                    <p className="text-xs text-muted-foreground">users</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent users */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Recently Joined
                </h2>
                <button
                  onClick={() => setTab("users")}
                  className="text-xs text-primary hover:underline"
                >
                  View all →
                </button>
              </div>
              <UsersTable users={stats.recentUsers.slice(0, 5)} />
            </div>
          </div>
        )}

        {/* ── Users Tab ─────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="bg-card border border-border rounded-xl p-4">
            {/* Search */}
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 mb-4">
              <svg
                className="w-4 h-4 text-muted-foreground shrink-0"
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
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <span className="text-xs text-muted-foreground shrink-0">
                {filtered.length}/{stats.recentUsers.length}
              </span>
            </div>
            <UsersTable users={filtered} />
          </div>
        )}
      </main>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-primary/15 text-primary border border-primary/30",
    editor: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    user: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[role] ?? styles.user}`}
    >
      {role}
    </span>
  );
}

function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {["User", "Email", "Role", "Status", "Joined"].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-medium text-muted-foreground pb-2 px-2 first:pl-0 last:pr-0 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="text-center py-8 text-muted-foreground text-sm"
              >
                No users found
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 first:pl-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="font-medium text-foreground truncate max-w-[120px]">
                      {u.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="text-muted-foreground truncate block max-w-[180px]">
                    {u.email}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <RoleBadge role={u.role} />
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      u.banned ? "text-destructive" : "text-green-500"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {u.banned ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="py-3 px-2 last:pr-0">
                  <span className="text-muted-foreground">
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
