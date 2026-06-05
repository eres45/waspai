import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("STT API Proxy Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 503 if SARVAM_API_KEY is not set", async () => {
    const originalApiKey = process.env.SARVAM_API_KEY;
    delete process.env.SARVAM_API_KEY;

    // Create request with simple form data
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["mock-audio-data"], { type: "audio/wav" }),
      "test.wav",
    );

    const request = new NextRequest("http://localhost/api/stt", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Speech-to-Text key not configured");

    process.env.SARVAM_API_KEY = originalApiKey;
  });

  it("should fail with 400 if no file is uploaded", async () => {
    process.env.SARVAM_API_KEY = "test-key";

    const formData = new FormData();
    formData.append("model", "saaras:v3");

    const request = new NextRequest("http://localhost/api/stt", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("No audio file provided");
  });

  it("should parse file and call Sarvam STT API successfully", async () => {
    process.env.SARVAM_API_KEY = "test-key";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transcript: "namaste dosto",
        language_code: "hi-IN",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["mock-audio-bytes"], { type: "audio/wav" }),
      "test.wav",
    );
    formData.append("model", "saaras:v3");
    formData.append("language_code", "hi-IN");

    const request = new NextRequest("http://localhost/api/stt", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.transcript).toBe("namaste dosto");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.sarvam.ai/speech-to-text",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "api-subscription-key": "test-key",
        }),
      }),
    );

    vi.unstubAllGlobals();
  });

  describe("GET Configuration Endpoint", () => {
    it("should return enabled: false when SARVAM_API_KEY is not configured", async () => {
      const originalApiKey = process.env.SARVAM_API_KEY;
      delete process.env.SARVAM_API_KEY;

      const response = await GET();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.enabled).toBe(false);

      process.env.SARVAM_API_KEY = originalApiKey;
    });

    it("should return enabled: true when SARVAM_API_KEY is configured", async () => {
      const originalApiKey = process.env.SARVAM_API_KEY;
      process.env.SARVAM_API_KEY = "test-sarvam-key-active";

      const response = await GET();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.enabled).toBe(true);

      process.env.SARVAM_API_KEY = originalApiKey;
    });
  });
});
