import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
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

  it("should stream Fish Audio TTS with default female voice", async () => {
    const mockAudioStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3, 4]));
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockAudioStream,
    });
    vi.stubGlobal("fetch", mockFetch);

    const request = new NextRequest("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello from Fish Audio",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(response.headers.get("Transfer-Encoding")).toBe("chunked");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.fish.audio/v1/tts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          model: "s2.1-pro-free",
        }),
        body: JSON.stringify({
          text: "Hello from Fish Audio",
          reference_id: "f7f74a4bc4324c25b96b9b6741a72ab3",
          format: "mp3",
        }),
      }),
    );

    vi.unstubAllGlobals();
  });

  it("should fall back to secondary worker when Fish Audio fails", async () => {
    const mockAudioStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([5, 6, 7, 8]));
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("fish.audio")) {
        return Promise.resolve({
          ok: false,
          status: 503,
          text: async () => "Fish Audio Busy",
        });
      }
      return Promise.resolve({
        ok: true,
        body: mockAudioStream,
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    const request = new NextRequest("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello fallback speech",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");

    // Verified fallback was called
    expect(mockFetch).toHaveBeenCalledWith(
      "https://tts-worker.llamai.workers.dev/v1/audio/speech",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          input: "Hello fallback speech",
          voice: "en-US-JennyNeural",
          model: "tts-1",
        }),
      }),
    );

    vi.unstubAllGlobals();
  });

  it("should fail over to second Fish Audio key if first key returns 402 or error", async () => {
    process.env.FISH_AUDIO_API_KEY = "test-key-1,test-key-2";

    const attemptedKeys: string[] = [];
    const mockAudioStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([9, 10, 11, 12]));
        controller.close();
      },
    });

    const mockFetch = vi
      .fn()
      .mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes("fish.audio")) {
          const auth =
            (options?.headers as Record<string, string>)?.["Authorization"] ||
            "";
          attemptedKeys.push(auth);
          if (auth.includes("test-key-1")) {
            return Promise.resolve({
              ok: false,
              status: 402,
              text: async () => "Insufficient credit",
            });
          }
          return Promise.resolve({
            ok: true,
            body: mockAudioStream,
          });
        }
        return Promise.resolve({ ok: false, status: 500 });
      });
    vi.stubGlobal("fetch", mockFetch);

    const request = new NextRequest("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify({ text: "Testing multi-key failover" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(attemptedKeys).toEqual(["Bearer test-key-1", "Bearer test-key-2"]);

    delete process.env.FISH_AUDIO_API_KEY;
    vi.unstubAllGlobals();
  });
});
