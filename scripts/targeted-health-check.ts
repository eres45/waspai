async function targetedCheck() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return;

  const targets = [
    { name: "ChatGLM3 6B", id: "thudm/chatglm3-6b" },
    { name: "Solar 10.7B", id: "upstage/solar-10.7b-instruct" },
    { name: "Baichuan 2 13B", id: "baichuan-inc/baichuan2-13b-chat" },
  ];

  console.log("--- NVIDIA Target Check ---");
  for (const t of targets) {
    try {
      const res = await fetch(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: t.id,
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1,
          }),
        },
      );
      console.log(
        `${t.name}: ${res.status === 200 ? "✅ ONLINE" : "❌ " + res.status}`,
      );
    } catch (_e) {
      console.log(`${t.name}: ⚠️ ERROR`);
    }
  }

  // Check AIHubMix targets via the worker
  const aihubTargets = [
    { name: "Step 3.5 Flash", id: "step-3.5-flash-free" },
    { name: "Mimo v2 Flash", id: "mimo-v2-flash-free" },
  ];

  console.log("\n--- AIHubMix Target Check ---");
  for (const t of aihubTargets) {
    try {
      const res = await fetch(
        "https://aihubmix-worker.llamai.workers.dev/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: t.id,
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1,
          }),
        },
      );
      console.log(
        `${t.name}: ${res.status === 200 ? "✅ ONLINE" : "❌ " + res.status}`,
      );
    } catch (_e) {
      console.log(`${t.name}: ⚠️ ERROR`);
    }
  }
}

targetedCheck();
