import pg from "pg";
const { Client } = pg;

// Using the confirmed working configuration: Port 6543 (Pooler) + New Password
const connectionString =
  "postgresql://postgres:ronit21070576@db.lextckftnxwejmoggqxg.supabase.co:6543/postgres?pgbouncer=true";

console.log(
  "Testing connection to:",
  connectionString.replace(/:[^:@]*@/, ":****@"),
);

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  try {
    console.log("⏳ Connecting...");
    await client.connect();
    console.log("✅ Connection successful!");

    const res = await client.query(
      "SELECT NOW() as time, current_user as user",
    );
    console.log("Query result:", res.rows[0]);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed details:");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    await client.end();
    process.exit(1);
  }
}

test();
