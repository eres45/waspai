import { supabaseRest } from "../../src/lib/db/supabase-rest";
import { config } from "dotenv";

config();

async function cleanup() {
  console.log("Cleaning up test data...");

  try {
    const testEmailPatterns = [
      "playwright", // Dynamically created playwright users
      "example.com", // Test signup users
      "temp-test.", // Temporary test users
    ];

    for (const pattern of testEmailPatterns) {
      const { data: testUsers, error: fetchError } = await supabaseRest
        .from("user")
        .select("id")
        .like("email", `%${pattern}%`);

      if (fetchError || !testUsers) {
        continue;
      }

      console.log(
        `Found ${testUsers.length} test users matching pattern ${pattern} to clean up`,
      );

      for (const user of testUsers) {
        console.log(`Cleaning up user: ${user.id}`);

        // Delete related data using REST API
        await supabaseRest.from("chat_thread").delete().eq("user_id", user.id);
        await supabaseRest.from("bookmark").delete().eq("user_id", user.id);
        await supabaseRest.from("agent").delete().eq("user_id", user.id);
        await supabaseRest.from("session").delete().eq("user_id", user.id);
        await supabaseRest.from("user").delete().eq("id", user.id);
      }
    }

    console.log("Test data cleaned up successfully");
  } catch (error) {
    console.error("Error cleaning up test data:", error);
  }
}

export default cleanup;
