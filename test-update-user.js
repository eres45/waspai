const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" }); // Try .env.local first
require("dotenv").config(); // Then .env

async function testUpdate() {
  console.log("Testing updateUser with pure JS...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. Get a user
    const { data: users, error: listError } = await supabase
      .from("user")
      .select("id")
      .limit(1);

    if (listError) {
      console.error("List error:", listError);
      return;
    }

    if (!users || users.length === 0) {
      console.log("No users found to test update.");
      return;
    }

    const userId = users[0].id;
    console.log("Updating user:", userId);

    // 2. Try update
    const { data, error } = await supabase
      .from("user")
      .update({
        updated_at: new Date().toISOString(),
        // image: "https://example.com/check.png" // Commented out to test basic update first
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Update failed:", error);
    } else {
      console.log("Update success:", data);
    }
  } catch (error) {
    console.error("Test failed with exception:", error);
  }
}

testUpdate();
