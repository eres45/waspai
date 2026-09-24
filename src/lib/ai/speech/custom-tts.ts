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
  "fish-female": "Female Natural (Fish Audio - Default)",
  "fish-male": "Male Natural (Fish Audio)",
  woino: "Aditi [Female, Hindi (Woino Neural - Default)]",
  "woino-female": "Aditi [Female, Hindi (Woino Neural)]",
  "woino-male": "Aarush [Male, Hindi (Woino Neural)]",
  "woino-aditi": "Aditi [Female, Hindi (Neural)]",
  "woino-aarush": "Aarush [Male, Hindi (Neural)]",
  "woino-magnus": "Magnus [Male, English (Neural)]",
  "woino-aanya": "Aanya [Female, Hindi (Neural)]",
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
export function getVoiceDisplayName(voice: string): string {
  if (VOICE_LANGUAGE_MAP[voice]) {
    return VOICE_LANGUAGE_MAP[voice];
  }
  const wv = getWoinoVoice(voice);
  if (wv) {
    const lang = wv.lang.charAt(0).toUpperCase() + wv.lang.slice(1);
    const gender = wv.gender === "female" ? "Female" : "Male";
    return `${wv.name} [${gender}, ${lang} (Neural)]`;
  }
  return voice;
}

export function getAllVoiceOptions(): VoiceOption[] {
  const options: VoiceOption[] = [
    {
      id: "fish-female",
      name: "Natural Female (Fish Audio)",
      provider: "fish",
      category: "Fish Audio (HD)",
      language: "Multilingual / Hindi / English",
      gender: "female",
      badge: "Default",
      isDefault: true,
    },
    {
      id: "fish-male",
      name: "Natural Male (Fish Audio)",
      provider: "fish",
      category: "Fish Audio (HD)",
      language: "Multilingual / Hindi / English",
      gender: "male",
      badge: "HD",
    },
    {
      id: "woino",
      name: "Woino Neural (Aditi - Sweet)",
      provider: "woino",
      category: "Woino Neural",
      language: "Hindi / English",
      gender: "female",
      badge: "Woino",
    },
    {
      id: "woino-male",
      name: "Woino Neural (Aarush - Natural)",
      provider: "woino",
      category: "Woino Neural",
      language: "Hindi / English",
      gender: "male",
      badge: "Woino",
    },
    {
      id: "nova",
      name: "Nova (Conversational)",
      provider: "openai",
      category: "OpenAI / LLAMAI",
      language: "English (US)",
      gender: "female",
      badge: "Fast",
    },
    {
      id: "alloy",
      name: "Alloy",
      provider: "openai",
      category: "OpenAI / LLAMAI",
      language: "English (US)",
      gender: "neutral",
    },
    {
      id: "shimmer",
      name: "Shimmer",
      provider: "openai",
      category: "OpenAI / LLAMAI",
      language: "English (US)",
      gender: "female",
    },
    {
      id: "echo",
      name: "Echo",
      provider: "openai",
      category: "OpenAI / LLAMAI",
      language: "English (US)",
      gender: "male",
    },
    {
      id: "onyx",
      name: "Onyx",
      provider: "openai",
      category: "OpenAI / LLAMAI",
      language: "English (US)",
      gender: "male",
    },
    {
      id: "fable",
      name: "Fable",
      provider: "openai",
      category: "OpenAI / LLAMAI",
      language: "English (UK)",
      gender: "male",
    },
    {
      id: "en-US-JennyNeural",
      name: "Jenny",
      provider: "openai",
      category: "OpenAI / LLAMAI",
      language: "English (US)",
      gender: "female",
    },
    {
      id: "en-US-GuyNeural",
      name: "Guy",
      provider: "openai",
      category: "OpenAI / LLAMAI",
      language: "English (US)",
      gender: "male",
    },
    {
      id: "sarvam-shubh",
      name: "Shubh",
      provider: "sarvam",
      category: "Sarvam AI",
      language: "Hindi / English",
      gender: "male",
      badge: "Indic",
    },
    {
      id: "sarvam-bulbul",
      name: "Bulbul",
      provider: "sarvam",
      category: "Sarvam AI",
      language: "Hindi / English",
      gender: "female",
      badge: "Indic",
    },
    {
      id: "sarvam-aswarth",
      name: "Aswarth",
      provider: "sarvam",
      category: "Sarvam AI",
      language: "Telugu / English",
      gender: "male",
      badge: "Indic",
    },
    {
      id: "sarvam-karthik",
      name: "Karthik",
      provider: "sarvam",
      category: "Sarvam AI",
      language: "Tamil / English",
      gender: "male",
      badge: "Indic",
    },
    {
      id: "sarvam-deepika",
      name: "Deepika",
      provider: "sarvam",
      category: "Sarvam AI",
      language: "Kannada / English",
      gender: "female",
      badge: "Indic",
    },
    {
      id: "sarvam-lata",
      name: "Lata",
      provider: "sarvam",
      category: "Sarvam AI",
      language: "Marathi / English",
      gender: "female",
      badge: "Indic",
    },
  ];

  for (const v of WOINO_VOICES) {
    const lang = v.lang.charAt(0).toUpperCase() + v.lang.slice(1);
    options.push({
      id: `woino-${v.id}`,
      name: v.name,
      provider: "woino",
      category: `Woino Neural (${lang})`,
      language: lang,
      gender: v.gender,
      badge: `${lang} Neural`,
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
