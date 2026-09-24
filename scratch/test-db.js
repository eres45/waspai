import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

console.log("Database URL:", process.env.POSTGRES_URL);

const client = new pg.Client({
  connectionString: process.env.POSTGRES_URL,
});

async function main() {
  try {
    await client.connect();
    console.log("Connection successful!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
  } catch (err) {
    console.error("Connection failed details:", err);
  } finally {
    await client.end();
  }
}

main();
