// CodexAPI Endpoint
const BASE_URL = "https://allinoneapi.codexapi.workers.dev/v1/chat/completions";

async function testCodex() {
  console.log("Testing CodexAPI connection...");

  // Test a few interesting models
  const models = [
    "gpt-5.2",
    "gpt-4.1-mini",
    "google/gemini-2.5-pro-preview-05-06",
  ];

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  // No Authorization header needed as per user request/implied free nature

  for (const model of models) {
    console.log(`\nTesting model: ${model}...`);
    const body = JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: "Hello! Who are you and what model are you running?",
        },
      ],
      stream: false,
    });

    try {
      const start = Date.now();
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: headers,
        body: body,
      });
      const duration = Date.now() - start;

      console.log(`Response Status: ${response.status} ${response.statusText}`);
      console.log(`Duration: ${duration}ms`);

      if (response.ok) {
        const json = await response.json();
        console.log("Response Content:", json.choices[0].message.content);
      } else {
        const text = await response.text();
        console.log("Error Body:", text);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }
}

testCodex();
