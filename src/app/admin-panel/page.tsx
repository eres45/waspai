import { redirect } from "next/navigation";
import { getAdminSession } from "lib/admin-panel/auth";
import { supabaseRest } from "lib/db/supabase-rest";
import AdminDashboard from "./AdminDashboard";

const defaultStats = {
  totalUsers: 0,
  totalChats: 0,
  totalMessages: 0,
  totalAgents: 0,
  totalWorkflows: 0,
  totalSites: 0,
  recentUsers: [] as {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    banned: boolean | null;
  }[],
  usersByRole: [] as { role: string; count: number }[],
  totalTokens: 0,
  totalApiCalls: 0,
  totalCreditsUsed: 0.0,
  subscriptions: [] as { tier: string; count: number }[],
  analytics: {
    registrations: [] as { date: string; count: number }[],
    traffic: [] as { date: string; count: number; tokens: number }[],
    models: [] as { model: string; tokens: number; count: number }[],
  },
  error: null as string | null,
};

async function getDashboardStats() {
  try {
    // 1. Fetch exact lifetime counts in parallel using metadata HEAD counts (super fast)
    const [
      { count: totalUsers },
      { count: totalChats },
      { count: totalMessages },
      { count: totalAgents },
      { count: totalWorkflows },
      { count: totalSites },
    ] = await Promise.all([
      supabaseRest.from("user").select("id", { count: "exact", head: true }),
      supabaseRest
        .from("chat_thread")
        .select("id", { count: "exact", head: true }),
      supabaseRest
        .from("chat_message")
        .select("id", { count: "exact", head: true }),
      supabaseRest.from("agent").select("id", { count: "exact", head: true }),
      supabaseRest
        .from("workflow")
        .select("id", { count: "exact", head: true }),
      supabaseRest
        .from("deployed_site")
        .select("id", { count: "exact", head: true }),
    ]);

    // 2. Fetch role counts
    const [
      { count: adminCount },
      { count: editorCount },
      { count: userCount },
    ] = await Promise.all([
      supabaseRest
        .from("user")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin"),
      supabaseRest
        .from("user")
        .select("id", { count: "exact", head: true })
        .eq("role", "editor"),
      supabaseRest
        .from("user")
        .select("id", { count: "exact", head: true })
        .eq("role", "user"),
    ]);

    // 3. Fetch subscription counts (safely fallback if SQL migration hasn't been executed yet)
    let freeCount = totalUsers ?? 0;
    let proCount = 0;
    let ultraCount = 0;

    const { count: dbFreeCount, error: subError } = await supabaseRest
      .from("user")
      .select("id", { count: "exact", head: true })
      .eq("tier", "free");

    if (!subError) {
      freeCount = dbFreeCount ?? 0;
      const [proRes, ultraRes] = await Promise.all([
        supabaseRest
          .from("user")
          .select("id", { count: "exact", head: true })
          .eq("tier", "pro"),
        supabaseRest
          .from("user")
          .select("id", { count: "exact", head: true })
          .eq("tier", "ultra"),
      ]);
      proCount = proRes.count ?? 0;
      ultraCount = ultraRes.count ?? 0;
    }

    // 4. Fetch recent users list
    const { data: recentDbUsers } = await supabaseRest
      .from("user")
      .select("id, name, email, role, created_at, banned")
      .order("created_at", { ascending: false })
      .limit(20);

    const recentUsers = (recentDbUsers || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: new Date(u.created_at),
      banned: u.banned,
    }));

    // 5. Query user signups in the last 30 days for daily analytics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isoDate = thirtyDaysAgo.toISOString();

    const { data: signups } = await supabaseRest
      .from("user")
      .select("created_at")
      .gte("created_at", isoDate)
      .order("created_at", { ascending: true });

    const signupGroup: Record<string, number> = {};
    if (signups) {
      for (const s of signups) {
        const dateStr = new Date(s.created_at).toISOString().split("T")[0];
        signupGroup[dateStr] = (signupGroup[dateStr] || 0) + 1;
      }
    }
    const registrationsOverTime = Object.entries(signupGroup).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    // 6. Query messages in the last 30 days to extract token usage, API calls, and chart metrics
    const { data: messages } = await supabaseRest
      .from("chat_message")
      .select("metadata, created_at, role")
      .gte("created_at", isoDate)
      .order("created_at", { ascending: true });

    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let totalApiCalls = 0;

    const trafficGroup: Record<string, { count: number; tokens: number }> = {};
    const modelGroup: Record<string, { tokens: number; count: number }> = {};

    if (messages) {
      for (const msg of messages) {
        const dateStr = new Date(msg.created_at).toISOString().split("T")[0];
        const isAssistant = msg.role === "assistant";

        const meta = msg.metadata as any;
        const tokens = Number(meta?.usage?.totalTokens || 0);
        const inTokens = Number(meta?.usage?.inputTokens || 0);
        const outTokens = Number(meta?.usage?.outputTokens || 0);
        const model = meta?.chatModel?.model || "unknown";

        if (isAssistant) {
          totalApiCalls++;
        }

        if (tokens > 0) {
          totalTokens += tokens;
          inputTokens += inTokens;
          outputTokens += outTokens;

          // Group daily traffic
          if (!trafficGroup[dateStr]) {
            trafficGroup[dateStr] = { count: 0, tokens: 0 };
          }
          trafficGroup[dateStr].count += 1;
          trafficGroup[dateStr].tokens += tokens;

          // Group model usage
          if (!modelGroup[model]) {
            modelGroup[model] = { tokens: 0, count: 0 };
          }
          modelGroup[model].tokens += tokens;
          modelGroup[model].count += 1;
        }
      }
    }

    const estCredits = (inputTokens * 1.5 + outputTokens * 5.0) / 1000000;

    const trafficOverTime = Object.entries(trafficGroup).map(
      ([date, data]) => ({
        date,
        count: data.count,
        tokens: data.tokens,
      }),
    );

    const modelBreakdown = Object.entries(modelGroup)
      .map(([model, data]) => ({
        model,
        tokens: data.tokens,
        count: data.count,
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10);

    return {
      totalUsers: totalUsers ?? 0,
      totalChats: totalChats ?? 0,
      totalMessages: totalMessages ?? 0,
      totalAgents: totalAgents ?? 0,
      totalWorkflows: totalWorkflows ?? 0,
      totalSites: totalSites ?? 0,
      recentUsers,
      usersByRole: [
        { role: "admin", count: adminCount ?? 0 },
        { role: "editor", count: editorCount ?? 0 },
        { role: "user", count: userCount ?? 0 },
      ],
      totalTokens,
      totalApiCalls,
      totalCreditsUsed: estCredits,
      subscriptions: [
        { tier: "free", count: freeCount },
        { tier: "pro", count: proCount },
        { tier: "ultra", count: ultraCount },
      ],
      analytics: {
        registrations: registrationsOverTime,
        traffic: trafficOverTime,
        models: modelBreakdown,
      },
      error: subError
        ? "User subscription tiers not synchronized yet. Run the SQL query in Supabase."
        : null,
    };
  } catch (err) {
    console.error("[admin-panel] getDashboardStats error:", err);
    return {
      ...defaultStats,
      error: "Could not fetch admin metrics via Supabase REST API",
    };
  }
}

export default async function AdminPanelPage() {
  const email = await getAdminSession();
  if (!email) {
    redirect("/admin-panel/login");
  }

  const stats = await getDashboardStats();

  return <AdminDashboard stats={stats} adminEmail={email} />;
}
