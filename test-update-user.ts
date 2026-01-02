import { userRepositoryRest } from "./src/lib/db/pg/repositories/user-repository.rest";
import * as dotenv from "dotenv";

dotenv.config();

async function testUpdate() {
  console.log("Testing updateUser...");
  try {
    // 1. Get a user
    const { data: users, error: listError } =
      await require("./src/lib/db/supabase-rest")
        .supabaseRest.from("user")
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
    const result = await userRepositoryRest.updateUserDetails({
      userId,
      image: "https://example.com/test-avatar.png",
    });

    console.log("Update success:", result);
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

testUpdate();
