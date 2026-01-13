const instances = [
  "https://inv.nadeko.net",
  "https://yewtu.be",
  "https://invidious.privacyredirect.com",
  "https://invidious.nerdvpn.de",
  "https://invidious.snopyta.org",
  "https://invidious.ggc-project.de",
  "https://invidious.13ad.de",
  "https://invidious.toot.koeln",
  "https://invidious.fdn.fr",
  "https://invidiou.site",
  "https://vid.mint.lgbt",
  "https://invidious.site",
  "https://invidious.tube",
  "https://invidious.xyz",
  "https://y.com.sb",
];

async function testInstances() {
  console.log("Testing Invidious Instances...");
  const working: string[] = [];

  for (const instance of instances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const start = Date.now();
      const res = await fetch(`${instance}/api/v1/search?q=test&type=video`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latency = Date.now() - start;

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ ${instance} - OK (${latency}ms)`);
          working.push(instance);
        } else {
          console.log(`❌ ${instance} - Invalid Data`);
        }
      } else {
        console.log(`❌ ${instance} - HTTP ${res.status}`);
      }
    } catch (e: any) {
      console.log(`❌ ${instance} - Error: ${e.message}`);
    }
  }

  console.log("\nWorking Instances JSON:");
  console.log(JSON.stringify(working, null, 2));
}

testInstances();
