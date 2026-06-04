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
};

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

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: "👥",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
    },
    {
      label: "Chat Threads",
      value: stats.totalChats.toLocaleString(),
      icon: "💬",
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.12)",
    },
    {
      label: "Messages",
      value: stats.totalMessages.toLocaleString(),
      icon: "📨",
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.12)",
    },
    {
      label: "Agents",
      value: stats.totalAgents.toLocaleString(),
      icon: "🤖",
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
    },
    {
      label: "Workflows",
      value: stats.totalWorkflows.toLocaleString(),
      icon: "⚡",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
    },
    {
      label: "Deployed Sites",
      value: stats.totalSites.toLocaleString(),
      icon: "🌐",
      color: "#ec4899",
      bg: "rgba(236,72,153,0.12)",
    },
  ];

  const roleColors: Record<string, string> = {
    admin: "#8b5cf6",
    editor: "#3b82f6",
    user: "#6b7280",
  };

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logo}>
            <div style={s.logoIcon}>W</div>
            <div>
              <div style={s.logoTitle}>Wasp AI</div>
              <div style={s.logoSub}>Admin Panel</div>
            </div>
          </div>

          <nav style={s.nav}>
            <button
              style={{
                ...s.navItem,
                ...(tab === "overview" ? s.navActive : {}),
              }}
              onClick={() => setTab("overview")}
            >
              <span>📊</span> Overview
            </button>
            <button
              style={{ ...s.navItem, ...(tab === "users" ? s.navActive : {}) }}
              onClick={() => setTab("users")}
            >
              <span>👥</span> Users
            </button>
          </nav>
        </div>

        <div style={s.sidebarBottom}>
          <div style={s.adminBadge}>
            <div style={s.adminDot} />
            <div>
              <div style={s.adminEmail}>{adminEmail}</div>
              <div style={s.adminRole}>Super Admin</div>
            </div>
          </div>
          <button
            style={s.logoutBtn}
            onClick={handleLogout}
            disabled={isPending}
          >
            {isPending ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>
              {tab === "overview" ? "Dashboard Overview" : "User Management"}
            </h1>
            <p style={s.pageSubtitle}>
              {tab === "overview"
                ? "Real-time stats from your Wasp AI database"
                : "View and manage all registered users"}
            </p>
          </div>
          <div style={s.headerRight}>
            <div style={s.liveIndicator}>
              <div style={s.liveDot} />
              Live
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <>
            {/* Stats Grid */}
            <div style={s.statsGrid}>
              {statCards.map((c) => (
                <div key={c.label} style={s.statCard}>
                  <div
                    style={{ ...s.statIcon, background: c.bg, color: c.color }}
                  >
                    {c.icon}
                  </div>
                  <div style={s.statValue}>{c.value}</div>
                  <div style={s.statLabel}>{c.label}</div>
                  <div style={{ ...s.statAccent, background: c.color }} />
                </div>
              ))}
            </div>

            {/* Role breakdown */}
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <h2 style={s.sectionTitle}>Users by Role</h2>
              </div>
              <div style={s.roleGrid}>
                {stats.usersByRole.map((r) => (
                  <div key={r.role} style={s.roleCard}>
                    <div
                      style={{
                        ...s.roleBadge,
                        background: `${roleColors[r.role] || "#6b7280"}22`,
                        color: roleColors[r.role] || "#6b7280",
                        borderColor: `${roleColors[r.role] || "#6b7280"}44`,
                      }}
                    >
                      {r.role}
                    </div>
                    <div style={s.roleCount}>
                      {Number(r.count).toLocaleString()}
                    </div>
                    <div style={s.roleLabel}>users</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users Preview */}
            <div style={s.section}>
              <div style={s.sectionHeader}>
                <h2 style={s.sectionTitle}>Recently Joined</h2>
                <button style={s.viewAll} onClick={() => setTab("users")}>
                  View All →
                </button>
              </div>
              <UserTable users={stats.recentUsers.slice(0, 5)} />
            </div>
          </>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div style={s.section}>
            <div style={s.searchBar}>
              <span style={s.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={s.searchInput}
              />
              <span style={s.searchCount}>
                {filteredUsers.length} of {stats.recentUsers.length} users
              </span>
            </div>
            <UserTable users={filteredUsers} />
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #0d0d1a; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes livePulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }
      `}</style>
    </div>
  );
}

function UserTable({ users }: { users: User[] }) {
  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead>
          <tr>
            {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
              <th key={h} style={s.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} style={s.emptyCell}>
                No users found
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} style={s.tr}>
                <td style={s.td}>
                  <div style={s.userCell}>
                    <div style={s.avatar}>
                      {u.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span style={s.userName}>{u.name}</span>
                  </div>
                </td>
                <td style={s.td}>
                  <span style={s.emailText}>{u.email}</span>
                </td>
                <td style={s.td}>
                  <span
                    style={{
                      ...s.rolePill,
                      background:
                        u.role === "admin"
                          ? "rgba(139,92,246,0.15)"
                          : u.role === "editor"
                            ? "rgba(59,130,246,0.15)"
                            : "rgba(107,114,128,0.15)",
                      color:
                        u.role === "admin"
                          ? "#a78bfa"
                          : u.role === "editor"
                            ? "#60a5fa"
                            : "#9ca3af",
                      border: `1px solid ${
                        u.role === "admin"
                          ? "rgba(139,92,246,0.3)"
                          : u.role === "editor"
                            ? "rgba(59,130,246,0.3)"
                            : "rgba(107,114,128,0.3)"
                      }`,
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={s.td}>
                  <span
                    style={{
                      ...s.statusPill,
                      background: u.banned
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(16,185,129,0.12)",
                      color: u.banned ? "#f87171" : "#34d399",
                      border: `1px solid ${u.banned ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                    }}
                  >
                    {u.banned ? "Banned" : "Active"}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={s.dateText}>
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

const s: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "#0a0a14",
    fontFamily: "'Inter', sans-serif",
    color: "#fff",
  },
  // ── Sidebar ────────────────────────────────────────────────────────────────
  sidebar: {
    width: 240,
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 0",
    position: "sticky" as const,
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  sidebarTop: { padding: "0 16px" },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 36,
    paddingLeft: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    boxShadow: "0 4px 12px rgba(139,92,246,0.4)",
  },
  logoTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  logoSub: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  nav: { display: "flex", flexDirection: "column", gap: 4 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    borderRadius: 10,
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "all 0.15s",
    width: "100%",
  },
  navActive: {
    background: "rgba(139,92,246,0.15)",
    color: "#a78bfa",
    border: "1px solid rgba(139,92,246,0.2)",
  },
  sidebarBottom: { padding: "0 16px" },
  adminBadge: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    marginBottom: 10,
  },
  adminDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#10b981",
    flexShrink: 0,
    animation: "livePulse 2s ease-in-out infinite",
  },
  adminEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: 150,
  },
  adminRole: { fontSize: 11, color: "#8b5cf6", marginTop: 2 },
  logoutBtn: {
    width: "100%",
    padding: "9px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10,
    color: "#f87171",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  // ── Main ───────────────────────────────────────────────────────────────────
  main: {
    flex: 1,
    padding: "32px 36px",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  pageSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 20,
    color: "#34d399",
    fontSize: 13,
    fontWeight: 500,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10b981",
    animation: "livePulse 2s ease-in-out infinite",
  },
  // ── Stats ─────────────────────────────────────────────────────────────────
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "24px 20px",
    position: "relative" as const,
    overflow: "hidden",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    marginBottom: 16,
  },
  statValue: { fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 },
  statLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginTop: 6,
    fontWeight: 500,
  },
  statAccent: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.5,
  },
  // ── Section ────────────────────────────────────────────────────────────────
  section: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: "#fff" },
  viewAll: {
    background: "transparent",
    border: "none",
    color: "#8b5cf6",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
  roleGrid: { display: "flex", gap: 16, flexWrap: "wrap" as const },
  roleCard: {
    flex: 1,
    minWidth: 120,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
  },
  roleBadge: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid",
    textTransform: "capitalize" as const,
  },
  roleCount: { fontSize: 36, fontWeight: 700, color: "#fff" },
  roleLabel: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  // ── Search ─────────────────────────────────────────────────────────────────
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "10px 14px",
    marginBottom: 20,
  },
  searchIcon: { fontSize: 15, flexShrink: 0 },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: 14,
  },
  searchCount: { fontSize: 12, color: "rgba(255,255,255,0.3)", flexShrink: 0 },
  // ── Table ──────────────────────────────────────────────────────────────────
  tableWrap: { overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: {
    textAlign: "left" as const,
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    padding: "8px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
  td: { padding: "12px 12px", verticalAlign: "middle" as const },
  emptyCell: {
    textAlign: "center" as const,
    padding: "32px",
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
  },
  userCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: { fontSize: 14, fontWeight: 500, color: "#fff" },
  emailText: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  rolePill: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    textTransform: "capitalize" as const,
  },
  statusPill: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  },
  dateText: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
};
