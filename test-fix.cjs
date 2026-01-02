
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function testFix() {
  console.log("Testing Read-Modify-Write Fix...");
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Get a user
    const { data: users } = await supabase.from("user").select("id").limit(1);
    if (!users || users.length === 0) return;
    const userId = users[0].id;
    console.log("Target User:", userId);

    // 2. Fetch FULL user data
    const { data: currentUser, error: fetchError } = await supabase
        .from("user")
        .select("*")
        .eq("id", userId)
        .single();
    
    if (fetchError) {
        console.error("Fetch failed:", fetchError);
        return;
    }

    // 3. Merge updates (simulating updateUserDetails with just image)
    const updates = { image: "https://example.com/fixed-avatar.png", updated_at: new Date().toISOString() };
    const mergedUser = { ...currentUser, ...updates };

    // 4. Upsert with FULL object (bypassing partial update limits)
    console.log("Attempting full upsert...");
    const { data: updateResult, error: updateError } = await supabase
        .from("user")
        .upsert(mergedUser, { onConflict: "id" })
        .select()
        .single();

    if (updateError) {
        console.error("Upsert failed:", updateError);
    } else {
        console.log("Upsert success! Image:", updateResult.image);
    }

  } catch (error) {
    console.error("Exception:", error);
  }
}

testFix();
