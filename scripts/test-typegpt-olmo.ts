async function testTypeGPT() {
  const apiKey = process.env.TYPEGPT_API_KEY;
  if (!apiKey) {
    console.log("No TYPEGPT_API_KEY found.");
    return;
  }

  const response = await fetch("https://typegpt.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "allenai/OLMo-2-0325-32B-Instruct",
      messages: [{ role: "user", content: "Hello" }],
      stream: false,
    }),
  });

  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);
}

testTypeGPT();
