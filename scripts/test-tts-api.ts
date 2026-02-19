async function testTTSAPI() {
  console.log("🧪 Testing Custom TTS API\n");

  const testCases = [
    {
      name: "Test 1: Simple text with nova voice",
      text: "Hello, this is a test",
      voice: "nova",
    },
    {
      name: "Test 2: Arabic text with alloy voice",
      text: "مرحبا، هذا اختبار",
      voice: "alloy",
    },
    {
      name: "Test 3: Different voice - echo",
      text: "Testing different voice",
      voice: "echo",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`${testCase.name}`);
    console.log(`Text: "${testCase.text}"`);
    console.log(`Voice: ${testCase.voice}`);
    console.log("-".repeat(80));

    try {
      const response = await fetch("https://vetrex.x10.mx/api/tts.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: testCase.text,
          voice: testCase.voice,
        }),
      });

      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get("content-type")}`);

      if (response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("audio")) {
          const buffer = await response.arrayBuffer();
          console.log(`✅ Audio received: ${buffer.byteLength} bytes`);
          console.log(`Audio format: ${contentType}`);
        } else if (contentType?.includes("json")) {
          const data = await response.json();
          console.log("✅ JSON Response:");
          console.log(JSON.stringify(data, null, 2));
        } else {
          const text = await response.text();
          console.log("✅ Text Response:");
          console.log(text.substring(0, 200));
        }
      } else {
        const text = await response.text();
        console.log(`❌ Error: ${text.substring(0, 200)}`);
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✨ TTS API Test Complete!");
  console.log("\nAvailable Voices:");
  const voices = [
    "adam",
    "aiko",
    "alex",
    "alice",
    "alloy",
    "anaya",
    "antonio",
    "aoede",
    "arjun",
    "bella",
    "daniel",
    "dora",
    "doras",
    "echo",
    "emma",
    "eric",
    "fable",
    "fenrir",
    "george",
    "gongitsune",
    "heart",
    "isabella",
    "jessica",
    "kabir",
    "kore",
    "kumo",
    "lewis",
    "liam",
    "lily",
    "michael",
    "nezumi",
    "nicola",
    "nicole",
    "noel",
    "nova",
    "onyx",
    "puck",
    "river",
    "riya",
    "santa",
    "santiago",
    "sara",
    "sarah",
    "siwis",
    "sky",
    "tebukuro",
    "xiaobei",
    "xiaoni",
    "xiaoxiao",
    "xiaoyi",
    "yunjian",
    "yunxi",
    "yunxia",
    "yunyang",
  ];
  console.log(`Total: ${voices.length} voices`);
  console.log(voices.join(", "));
}

testTTSAPI().catch(console.error);
