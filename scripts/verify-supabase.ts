#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓" : "✗");
  process.exit(1);
}

console.log("✓ Supabase credentials found");
console.log("URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

async function verify() {
  try {
    // List buckets
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Failed to list buckets:", bucketsError);
      process.exit(1);
    }

    console.log("\n✓ Connected to Supabase Storage");
    console.log("Available buckets:");
    buckets?.forEach((bucket) => {
      console.log(
        `  - ${bucket.name} (${bucket.public ? "public" : "private"})`,
      );
    });

    // Check for uploads bucket
    const uploadsBucket = buckets?.find((b) => b.name === "uploads");
    if (!uploadsBucket) {
      console.error("\n❌ 'uploads' bucket not found!");
      console.error(
        "Please create it in Supabase Dashboard → Storage → Create Bucket",
      );
      process.exit(1);
    }

    if (!uploadsBucket.public) {
      console.error("\n❌ 'uploads' bucket is not public!");
      console.error("Please make it public in Supabase Dashboard");
      process.exit(1);
    }

    console.log("\n✓ 'uploads' bucket is public and ready!");
    console.log("\n✅ Supabase Storage is properly configured!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

verify();
