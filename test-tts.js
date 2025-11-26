// Test TTS endpoint
const testTTS = async () => {
  try {
    console.log("Testing TTS endpoint...");
    const response = await fetch("https://trywaspai.vercel.app/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "Hello world, this is a test of the text to speech system",
        voice: "nova",
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers));

    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (data.success && data.audio_url) {
      console.log("✅ TTS SUCCESS!");
      console.log("Audio URL:", data.audio_url.substring(0, 100) + "...");
    } else {
      console.log("❌ TTS FAILED");
      console.log("Error:", data.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testTTS();
