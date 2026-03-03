#!/usr/bin/env tsx
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { McpServerTable, UserTable } from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { generateUUID } from "../src/lib/utils";

config();

// Force unset PGHOST and other PG env vars that might conflict
delete process.env.PGHOST;
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;
delete process.env.PGPORT;

const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  console.error("❌ POSTGRES_URL not found in environment variables.");
  process.exit(1);
}

// Sanitize URL if it has the pgbouncer typo
let sanitizedUrl = postgresUrl;
if (postgresUrl.includes("?pgbouncer=true:")) {
  console.log("🛠️ Sanitizing POSTGRES_URL (moving pgbouncer param)...");
  sanitizedUrl = postgresUrl.replace("?pgbouncer=true:", ":");
  if (!sanitizedUrl.includes("?")) {
    sanitizedUrl += "?pgbouncer=true";
  } else if (!sanitizedUrl.includes("pgbouncer=true")) {
    sanitizedUrl += "&pgbouncer=true";
  }
}

const pool = new Pool({
  connectionString: sanitizedUrl,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool);

async function seedSteelMcp() {
  console.log("🌱 Seeding Steel.dev MCP server...");

  const steelApiKey = process.env.STEEL_API_KEY;
  if (!steelApiKey) {
    console.error("❌ STEEL_API_KEY not found in environment variables.");
    process.exit(1);
  }

  try {
    // Find an admin user to own this public server
    const adminUserResult = await db
      .select({ id: UserTable.id })
      .from(UserTable)
      .where(eq(UserTable.role, "admin"))
      .limit(1);

    const adminUser = adminUserResult[0];

    if (!adminUser) {
      console.warn(
        "⚠️ No admin user found. Falling back to the first available user...",
      );
      const anyUserResult = await db
        .select({ id: UserTable.id })
        .from(UserTable)
        .limit(1);
      const anyUser = anyUserResult[0];
      if (!anyUser) {
        console.error(
          "❌ No users found in database. Cannot seed MCP server (requires owner).",
        );
        process.exit(1);
      }
      await performSeed(anyUser.id);
    } else {
      await performSeed(adminUser.id);
    }
  } catch (error) {
    console.error("❌ Database query failed during seed preparation:", error);
    process.exit(1);
  }
}

async function performSeed(ownerId: string) {
  const serverName = "steel";
  const steelApiKey = process.env.STEEL_API_KEY;
  const configJson = {
    command: "npx",
    args: ["@steel-dev/mcp-server"],
    env: {
      STEEL_API_KEY: steelApiKey,
    },
  };

  try {
    const existingResult = await db
      .select()
      .from(McpServerTable)
      .where(eq(McpServerTable.name, serverName));

    const existing = existingResult[0];

    if (existing) {
      console.log(
        `🔄 Updating existing Steel MCP server (ID: ${existing.id})...`,
      );
      await db
        .update(McpServerTable)
        .set({
          config: configJson,
          visibility: "public",
          userId: ownerId,
          updatedAt: new Date(),
        } as any)
        .where(eq(McpServerTable.id, existing.id));
    } else {
      console.log(
        `✨ Creating new public Steel MCP server (Owner: ${ownerId})...`,
      );
      await db.insert(McpServerTable).values({
        id: generateUUID(),
        name: serverName,
        config: configJson,
        userId: ownerId,
        visibility: "public",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }

    console.log("✅ Steel.dev MCP server seeded successfully!");
  } catch (error) {
    console.error("❌ Error during performSeed:", error);
    throw error;
  }
}

seedSteelMcp()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("💥 Execution failed:", error);
    await pool.end();
    process.exit(1);
  });
