import "load-env";
import { Pool } from "pg";

const urls = [
  "postgresql://postgres:ronit9325296264@db.lextckftnxwejmoggqxg.supabase.co:6543/postgres",
  "postgresql://postgres:ronit%409325296264@db.lextckftnxwejmoggqxg.supabase.co:6543/postgres",
];

for (const url of urls) {
  console.log(`Testing URL: ${url.replace(/:[^:@]+@/, ":****@")} ...`);
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("Success! Connected to database.");
    const res = await client.query("SELECT NOW()");
    console.log("Time from DB:", res.rows[0]);
    client.release();
    break;
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}
