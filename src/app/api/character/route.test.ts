import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("auth/server", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/db/repository", () => ({
  characterRepository: {
    getCharactersByUserId: vi.fn(),
    createCharacter: vi.fn(),
  },
}));

vi.mock("lib/utils", () => ({
  generateUUID: () => "mock-uuid",
}));

import { getSession } from "auth/server";
import { characterRepository } from "@/lib/db/repository";

describe("Character API POST endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/character", {
      method: "POST",
      body: JSON.stringify({
        name: "Test",
        description: "Desc",
        personality: "Pers",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 400 if missing required fields", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "free" },
    } as any);
    const request = new NextRequest("http://localhost/api/character", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Missing required fields");
  });

  it("should return 403 limit warning for free users exceeding 2 agents", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "free" },
    } as any);
    vi.mocked(characterRepository.getCharactersByUserId).mockResolvedValue([
      { id: "char1" },
      { id: "char2" },
    ] as any);

    const request = new NextRequest("http://localhost/api/character", {
      method: "POST",
      body: JSON.stringify({
        name: "Test",
        description: "Desc",
        personality: "Pers",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe("Limit reached");
    expect(json.message).toContain("limit of 2 custom agents");
  });

  it("should return 403 limit warning for pro users exceeding 7 agents", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "pro" },
    } as any);
    vi.mocked(characterRepository.getCharactersByUserId).mockResolvedValue([
      { id: "c1" },
      { id: "c2" },
      { id: "c3" },
      { id: "c4" },
      { id: "c5" },
      { id: "c6" },
      { id: "c7" },
    ] as any);

    const request = new NextRequest("http://localhost/api/character", {
      method: "POST",
      body: JSON.stringify({
        name: "Test",
        description: "Desc",
        personality: "Pers",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe("Limit reached");
    expect(json.message).toContain("limit of 7 custom agents");
  });

  it("should allow free users to create if under limit", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "free" },
    } as any);
    vi.mocked(characterRepository.getCharactersByUserId).mockResolvedValue([
      { id: "char1" },
    ] as any);
    vi.mocked(characterRepository.createCharacter).mockResolvedValue({
      id: "char2",
      name: "Test",
    } as any);

    const request = new NextRequest("http://localhost/api/character", {
      method: "POST",
      body: JSON.stringify({
        name: "Test",
        description: "Desc",
        personality: "Pers",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.name).toBe("Test");
    expect(characterRepository.createCharacter).toHaveBeenCalled();
  });

  it("should allow ultra users unlimited agents", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "ultra" },
    } as any);
    vi.mocked(characterRepository.createCharacter).mockResolvedValue({
      id: "char100",
      name: "Test",
    } as any);

    const request = new NextRequest("http://localhost/api/character", {
      method: "POST",
      body: JSON.stringify({
        name: "Test",
        description: "Desc",
        personality: "Pers",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(characterRepository.createCharacter).toHaveBeenCalled();
    expect(characterRepository.getCharactersByUserId).not.toHaveBeenCalled();
  });
});
