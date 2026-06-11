import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("auth/server", () => ({
  getSession: vi.fn(),
}));

vi.mock("lib/db/repository", () => ({
  workflowRepository: {
    selectAll: vi.fn(),
    save: vi.fn(),
    checkAccess: vi.fn(),
  },
}));

vi.mock("lib/auth/permissions", () => ({
  canCreateWorkflow: vi.fn(),
  canEditWorkflow: vi.fn(),
}));

import { getSession } from "auth/server";
import { workflowRepository } from "lib/db/repository";
import { canCreateWorkflow } from "lib/auth/permissions";

describe("Workflow API POST endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const request = new Request("http://localhost/api/workflow", {
      method: "POST",
      body: JSON.stringify({ name: "Test Workflow" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  it("should return 403 if canCreateWorkflow is false", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "pro" },
    } as any);
    vi.mocked(canCreateWorkflow).mockResolvedValue(false);

    const request = new Request("http://localhost/api/workflow", {
      method: "POST",
      body: JSON.stringify({ name: "Test Workflow" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe("You don't have permission to create workflows");
  });

  it("should return 403 tier restriction for free users", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "free" },
    } as any);
    vi.mocked(canCreateWorkflow).mockResolvedValue(true);

    const request = new Request("http://localhost/api/workflow", {
      method: "POST",
      body: JSON.stringify({ name: "Test Workflow" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toContain("Workflows are a Pro/Ultra feature");
  });

  it("should return 403 limit warning for pro users exceeding 5 workflows", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "pro" },
    } as any);
    vi.mocked(canCreateWorkflow).mockResolvedValue(true);
    vi.mocked(workflowRepository.selectAll).mockResolvedValue([
      { id: "wf1" },
      { id: "wf2" },
      { id: "wf3" },
      { id: "wf4" },
      { id: "wf5" },
    ] as any);

    const request = new Request("http://localhost/api/workflow", {
      method: "POST",
      body: JSON.stringify({ name: "Test Workflow" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toContain("reached the limit of 5 workflows");
  });

  it("should allow pro users to create if under limit", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "pro" },
    } as any);
    vi.mocked(canCreateWorkflow).mockResolvedValue(true);
    vi.mocked(workflowRepository.selectAll).mockResolvedValue([
      { id: "wf1" },
      { id: "wf2" },
    ] as any);
    vi.mocked(workflowRepository.save).mockResolvedValue({
      id: "wf3",
      name: "Test",
    } as any);

    const request = new Request("http://localhost/api/workflow", {
      method: "POST",
      body: JSON.stringify({ name: "Test Workflow" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe("wf3");
    expect(workflowRepository.save).toHaveBeenCalled();
  });

  it("should allow ultra users unlimited workflows", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", tier: "ultra" },
    } as any);
    vi.mocked(canCreateWorkflow).mockResolvedValue(true);
    vi.mocked(workflowRepository.save).mockResolvedValue({
      id: "wf10",
      name: "Test",
    } as any);

    const request = new Request("http://localhost/api/workflow", {
      method: "POST",
      body: JSON.stringify({ name: "Test Workflow" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(workflowRepository.save).toHaveBeenCalled();
    expect(workflowRepository.selectAll).not.toHaveBeenCalled();
  });
});
