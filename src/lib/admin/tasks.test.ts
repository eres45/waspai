import { describe, expect, it } from "vitest";
import {
  getAdminTasks,
  createAdminTask,
  updateAdminTask,
  deleteAdminTask,
} from "./tasks";

describe("Admin Team Tasks Store", () => {
  it("fetches pre-seeded or existing admin tasks", async () => {
    const tasks = await getAdminTasks();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0]).toHaveProperty("id");
    expect(tasks[0]).toHaveProperty("title");
    expect(tasks[0]).toHaveProperty("assignedToName");
    expect(tasks[0]).toHaveProperty("status");
  });

  it("creates a new work allotment task", async () => {
    const newTask = await createAdminTask({
      title: "Unit Test Automated Verification",
      description: "Verify work assignment pipeline",
      assignedToUserId: "test-user-id",
      assignedToName: "Test Ops Admin",
      assignedToEmail: "testops@waspai.in",
      priority: "high",
      status: "pending",
      category: "ai_fleet",
      dueDate: "Tomorrow",
    });

    expect(newTask).toBeDefined();
    expect(newTask.id).toContain("task-");
    expect(newTask.title).toBe("Unit Test Automated Verification");
    expect(newTask.status).toBe("pending");
    expect(newTask.priority).toBe("high");

    const allTasks = await getAdminTasks();
    const found = allTasks.find((t) => t.id === newTask.id);
    expect(found).toBeDefined();
    expect(found?.assignedToName).toBe("Test Ops Admin");

    // Clean up
    await deleteAdminTask(newTask.id);
  });

  it("updates task status and details", async () => {
    const task = await createAdminTask({
      title: "Task To Update",
      description: "Initial description",
      assignedToUserId: "dev-1",
      assignedToName: "Dev Admin",
      assignedToEmail: "dev@waspai.in",
      priority: "medium",
      status: "pending",
      category: "general",
    });

    const updated = await updateAdminTask(task.id, {
      status: "completed",
      priority: "urgent",
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe("completed");
    expect(updated?.priority).toBe("urgent");

    // Clean up
    await deleteAdminTask(task.id);
  });

  it("deletes a task successfully", async () => {
    const task = await createAdminTask({
      title: "Task To Delete",
      description: "Will be removed",
      assignedToUserId: "dev-2",
      assignedToName: "Temporary",
      assignedToEmail: "temp@waspai.in",
      priority: "low",
      status: "pending",
      category: "general",
    });

    const deleted = await deleteAdminTask(task.id);
    expect(deleted).toBe(true);

    const allTasks = await getAdminTasks();
    const found = allTasks.find((t) => t.id === task.id);
    expect(found).toBeUndefined();
  });
});
