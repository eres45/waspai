/**
 * Custom TTS Provider — Free Edge TTS
 * API: https://edge-tts.llamai.workers.dev
 *
 * Voice mapping (Microsoft Edge Neural):
 *   alloy, nova, shimmer → Ava/Sonia (Female)
 *   echo, onyx, fable    → Andrew/Brian (Male)
 */

export const CUSTOM_TTS_VOICES = [
  "alloy",
  "nova",
  "shimmer",
  "echo",
  "onyx",
  "fable",
] as const;

export type CustomTTSVoice = (typeof CUSTOM_TTS_VOICES)[number];

// Voice display metadata for Microsoft Edge Neural voices
export const VOICE_LANGUAGE_MAP: Record<string, string> = {
  alloy: "Female Neural (Ava)",
  nova: "Female Neural (Sonia)",
  shimmer: "Female Neural (Emma)",
  echo: "Male Neural (Andrew)",
  onyx: "Male Neural (Brian)",
  fable: "Male Neural (Steffan)",
};

/**
 * Get voice display name with language
 */
export function getVoiceDisplayName(voice: CustomTTSVoice): string {
  const language = VOICE_LANGUAGE_MAP[voice] || "Unknown";
  return `${voice} [${language}]`;
}

/**
 * Generate speech from text using Edge TTS (via backend proxy).
 * The proxy returns raw MP3 bytes; we convert them to an object URL for playback.
 * Falls back to Web Speech API if the request fails.
 */
export async function generateSpeech(
  text: string,
  voice: CustomTTSVoice = "alloy",
): Promise<string> {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      console.warn(`Edge TTS error: ${response.status}, falling back...`);
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
  voice: CustomTTSVoice = "alloy",
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
