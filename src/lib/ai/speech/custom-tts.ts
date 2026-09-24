/**
 * Custom TTS Provider — Fish Audio (Primary HD), Woino Neural (Indic & Multilingual),
 * LLAMAI Studio (OpenAI fallback), and Sarvam AI.
 */

import { WOINO_VOICES, getWoinoVoice } from "./woino-voices";

export interface VoiceOption {
  id: string;
  name: string;
  provider: "fish" | "woino" | "openai" | "sarvam";
  category: string;
  language: string;
  gender: "female" | "male" | "neutral";
  badge?: string;
  isDefault?: boolean;
}

export const BASE_TTS_VOICES = [
  "fish-female",
  "fish-male",
  "woino",
  "woino-female",
  "woino-male",
  "woino-aditi",
  "woino-aarush",
  "woino-magnus",
  "woino-aanya",
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

export const WOINO_VOICE_IDS_WITH_PREFIX = WOINO_VOICES.map(
  (v) => `woino-${v.id}`,
);

export const CUSTOM_TTS_VOICES = [
  ...BASE_TTS_VOICES,
  ...WOINO_VOICE_IDS_WITH_PREFIX,
] as const;

export type CustomTTSVoice = (typeof CUSTOM_TTS_VOICES)[number] | string;

// Voice display metadata for worker voices
export const VOICE_LANGUAGE_MAP: Record<string, string> = {
  "fish-female": "Natural Female",
  "fish-male": "Natural Male",
  woino: "Aditi",
  "woino-female": "Aditi",
  "woino-male": "Aarush",
  "woino-aditi": "Aditi",
  "woino-aarush": "Aarush",
  "woino-magnus": "Magnus",
  "woino-aanya": "Aanya",
  "en-US-JennyNeural": "Jenny",
  "en-US-GuyNeural": "Guy",
  alloy: "Alloy",
  nova: "Nova",
  shimmer: "Shimmer",
  echo: "Echo",
  onyx: "Onyx",
  fable: "Fable",
  "sarvam-shubh": "Shubh",
  "sarvam-bulbul": "Bulbul",
  "sarvam-aswarth": "Aswarth",
  "sarvam-karthik": "Karthik",
  "sarvam-deepika": "Deepika",
  "sarvam-lata": "Lata",
};

/**
 * Get voice display name with language
 */
export function getVoiceDisplayName(voice: string): string {
  if (VOICE_LANGUAGE_MAP[voice]) {
    return VOICE_LANGUAGE_MAP[voice];
  }
  const wv = getWoinoVoice(voice);
  if (wv) {
    const lang = wv.lang.charAt(0).toUpperCase() + wv.lang.slice(1);
    return `${wv.name} (${lang})`;
  }
  return voice;
}

export function getAllVoiceOptions(): VoiceOption[] {
  const options: VoiceOption[] = [
    {
      id: "fish-female",
      name: "Natural Female",
      provider: "fish",
      category: "Featured",
      language: "Multilingual / English / Hindi",
      gender: "female",
      badge: "Recommended",
      isDefault: true,
    },
    {
      id: "fish-male",
      name: "Natural Male",
      provider: "fish",
      category: "Featured",
      language: "Multilingual / English / Hindi",
      gender: "male",
      badge: "HD",
    },
    {
      id: "woino",
      name: "Aditi",
      provider: "woino",
      category: "Featured",
      language: "Hindi / English",
      gender: "female",
      badge: "Popular",
    },
    {
      id: "woino-male",
      name: "Aarush",
      provider: "woino",
      category: "Featured",
      language: "Hindi / English",
      gender: "male",
    },
    {
      id: "woino-magnus",
      name: "Magnus",
      provider: "woino",
      category: "Featured",
      language: "English",
      gender: "male",
      badge: "English HD",
    },
    {
      id: "en-US-JennyNeural",
      name: "Jenny",
      provider: "openai",
      category: "English",
      language: "English (US)",
      gender: "female",
    },
    {
      id: "en-US-GuyNeural",
      name: "Guy",
      provider: "openai",
      category: "English",
      language: "English (US)",
      gender: "male",
    },
    {
      id: "nova",
      name: "Nova",
      provider: "openai",
      category: "English",
      language: "English (US)",
      gender: "female",
      badge: "Expressive",
    },
    {
      id: "alloy",
      name: "Alloy",
      provider: "openai",
      category: "English",
      language: "English (US)",
      gender: "female",
    },
    {
      id: "shimmer",
      name: "Shimmer",
      provider: "openai",
      category: "English",
      language: "English (US)",
      gender: "female",
    },
    {
      id: "echo",
      name: "Echo",
      provider: "openai",
      category: "English",
      language: "English (US)",
      gender: "male",
    },
    {
      id: "onyx",
      name: "Onyx",
      provider: "openai",
      category: "English",
      language: "English (US)",
      gender: "male",
    },
    {
      id: "fable",
      name: "Fable",
      provider: "openai",
      category: "English",
      language: "English (UK)",
      gender: "male",
    },
    {
      id: "sarvam-shubh",
      name: "Shubh",
      provider: "sarvam",
      category: "Hindi",
      language: "Hindi / English",
      gender: "male",
    },
    {
      id: "sarvam-bulbul",
      name: "Bulbul",
      provider: "sarvam",
      category: "Hindi",
      language: "Hindi / English",
      gender: "female",
    },
    {
      id: "sarvam-aswarth",
      name: "Aswarth",
      provider: "sarvam",
      category: "Telugu",
      language: "Telugu / English",
      gender: "male",
    },
    {
      id: "sarvam-karthik",
      name: "Karthik",
      provider: "sarvam",
      category: "Tamil",
      language: "Tamil / English",
      gender: "male",
    },
    {
      id: "sarvam-deepika",
      name: "Deepika",
      provider: "sarvam",
      category: "Kannada",
      language: "Kannada / English",
      gender: "female",
    },
    {
      id: "sarvam-lata",
      name: "Lata",
      provider: "sarvam",
      category: "Marathi",
      language: "Marathi / English",
      gender: "female",
    },
  ];

  for (const v of WOINO_VOICES) {
    const lang = v.lang.charAt(0).toUpperCase() + v.lang.slice(1);
    options.push({
      id: `woino-${v.id}`,
      name: v.name,
      provider: "woino",
      category: `${lang} Voices`,
      language: lang,
      gender: v.gender,
    });
  }

  return options;
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

function selectWebSpeechVoice(
  requestedVoice: string,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const lower = (requestedVoice || "").toLowerCase();
  const isMale = [
    "male",
    "guy",
    "david",
    "mark",
    "echo",
    "onyx",
    "fable",
    "aarush",
    "magnus",
    "shubh",
    "aswarth",
    "karthik",
    "bruno",
  ].some((k) => lower.includes(k));

  let targetLangPrefix = "en";
  if (
    lower.includes("hi") ||
    lower.includes("hindi") ||
    lower.includes("aditi") ||
    lower.includes("aarush") ||
    lower.includes("shubh") ||
    lower.includes("bulbul")
  ) {
    targetLangPrefix = "hi";
  } else if (lower.includes("te") || lower.includes("aswarth")) {
    targetLangPrefix = "te";
  } else if (lower.includes("ta") || lower.includes("karthik")) {
    targetLangPrefix = "ta";
  } else if (lower.includes("kn") || lower.includes("deepika")) {
    targetLangPrefix = "kn";
  } else if (lower.includes("mr") || lower.includes("lata")) {
    targetLangPrefix = "mr";
  }

  // 1. Try finding voices matching target language
  const matchingLangVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(targetLangPrefix),
  );

  if (matchingLangVoices.length > 0) {
    if (isMale) {
      const maleVoice = matchingLangVoices.find((v) =>
        /male|david|mark|guy|george|james|natural male/i.test(v.name),
      );
      if (maleVoice) return maleVoice;
    } else {
      const femaleVoice = matchingLangVoices.find((v) =>
        /female|zira|jenny|samantha|susan|karen|aria|natural female/i.test(
          v.name,
        ),
      );
      if (femaleVoice) return femaleVoice;
    }
    return matchingLangVoices.find((v) => v.default) || matchingLangVoices[0];
  }

  // 2. If target language voice not found, fall back strictly to English (en).
  // NEVER select a Japanese or random locale voice!
  const englishVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith("en"),
  );

  if (englishVoices.length > 0) {
    if (isMale) {
      const maleVoice = englishVoices.find((v) =>
        /male|david|mark|guy/i.test(v.name),
      );
      if (maleVoice) return maleVoice;
    } else {
      const femaleVoice = englishVoices.find((v) =>
        /female|zira|jenny|samantha|aria/i.test(v.name),
      );
      if (femaleVoice) return femaleVoice;
    }
    return englishVoices.find((v) => v.default) || englishVoices[0];
  }

  return voices.find((v) => v.default) || voices[0];
}

/**
 * Speaks text using the browser Web Speech API.
 * Handles Chrome's ~15s pause bug and provides a stop/cancel callback.
 */
export function speakWithWebSpeech(
  text: string,
  voice: CustomTTSVoice = "fish-female",
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

  const voices = window.speechSynthesis.getVoices();
  const selectedVoiceObj = selectWebSpeechVoice(voice, voices);
  if (selectedVoiceObj) {
    utterance.voice = selectedVoiceObj;
    utterance.lang = selectedVoiceObj.lang;
  } else {
    utterance.lang = "en-US";
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
