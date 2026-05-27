import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TTS API Proxy Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 503 if Sarvam voice is selected but SARVAM_API_KEY is not set", async () => {
    const originalApiKey = process.env.SARVAM_API_KEY;
    delete process.env.SARVAM_API_KEY;

    const request = new NextRequest("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello world",
        voice: "sarvam-shubh",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Sarvam voice key not configured");

    process.env.SARVAM_API_KEY = originalApiKey;
  });

  it("should call Sarvam API and return audio file binary when key is configured", async () => {
    process.env.SARVAM_API_KEY = "test-sarvam-key";

    // Mock global fetch to intercept Sarvam API call
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        request_id: "test-req-id",
        audios: [
          "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=",
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const request = new NextRequest("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello Indian language speaker",
        voice: "sarvam-bulbul",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");

    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.sarvam.ai/text-to-speech",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "api-subscription-key": "test-sarvam-key",
        }),
        body: JSON.stringify({
          text: "Hello Indian language speaker",
          target_language_code: "hi-IN",
          speaker: "bulbul",
          model: "bulbul:v3",
        }),
      }),
    );

    vi.unstubAllGlobals();
  });
});
