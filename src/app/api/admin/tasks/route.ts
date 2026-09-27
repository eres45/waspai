import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission } from "@/lib/auth/permissions";
import {
  getAdminTasks,
  createAdminTask,
  updateAdminTask,
  deleteAdminTask,
  TaskPriority,
  TaskStatus,
  TaskCategory,
} from "@/lib/admin/tasks";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAdmin = await hasAdminPermission();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required." },
        { status: 401 },
      );
    }

    const tasks = await getAdminTasks();
    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    logger.error("[AdminTasksAPI] Error getting tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin tasks." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await hasAdminPermission();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      title,
      description,
      assignedToUserId,
      assignedToName,
      assignedToEmail,
      assignedToImage,
      priority = "medium",
      status = "pending",
      category = "general",
      dueDate,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Task title is required." },
        { status: 400 },
      );
    }

    if (!assignedToName || typeof assignedToName !== "string") {
      return NextResponse.json(
        { error: "Assignee name is required." },
        { status: 400 },
      );
    }

    const newTask = await createAdminTask({
      title: title.trim(),
      description: (description || "").trim(),
      assignedToUserId: assignedToUserId || "unassigned",
      assignedToName: assignedToName.trim(),
      assignedToEmail: (assignedToEmail || "").trim(),
      assignedToImage: assignedToImage || null,
      priority: (priority as TaskPriority) || "medium",
      status: (status as TaskStatus) || "pending",
      category: (category as TaskCategory) || "general",
      dueDate: dueDate || "Upcoming",
    });

    logger.info(
      `[AdminTasksAPI] Created task ${newTask.id}: "${newTask.title}" assigned to ${newTask.assignedToName}`,
    );

    return NextResponse.json({
      success: true,
      task: newTask,
      message: `Work "${newTask.title}" allotted to ${newTask.assignedToName} successfully!`,
    });
  } catch (error) {
    logger.error("[AdminTasksAPI] Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await hasAdminPermission();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { id, ...updates } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Task ID is required for update." },
        { status: 400 },
      );
    }

    const updated = await updateAdminTask(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: `Task with ID ${id} not found.` },
        { status: 404 },
      );
    }

    logger.info(`[AdminTasksAPI] Updated task ${id}`);
    return NextResponse.json({
      success: true,
      task: updated,
      message: "Task updated successfully.",
    });
  } catch (error) {
    logger.error("[AdminTasksAPI] Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await hasAdminPermission();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required in query params." },
        { status: 400 },
      );
    }

    const deleted = await deleteAdminTask(id);
    if (!deleted) {
      return NextResponse.json(
        { error: `Task with ID ${id} not found.` },
        { status: 404 },
      );
    }

    logger.info(`[AdminTasksAPI] Deleted task ${id}`);
    return NextResponse.json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    logger.error("[AdminTasksAPI] Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task." },
      { status: 500 },
    );
  }
}
