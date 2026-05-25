import { config } from "dotenv";
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function check() {
  console.log("Checking Supabase tables...\n");

  // 1. List users to get a valid UUID
  const { data: users, error: userError } = await supabase
    .from("user")
    .select("id, email")
    .limit(5);

  if (userError) {
    console.error(
      "❌ Error querying user table:",
      JSON.stringify(userError, null, 2),
    );
  } else {
    console.log("✅ User table. Count:", users.length);
    if (users.length > 0) {
      console.log("First user:", users[0]);
    }
  }

  // 2. Check skill table exists
  const { data: skills, error: skillError } = await supabase
    .from("skill")
    .select("*")
    .limit(3);

  if (skillError) {
    console.error(
      "❌ Error querying skill table:",
      JSON.stringify(skillError, null, 2),
    );
    console.error(
      "Code:",
      skillError.code,
      "Message:",
      skillError.message,
      "Details:",
      skillError.details,
      "Hint:",
      skillError.hint,
    );
  } else {
    console.log("✅ Skill table exists. Count:", skills.length);
    if (skills.length > 0) {
      console.log("First skill columns:", Object.keys(skills[0]));
    }
  }

  // 3. Try inserting a test skill
  if (users && users.length > 0) {
    const userId = users[0].id;
    console.log("\nTesting skill insert with author_id:", userId);

    const { randomUUID } = await import("crypto");
    const testId = randomUUID();
    console.log("Test ID:", testId);
    const { data: inserted, error: insertError } = await supabase
      .from("skill")
      .insert({
        id: testId,
        name: "debug-test-skill-" + Date.now(),
        title: "Debug Test Skill",
        description: "Testing DB insert",
        content: "# Test\n\nThis is a test skill.",
        category: "other",
        tags: ["test"],
        author_id: userId,
        is_public: false,
        is_verified: false,
        is_featured: false,
        install_count: 0,
        icon: "🔧",
        tools_required: [],
        tier_required: "free",
        version: "1.0.0",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "❌ Skill insert FAILED:",
        JSON.stringify(insertError, null, 2),
      );
      console.error(
        "Code:",
        insertError.code,
        "Message:",
        insertError.message,
        "Details:",
        insertError.details,
        "Hint:",
        insertError.hint,
      );
    } else {
      console.log("✅ Skill insert SUCCESS. ID:", inserted.id);
      // cleanup
      await supabase.from("skill").delete().eq("id", inserted.id);
      console.log("Cleaned up test skill");
    }
  }
}

check().catch(console.error);
