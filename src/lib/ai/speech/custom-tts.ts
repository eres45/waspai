/**
 * Custom TTS Provider
 * API: https://vetrex.x10.mx/api/tts.php
 * 
 * Supports 54 different voices
 */

export const CUSTOM_TTS_VOICES = [
  "adam", "aiko", "alex", "alice", "alloy", "anaya", "antonio", "aoede",
  "arjun", "bella", "daniel", "dora", "doras", "echo", "emma", "eric",
  "fable", "fenrir", "george", "gongitsune", "heart", "isabella", "jessica",
  "kabir", "kore", "kumo", "lewis", "liam", "lily", "michael", "nezumi",
  "nicola", "nicole", "noel", "nova", "onyx", "puck", "river", "riya",
  "santa", "santiago", "sara", "sarah", "siwis", "sky", "tebukuro",
  "xiaobei", "xiaoni", "xiaoxiao", "xiaoyi", "yunjian", "yunxi", "yunxia", "yunyang"
] as const;

export type CustomTTSVoice = typeof CUSTOM_TTS_VOICES[number];

// Voice language mapping
export const VOICE_LANGUAGE_MAP: Record<string, string> = {
  // English voices
  "adam": "English",
  "alex": "Spanish",
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
  
  // Other languages
  "anaya": "English",
  "dora": "Portuguese",
  "doras": "Portuguese",
  "fenrir": "Icelandic",
  "heart": "English",
  "noel": "French",
  "santa": "English",
  "siwis": "French",
};

/**
 * Get voice display name with language
 */
export function getVoiceDisplayName(voice: CustomTTSVoice): string {
  const language = VOICE_LANGUAGE_MAP[voice] || "Unknown";
  return `${voice} [${language}]`;
}

interface TTSResponse {
  success: boolean;
  audio_url?: string;
  error?: string;
}

/**
 * Generate speech from text using custom TTS API (via backend proxy)
 */
export async function generateSpeech(
  text: string,
  voice: CustomTTSVoice = "nova"
): Promise<string> {
  try {
    // Use backend proxy to avoid CORS issues
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const data: TTSResponse = await response.json();

    if (!data.success || !data.audio_url) {
      throw new Error(data.error || "Failed to generate speech");
    }

    return data.audio_url;
  } catch (error) {
    console.error("TTS generation error:", error);
    throw error;
  }
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
