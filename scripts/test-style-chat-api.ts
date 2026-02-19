async function testStyleChatAPI() {
  console.log("🧪 Testing Style Chat API...\n");

  const testCases = [
    {
      message: "hello",
      style: "gojo_9",
    },
    {
      message: "what is your name",
      style: "goku",
    },
    {
      message: "how are you",
      style: "ai-code",
    },
  ];

  for (const testCase of testCases) {
    console.log(
      `\n📝 Test: message="${testCase.message}", style="${testCase.style}"`,
    );
    console.log("─".repeat(60));

    try {
      console.log("📤 Sending request...");
      const startTime = Date.now();

      const response = await fetch("https://vetrex.x10.mx/api/style_chat.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: testCase.message,
          style: testCase.style,
        }),
        timeout: 30000, // 30 second timeout
      } as any);

      const duration = Date.now() - startTime;
      console.log(`⏱️  Response time: ${duration}ms`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.log(`❌ Error: ${response.statusText}`);
        const text = await response.text();
        console.log(`📄 Response body: ${text.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Success!`);
      console.log(
        `📄 Response:`,
        JSON.stringify(data, null, 2).substring(0, 300),
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error: ${errorMsg}`);
      if (error instanceof Error && error.stack) {
        console.log(`📋 Stack: ${error.stack.substring(0, 200)}`);
      }
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("✨ Test complete!");
}

testStyleChatAPI().catch(console.error);
