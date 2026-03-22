async function targetedMistralCheck() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return;

  const targets = [
    { name: "Mistral Small 24B", id: "mistralai/mistral-small-24b-instruct" },
    {
      name: "Mistral Small 3.1 24B",
      id: "mistralai/mistral-small-3.1-24b-instruct-2503",
    },
    {
      name: "Mistral Large 3 675B",
      id: "mistralai/mistral-large-3-675b-instruct-2512",
    },
    { name: "Mistral Medium 3", id: "mistralai/mistral-medium-3-instruct" },
    { name: "Ministral 14B", id: "mistralai/ministral-14b-instruct-2512" },
    { name: "Mixtral 8x7B v0.1", id: "mistralai/mixtral-8x7b-instruct-v0.1" },
    { name: "Mixtral 8x22B v0.1", id: "mistralai/mixtral-8x22b-instruct-v0.1" },
  ];

  console.log("--- NVIDIA Mistral/Mixtral Check ---");
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
}

targetedMistralCheck();
