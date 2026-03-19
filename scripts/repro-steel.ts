import Steel from "steel-sdk";
import dotenv from "dotenv";

dotenv.config();

async function testSteel() {
  const apiKey = process.env.STEEL_API_KEY;
  if (!apiKey) {
    console.error("STEEL_API_KEY missing");
    return;
  }

  const client = new Steel({
    steelAPIKey: apiKey,
  });

  try {
    console.log("Creating session...");
    const session = await client.sessions.create();
    console.log("Session created:", JSON.stringify(session, null, 2));

    // We don't need to connect with playwright for a simple SDK test
    // but we can check if retrieve works
    console.log("Retrieving session...");
    const retrieved = await client.sessions.retrieve(session.id);
    console.log("Session retrieved, status:", retrieved.status);

    console.log("Test successful!");
  } catch (error) {
    console.error("Steel SDK Error:", error);
  }
}

testSteel();
