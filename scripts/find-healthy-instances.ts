async function findHealthyInstances() {
  console.log("Fetching official instance list...");
  try {
    const res = await fetch(
      "https://api.invidious.io/instances.json?sort_by=health",
    );
    if (!res.ok) throw new Error("Failed to fetch instance list");

    const db = await res.json();
    const candidates: string[] = [];

    // db is [[domain, data], ...]
    for (const entry of db) {
      const uri = entry[0];
      const data = entry[1];

      if (
        data.type === "https" &&
        data.monitor &&
        data.monitor.uptime > 80 &&
        !data.monitor.down
      ) {
        // Use the URI from data or construct it
        const url = data.uri || `https://${uri}`;
        candidates.push(url);
      }
    }

    console.log(`Found ${candidates.length} candidates. Testing...`);

    // Shuffle and test 20
    const working: string[] = [];
    const toTest = candidates.sort(() => 0.5 - Math.random()).slice(0, 20);

    for (const instance of toTest) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const start = Date.now();
        const searchRes = await fetch(
          `${instance}/api/v1/search?q=test&type=video`,
          {
            signal: controller.signal,
          },
        );
        clearTimeout(timeoutId);

        if (searchRes.ok) {
          const data = await searchRes.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log(`✅ ${instance} - OK (${Date.now() - start}ms)`);
            working.push(instance);
          }
        } else {
          console.log(`❌ ${instance} - HTTP ${searchRes.status}`);
        }
      } catch (_e) {
        // console.log(`❌ ${instance} - Error`);
      }
    }

    console.log("\nVerified Working Instances:");
    console.log(JSON.stringify(working, null, 2));
  } catch (err) {
    console.error("Script failed:", err);
  }
}

findHealthyInstances();
