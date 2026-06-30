import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "lib/admin-panel/auth";
import { supabaseRest } from "lib/db/supabase-rest";
import { supabaseAuth } from "lib/auth/supabase-auth";

export async function POST(request: NextRequest) {
  const email = await getAdminSession();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, userId, value } = await request.json();

  if (!userId || !action) {
    return NextResponse.json(
      { error: "Missing userId or action" },
      { status: 400 },
    );
  }

  try {
    switch (action) {
      case "delete": {
        // Delete from Supabase Auth first
        await supabaseAuth.auth.admin.deleteUser(userId);
        // Also delete from public user table
        await supabaseRest.from("user").delete().eq("id", userId);
        return NextResponse.json({
          success: true,
          message: "User deleted successfully",
        });
      }

      case "ban": {
        const { error } = await supabaseRest
          .from("user")
          .update({ banned: true })
          .eq("id", userId);
        if (error) throw error;
        return NextResponse.json({ success: true, message: "User banned" });
      }

      case "unban": {
        const { error } = await supabaseRest
          .from("user")
          .update({ banned: false })
          .eq("id", userId);
        if (error) throw error;
        return NextResponse.json({ success: true, message: "User unbanned" });
      }

      case "setRole": {
        if (!["user", "admin", "editor"].includes(value)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        const { error } = await supabaseRest
          .from("user")
          .update({ role: value })
          .eq("id", userId);
        if (error) throw error;
        return NextResponse.json({
          success: true,
          message: `Role set to ${value}`,
        });
      }

      case "setTier": {
        if (!["free", "pro", "ultra"].includes(value)) {
          return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }
        const { error } = await supabaseRest
          .from("user")
          .update({
            tier: value,
            tier_expires_at:
              value === "free"
                ? null
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", userId);
        if (error) throw error;
        return NextResponse.json({
          success: true,
          message: `Tier set to ${value}`,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[admin-panel] user action error:", err);
    return NextResponse.json(
      { error: err?.message || "Action failed" },
      { status: 500 },
    );
  }
}

// GET: fetch paginated users with search
export async function GET(request: NextRequest) {
  const email = await getAdminSession();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const tier = searchParams.get("tier") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    let query = supabaseRest
      .from("user")
      .select(
        "id, name, email, role, created_at, banned, tier, referral_count, referred_by",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq("role", role);
    }

    if (tier) {
      query = query.eq("tier", tier);
    }

    if (status === "banned") {
      query = query.eq("banned", true);
    } else if (status === "active") {
      query = query.or("banned.eq.false,banned.is.null");
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ users: data || [], total: count || 0 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch users" },
      { status: 500 },
    );
  }
}
