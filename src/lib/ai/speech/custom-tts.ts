/**
 * Custom TTS Provider
 * API: https://vetrex.x10.mx/api/tts.php
 *
 * Supports 54 different voices
 */

export const CUSTOM_TTS_VOICES = [
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
] as const;

export type CustomTTSVoice = (typeof CUSTOM_TTS_VOICES)[number];

// Voice language mapping
export const VOICE_LANGUAGE_MAP: Record<string, string> = {
  // English voices
  adam: "English",
  alex: "Spanish",
  alice: "English",
  alloy: "English",
  bella: "English",
  daniel: "English",
  echo: "English",
  emma: "English",
  eric: "English",
  fable: "English",
  george: "English",
  isabella: "English",
  jessica: "English",
  lewis: "English",
  liam: "English",
  lily: "English",
  michael: "English",
  nicola: "English",
  nicole: "English",
  nova: "English",
  onyx: "English",
  puck: "English",
  river: "English",
  sara: "English",
  sarah: "English",
  sky: "English",

  // Chinese voices
  xiaobei: "Chinese",
  xiaoni: "Chinese",
  xiaoxiao: "Chinese",
  xiaoyi: "Chinese",
  yunjian: "Chinese",
  yunxi: "Chinese",
  yunxia: "Chinese",
  yunyang: "Chinese",

  // Japanese voices
  tebukuro: "Japanese",
  gongitsune: "Japanese",
  aoede: "Japanese",
  kore: "Japanese",
  kumo: "Japanese",
  nezumi: "Japanese",

  // Spanish/Portuguese voices
  antonio: "Spanish",
  santiago: "Spanish",

  // Indian voices
  arjun: "Hindi",
  kabir: "Hindi",
  riya: "Hindi",

  // Other languages
  anaya: "English",
  dora: "Portuguese",
  doras: "Portuguese",
  fenrir: "Icelandic",
  heart: "English",
  noel: "French",
  santa: "English",
  siwis: "French",
};

/**
 * Get voice display name with language
 */
export function getVoiceDisplayName(voice: CustomTTSVoice): string {
  const language = VOICE_LANGUAGE_MAP[voice] || "Unknown";
  return `${voice} [${language}]`;
}

/**
 * Generate speech from text using LOVO TTS Worker (via backend proxy).
 * The proxy returns raw MP3 bytes; we convert them to an object URL for playback.
 * Falls back to Web Speech API if the request fails.
 */
export async function generateSpeech(
  text: string,
  voice: CustomTTSVoice = "nova",
): Promise<string> {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      console.warn(`LOVO TTS error: ${response.status}, falling back...`);
      return generateSpeechFallback(text, voice);
    }

    // The proxy returns raw audio bytes (audio/mpeg)
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error("TTS generation error:", error);
    return generateSpeechFallback(text, voice);
  }
}

/**
 * Fallback TTS using Web Speech API (client-side)
 * Creates a data URL with audio data
 */
function generateSpeechFallback(
  text: string,
  voice: CustomTTSVoice = "nova",
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Check if Web Speech API is available
      const SpeechSynthesisUtterance =
        typeof window !== "undefined" && window.SpeechSynthesisUtterance
          ? window.SpeechSynthesisUtterance
          : null;

      if (!SpeechSynthesisUtterance) {
        reject(new Error("Web Speech API not available"));
        return;
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Map custom voice to Web Speech voice
      const voiceIndex = CUSTOM_TTS_VOICES.indexOf(voice);
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[Math.min(voiceIndex, voices.length - 1)];
      }

      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      // For fallback, we'll return a data URL that represents the speech
      // This is a workaround - ideally we'd record the audio, but that requires more setup
      const audioDataUrl = `data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==`;

      // Speak the text (for immediate playback)
      window.speechSynthesis.speak(utterance);

      // Return the data URL
      resolve(audioDataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Play audio from URL
 */
export async function playAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Failed to play audio"));
    audio.play().catch(reject);
  });
}
