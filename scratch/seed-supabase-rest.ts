import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USERS = {
  admin: {
    email: "admin@test-seed.local",
    password: "AdminPassword123!",
    name: "Test Admin User",
    role: "admin",
  },
  editor: {
    email: "editor@test-seed.local",
    password: "EditorPassword123!",
    name: "Test Editor User",
    role: "editor",
  },
  editor2: {
    email: "editor2@test-seed.local",
    password: "Editor2Password123!",
    name: "Test Editor User 2",
    role: "editor",
  },
  regular: {
    email: "user@test-seed.local",
    password: "UserPassword123!",
    name: "Test Regular User",
    role: "user",
  },
};

async function seed() {
  console.log("Starting Supabase Auth and Database Seeding...");

  // 1. List existing users in Supabase Auth to clean up or identify them
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError);
    return;
  }

  for (const [key, testUser] of Object.entries(TEST_USERS)) {
    console.log(`\nProcessing ${key} user: ${testUser.email}...`);

    // Clean up if already exists in Supabase Auth
    const existingAuthUser = users.find(u => u.email === testUser.email);

    if (existingAuthUser) {
      console.log(`User already exists in Supabase Auth (ID: ${existingAuthUser.id}). Deleting to reset...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAuthUser.id);
      if (deleteError) {
        console.error(`Failed to delete user from Supabase Auth:`, deleteError);
      }
      
      // Also delete from public.user table
      const { error: dbDeleteError } = await supabase
        .from("user")
        .delete()
        .eq("email", testUser.email);
      if (dbDeleteError) {
        console.warn("Failed to delete from database:", dbDeleteError);
      }
    }

    // Create user in Supabase Auth
    console.log("Creating user in Supabase Auth...");
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        name: testUser.name
      }
    });

    if (createError || !user) {
      console.error(`Failed to create user:`, createError);
      continue;
    }

    const userId = user.id;
    console.log(`Created user with ID: ${userId}`);

    // Create user in public.user table and set their role/tier
    console.log("Upserting into database user table...");
    const { error: dbError } = await supabase
      .from("user")
      .upsert({
        id: userId,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        tier: "free",
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: "id"
      });

    if (dbError) {
      console.error(`Database upsert failed:`, dbError);
    } else {
      console.log(`Database upsert successful!`);
    }
  }

  console.log("\nSeeding finished!");
}

seed().catch(console.error);
