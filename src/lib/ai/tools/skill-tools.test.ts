import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSkillTool } from "./skill-tools";

const mockGetSession = vi.fn();
vi.mock("auth/server", () => ({
  getSession: () => mockGetSession(),
}));

const mockSkillRepository = {
  getSkillByName: vi.fn(),
  createSkill: vi.fn(),
  installSkill: vi.fn(),
};

vi.mock("lib/db/repository", () => ({
  skillRepository: {
    getSkillByName: (...args: any[]) =>
      mockSkillRepository.getSkillByName(...args),
    createSkill: (...args: any[]) => mockSkillRepository.createSkill(...args),
    installSkill: (...args: any[]) => mockSkillRepository.installSkill(...args),
  },
}));

describe("createSkillTool with Hermes Compounding Distillation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: "user-123", name: "Test User" },
    });
  });

  it("returns unauthorized when user is not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await (createSkillTool.execute as any)({
      name: "test-skill",
      title: "Test Skill",
      description: "Test description",
      category: "productivity",
      tags: ["test"],
      content: "Do this and that.",
      isPublic: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("distills structured procedure steps into Hermes skill with auto-detected tools", async () => {
    mockSkillRepository.getSkillByName.mockResolvedValue(null);
    mockSkillRepository.createSkill.mockImplementation(async (data) => ({
      id: "skill-xyz",
      ...data,
    }));
    mockSkillRepository.installSkill.mockResolvedValue(undefined);

    const result = await (createSkillTool.execute as any)({
      name: "competitive-analyst",
      title: "Competitive Analyst",
      description: "Extract competitor data and generate comparative PDF",
      category: "research",
      tags: ["business", "intelligence"],
      triggers: ["When user asks to analyze competitors"],
      procedure: [
        {
          step: 1,
          action: "Search for competitors using web-search",
          tool: "web-search",
          failureRecovery: "Refine query with specific company names",
        },
        {
          step: 2,
          action: "Render report with generate-pdf",
          tool: "generate-pdf",
        },
      ],
      isPublic: true,
    });

    expect(result.success).toBe(true);
    expect(result.skillId).toBe("skill-xyz");
    expect(result.toolsRequired).toContain("web-search");
    expect(result.toolsRequired).toContain("generate-pdf");

    // Verify createSkill payload
    expect(mockSkillRepository.createSkill).toHaveBeenCalledTimes(1);
    const createArg = mockSkillRepository.createSkill.mock.calls[0][0];
    expect(createArg.name).toBe("competitive-analyst");
    expect(createArg.toolsRequired).toEqual(
      expect.arrayContaining(["web-search", "generate-pdf"]),
    );
    expect(createArg.content).toContain("# Competitive Analyst");
    expect(createArg.content).toContain("## Trigger Conditions");
    expect(createArg.content).toContain("## Failure Modes & Self-Healing");

    // Verify automatic installation
    expect(mockSkillRepository.installSkill).toHaveBeenCalledWith(
      "user-123",
      "skill-xyz",
    );
  });

  it("auto-enriches unstructured raw content with Hermes standards", async () => {
    mockSkillRepository.getSkillByName.mockResolvedValue(null);
    mockSkillRepository.createSkill.mockImplementation(async (data) => ({
      id: "skill-abc",
      ...data,
    }));
    mockSkillRepository.installSkill.mockResolvedValue(undefined);

    const result = await (createSkillTool.execute as any)({
      name: "qr-flyer-creator",
      title: "QR Flyer Creator",
      description: "Makes marketing flyers with QR codes",
      category: "media",
      tags: ["flyer", "marketing"],
      content:
        "First run qr-code-generator to make the code, then format markdown.",
      isPublic: true,
    });

    expect(result.success).toBe(true);
    expect(result.toolsRequired).toContain("qr-code-generator");

    const createArg = mockSkillRepository.createSkill.mock.calls[0][0];
    expect(createArg.content).toContain("---");
    expect(createArg.content).toContain(
      "## Failure Modes & Self-Healing (Reflective Recovery)",
    );
    expect(createArg.content).toContain("## Verification Checklist");
  });

  it("handles already existing skill gracefully by ensuring installation", async () => {
    mockSkillRepository.getSkillByName.mockResolvedValue({
      id: "existing-123",
      name: "existing-skill",
      title: "Existing Skill",
    });
    mockSkillRepository.installSkill.mockResolvedValue(undefined);

    const result = await (createSkillTool.execute as any)({
      name: "existing-skill",
      title: "Existing Skill",
      description: "Already exists",
      category: "productivity",
      tags: ["test"],
      content: "Already existing instructions.",
      isPublic: true,
    });

    expect(result.success).toBe(true);
    expect(result.skillId).toBe("existing-123");
    expect(result.message).toContain("already registered");
    expect(mockSkillRepository.createSkill).not.toHaveBeenCalled();
    expect(mockSkillRepository.installSkill).toHaveBeenCalledWith(
      "user-123",
      "existing-123",
    );
  });
});
