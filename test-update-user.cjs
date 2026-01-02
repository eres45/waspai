
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function testUpdate() {
  console.log("Testing updateUser with Pure CJS...");
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
      console.error("Missing env vars:", { 
          hasUrl: !!supabaseUrl, 
          hasKey: !!supabaseKey 
      });
      return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
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

    // 2. Try update with "public.user"
    console.log("Attempting .from('public.user').update()...");
    const { data: dataPublic, error: errorPublic } = await supabase
        .from("public.user")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();
    
    if (errorPublic) {
        console.error("Update 'public.user' failed:", errorPublic);
    } else {
        console.log("Update 'public.user' success:", dataPublic);
    }

    // 3. Try upsert with "user"
    console.log("Attempting .from('user').upsert()...");
    const { data: dataUpsert, error: errorUpsert } = await supabase
        .from("user")
        .upsert({ id: userId, updated_at: new Date().toISOString() })
        .select()
        .single();

    if (errorUpsert) {
        console.error("Upsert 'user' failed:", errorUpsert);
    } else {
        console.log("Upsert 'user' success:", dataUpsert);
    }

  } catch (error) {
    console.error("Test failed with exception:", error);
  }
}

testUpdate();
