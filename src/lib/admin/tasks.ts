import fs from "fs";
import path from "path";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskCategory =
  | "ai_fleet"
  | "support"
  | "infrastructure"
  | "billing"
  | "security"
  | "general";

export interface AdminTeamTask {
  id: string;
  title: string;
  description: string;
  assignedToUserId: string;
  assignedToName: string;
  assignedToEmail: string;
  assignedToImage?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const TASKS_FILE = path.join(DATA_DIR, "admin-tasks.json");

const SEED_TASKS: AdminTeamTask[] = [
  {
    id: "task-101",
    title: "Monitor AI Fleet Latency & Provider Failovers",
    description:
      "Verify OpenAI, Anthropic, and Groq health endpoints; ensure multi-key rotation and automated failover are triggering within < 800ms.",
    assignedToUserId: "admin-lead",
    assignedToName: "Lead Ops Admin",
    assignedToEmail: "admin@waspai.in",
    priority: "high",
    status: "in_progress",
    category: "ai_fleet",
    dueDate: "Today",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "task-102",
    title: "Verify Payment Webhooks & Pro Subscriptions",
    description:
      "Cross-examine Razorpay & Stripe subscription lifecycle events, instant tier upgrades, and automated invoice emailing.",
    assignedToUserId: "admin-billing",
    assignedToName: "Billing Specialist",
    assignedToEmail: "billing@waspai.in",
    priority: "urgent",
    status: "completed",
    category: "billing",
    dueDate: "Completed",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "task-103",
    title: "Audit High-Velocity User Queries & Spam Limits",
    description:
      "Inspect rate limit telemetry across anonymous and free tier chat sessions to prevent abusive scraping and token exhaustion.",
    assignedToUserId: "admin-sec",
    assignedToName: "Security Officer",
    assignedToEmail: "security@waspai.in",
    priority: "medium",
    status: "pending",
    category: "security",
    dueDate: "Tomorrow",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "task-104",
    title: "Triage Support Tickets & Model Hallucination Reports",
    description:
      "Review user-flagged chat messages, evaluate model accuracy regressions, and update system prompt instructions if necessary.",
    assignedToUserId: "admin-support",
    assignedToName: "Customer Success",
    assignedToEmail: "support@waspai.in",
    priority: "high",
    status: "in_progress",
    category: "support",
    dueDate: "In 2 days",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "task-105",
    title: "Optimize Vector Index & Document Upload Queues",
    description:
      "Verify PGVector similarity indexing performance on multi-megabyte PDF and code uploads in the ecosystem hub.",
    assignedToUserId: "admin-infra",
    assignedToName: "Infra Engineer",
    assignedToEmail: "infra@waspai.in",
    priority: "low",
    status: "pending",
    dueDate: "Next week",
    category: "infrastructure",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

let inMemoryTasks: AdminTeamTask[] | null = null;

function ensureStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TASKS_FILE)) {
      fs.writeFileSync(
        TASKS_FILE,
        JSON.stringify(SEED_TASKS, null, 2),
        "utf-8",
      );
      inMemoryTasks = [...SEED_TASKS];
    }
  } catch (err) {
    console.error("[AdminTasks] Storage init warning:", err);
  }
}

export async function getAdminTasks(): Promise<AdminTeamTask[]> {
  try {
    ensureStorage();
    if (fs.existsSync(TASKS_FILE)) {
      const content = fs.readFileSync(TASKS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        inMemoryTasks = parsed;
        return inMemoryTasks;
      }
    }
  } catch (err) {
    console.error("[AdminTasks] Error reading tasks file:", err);
  }

  if (!inMemoryTasks) {
    inMemoryTasks = [...SEED_TASKS];
  }
  return inMemoryTasks;
}

export async function saveAdminTasks(tasks: AdminTeamTask[]): Promise<boolean> {
  inMemoryTasks = tasks;
  try {
    ensureStorage();
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[AdminTasks] Error saving tasks file:", err);
    return false;
  }
}

export async function createAdminTask(
  data: Omit<AdminTeamTask, "id" | "createdAt" | "updatedAt">,
): Promise<AdminTeamTask> {
  const current = await getAdminTasks();
  const newTask: AdminTeamTask = {
    ...data,
    id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newTask, ...current];
  await saveAdminTasks(updated);
  return newTask;
}

export async function updateAdminTask(
  id: string,
  updates: Partial<Omit<AdminTeamTask, "id" | "createdAt">>,
): Promise<AdminTeamTask | null> {
  const current = await getAdminTasks();
  const index = current.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updatedTask: AdminTeamTask = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedTask;
  await saveAdminTasks(current);
  return updatedTask;
}

export async function deleteAdminTask(id: string): Promise<boolean> {
  const current = await getAdminTasks();
  const filtered = current.filter((t) => t.id !== id);
  if (filtered.length === current.length) return false;

  await saveAdminTasks(filtered);
  return true;
}
