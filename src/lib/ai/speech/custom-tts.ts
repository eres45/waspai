/**
 * Custom TTS Provider — LOVO TTS Worker
 * API: https://lovo-tts.llamai.workers.dev
 *
 * Voice mapping:
 *   alloy, nova, shimmer → Chloe (Female US)
 *   echo, onyx, fable    → Thomas (Male US)
 */

export const CUSTOM_TTS_VOICES = [
  "fish-female",
  "fish-male",
  "en-US-JennyNeural",
  "en-US-GuyNeural",
  "alloy",
  "nova",
  "shimmer",
  "echo",
  "onyx",
  "fable",
  "sarvam-shubh",
  "sarvam-bulbul",
  "sarvam-aswarth",
  "sarvam-karthik",
  "sarvam-deepika",
  "sarvam-lata",
] as const;

export type CustomTTSVoice = (typeof CUSTOM_TTS_VOICES)[number];

// Voice display metadata for worker voices
export const VOICE_LANGUAGE_MAP: Record<string, string> = {
  "fish-female": "Female Natural (Fish Audio - Default)",
  "fish-male": "Male Natural (Fish Audio)",
  "en-US-JennyNeural": "Female US (Jenny)",
  "en-US-GuyNeural": "Male US (Guy)",
  alloy: "Female US (Legacy)",
  nova: "Female US (Legacy)",
  shimmer: "Female US (Legacy)",
  echo: "Male US (Legacy)",
  onyx: "Male US (Legacy)",
  fable: "Male US (Legacy)",
  "sarvam-shubh": "Male IN (Hindi/English - Shubh)",
  "sarvam-bulbul": "Female IN (Hindi/English - Bulbul)",
  "sarvam-aswarth": "Male IN (Telugu/English - Aswarth)",
  "sarvam-karthik": "Male IN (Tamil/English - Karthik)",
  "sarvam-deepika": "Female IN (Kannada/English - Deepika)",
  "sarvam-lata": "Female IN (Marathi/English - Lata)",
};

/**
 * Get voice display name with language
 */
export function getVoiceDisplayName(voice: CustomTTSVoice): string {
  const language = VOICE_LANGUAGE_MAP[voice] || "Unknown";
  return `${voice} [${language}]`;
}

/**
 * Clean markdown, think tags, and code blocks to produce natural spoken speech.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
    .replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/gi, "")
    .replace(/<reasoning>[\s\S]*?(?:<\/reasoning>|$)/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, "")
    .replace(/^[ \t]*[>\-*+][ \t]+/gm, "")
    .replace(/^[ \t]*\d+\.[ \t]+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\\\([\s\S]*?\\\)/g, "")
    .replace(/\\\[[\s\S]*?\\\]/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .trim();
}

/**
 * Generate speech from text using the backend TTS route.
 * Returns an object URL for raw MP3 audio bytes.
 */
export async function generateSpeech(
  text: string,
  voice: CustomTTSVoice = "fish-female",
): Promise<string> {
  const clean = cleanTextForSpeech(text);
  if (!clean) {
    throw new Error("No speakable text provided");
  }

  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean, voice }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`TTS service error (${response.status}): ${errorText}`);
  }

  const audioBlob = await response.blob();
  if (audioBlob.size === 0) {
    throw new Error("Empty audio received from TTS service");
  }

  return URL.createObjectURL(audioBlob);
}

/**
 * Speaks text using the browser Web Speech API.
 * Handles Chrome's ~15s pause bug and provides a stop/cancel callback.
 */
export function speakWithWebSpeech(
  text: string,
  voice: CustomTTSVoice = "alloy",
  onEnd?: () => void,
  onError?: (err: any) => void,
): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onError?.(new Error("Web Speech API not available"));
    return () => {};
  }

  window.speechSynthesis.cancel();
  const clean = cleanTextForSpeech(text);
  const utterance = new SpeechSynthesisUtterance(clean);

  const voiceIndex = CUSTOM_TTS_VOICES.indexOf(voice);
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    utterance.voice = voices[Math.min(voiceIndex, voices.length - 1)];
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  let timer: any = null;

  const cleanup = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  utterance.onend = () => {
    cleanup();
    onEnd?.();
  };

  utterance.onerror = (e) => {
    cleanup();
    if (e.error !== "canceled" && e.error !== "interrupted") {
      onError?.(e);
    }
  };

  // Chrome speech synthesis freeze fix: ping every 10s so it doesn't pause after ~15s
  timer = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      cleanup();
      return;
    }
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 10000);

  window.speechSynthesis.speak(utterance);

  return () => {
    cleanup();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };
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
