import { describe, it, expect } from "vitest";
import {
  CUSTOM_TTS_VOICES,
  BASE_TTS_VOICES,
  getVoiceDisplayName,
  getAllVoiceOptions,
} from "./custom-tts";
import { isWoinoVoice, getWoinoVoice } from "./woino-voices";

describe("Custom TTS & Voice Call", () => {
  it("includes all base and Woino neural voices in CUSTOM_TTS_VOICES", () => {
    expect(CUSTOM_TTS_VOICES.length).toBeGreaterThan(220);
    expect(CUSTOM_TTS_VOICES).toContain("fish-female");
    expect(CUSTOM_TTS_VOICES).toContain("fish-male");
    expect(CUSTOM_TTS_VOICES).toContain("woino-aditi");
    expect(CUSTOM_TTS_VOICES).toContain("woino-magnus");
    expect(CUSTOM_TTS_VOICES).toContain("nova");
    expect(CUSTOM_TTS_VOICES).toContain("sarvam-shubh");
  });

  it("correctly identifies and looks up Woino voices", () => {
    expect(isWoinoVoice("woino-aditi")).toBe(true);
    expect(isWoinoVoice("aditi")).toBe(true);
    expect(isWoinoVoice("woino-magnus")).toBe(true);
    expect(isWoinoVoice("fish-female")).toBe(false);

    const aditi = getWoinoVoice("woino-aditi");
    expect(aditi).toBeDefined();
    expect(aditi?.name).toBe("Aditi");
    expect(aditi?.lang).toBe("hindi");
    expect(aditi?.gender).toBe("female");
  });

  it("formats display names properly for all voice types", () => {
    expect(getVoiceDisplayName("fish-female")).toContain(
      "Fish Audio - Default",
    );
    expect(getVoiceDisplayName("woino-aditi")).toBe(
      "Aditi [Female, Hindi (Neural)]",
    );
    expect(getVoiceDisplayName("woino-magnus")).toBe(
      "Magnus [Male, English (Neural)]",
    );
    expect(getVoiceDisplayName("sarvam-shubh")).toContain("Shubh");
  });

  it("returns organized voice options with categories and badges", () => {
    const options = getAllVoiceOptions();
    expect(options.length).toBeGreaterThan(220);

    const fishFemale = options.find((v) => v.id === "fish-female");
    expect(fishFemale?.isDefault).toBe(true);
    expect(fishFemale?.provider).toBe("fish");

    const aditi = options.find((v) => v.id === "woino-aditi");
    expect(aditi?.provider).toBe("woino");
    expect(aditi?.language).toBe("Hindi");
    expect(aditi?.badge).toBe("Hindi Neural");

    const nova = options.find((v) => v.id === "nova");
    expect(nova?.provider).toBe("openai");
  });
});
