/**
 * Test TTS API voices to determine their languages
 */

const CUSTOM_TTS_VOICES = [
  "adam", "aiko", "alex", "alice", "alloy", "anaya", "antonio", "aoede",
  "arjun", "bella", "daniel", "dora", "doras", "echo", "emma", "eric",
  "fable", "fenrir", "george", "gongitsune", "heart", "isabella", "jessica",
  "kabir", "kore", "kumo", "lewis", "liam", "lily", "michael", "nezumi",
  "nicola", "nicole", "noel", "nova", "onyx", "puck", "river", "riya",
  "santa", "santiago", "sara", "sarah", "siwis", "sky", "tebukuro",
  "xiaobei", "xiaoni", "xiaoxiao", "xiaoyi", "yunjian", "yunxi", "yunxia", "yunyang"
];

// Language mapping based on voice names and common TTS conventions
const VOICE_LANGUAGES: Record<string, string> = {
  // English voices
  "adam": "English",
  "alex": "English",
  "alice": "English",
  "alloy": "English",
  "bella": "English",
  "daniel": "English",
  "echo": "English",
  "emma": "English",
  "eric": "English",
  "fable": "English",
  "george": "English",
  "isabella": "English",
  "jessica": "English",
  "lewis": "English",
  "liam": "English",
  "lily": "English",
  "michael": "English",
  "nicola": "English",
  "nicole": "English",
  "nova": "English",
  "onyx": "English",
  "puck": "English",
  "river": "English",
  "sara": "English",
  "sarah": "English",
  "sky": "English",
  
  // Chinese voices
  "xiaobei": "Chinese",
  "xiaoni": "Chinese",
  "xiaoxiao": "Chinese",
  "xiaoyi": "Chinese",
  "yunjian": "Chinese",
  "yunxi": "Chinese",
  "yunxia": "Chinese",
  "yunyang": "Chinese",
  
  // Japanese voices
  "tebukuro": "Japanese",
  "gongitsune": "Japanese",
  "aoede": "Japanese",
  "kore": "Japanese",
  "kumo": "Japanese",
  "nezumi": "Japanese",
  
  // Spanish/Portuguese voices
  "antonio": "Spanish",
  "santiago": "Spanish",
  
  // Indian voices
  "arjun": "Hindi",
  "kabir": "Hindi",
  "riya": "Hindi",
  
  // Other/Unknown
  "anaya": "Unknown",
  "dora": "Unknown",
  "doras": "Unknown",
  "fenrir": "Unknown",
  "heart": "Unknown",
  "noel": "Unknown",
  "santa": "Unknown",
  "siwis": "Unknown",
  "aiko": "Japanese",
};

async function testVoices() {
  console.log("🧪 Testing TTS Voices\n");
  console.log("Testing a few voices to verify language detection...\n");

  const testVoices = ["alex", "bella", "xiaobei", "tebukuro", "arjun"];
  const testText = "Hello, this is a test";

  for (const voice of testVoices) {
    console.log(`Testing voice: ${voice}`);
    try {
      const response = await fetch("https://vetrex.x10.mx/api/tts.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: testText,
          voice: voice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${data.audio_url ? "Audio generated" : "No audio URL"}`);
      } else {
        console.log(`❌ Error: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
    console.log();
  }

  console.log("\n📋 Voice Language Mapping:\n");
  console.log("export const VOICE_LANGUAGE_MAP: Record<string, string> = {");
  
  CUSTOM_TTS_VOICES.forEach((voice) => {
    const language = VOICE_LANGUAGES[voice] || "Unknown";
    console.log(`  "${voice}": "${language}",`);
  });
  
  console.log("};\n");

  console.log("✨ Test Complete!");
}

testVoices().catch(console.error);
