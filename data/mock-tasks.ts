import type { Task } from "@/types/task";

export const mockTasks: Task[] = [
  {
    id: "task-001",
    projectId: "project-001",
    projectName: "Security Optimization Package",
    clientId: "client-001",
    clientName: "Digicon Ventures",
    title: "Review account access and 2FA status",
    description: "Check active accounts, device access, and two-factor authentication coverage.",
    status: "In Progress",
    priority: "High",
    dueDate: "2026-05-22",
  },
  {
    id: "task-002",
    projectId: "project-001",
    projectName: "Security Optimization Package",
    clientId: "client-001",
    clientName: "Digicon Ventures",
    title: "Prepare monthly security summary",
    status: "Todo",
    priority: "Medium",
    dueDate: "2026-05-31",
  },
  {
    id: "task-003",
    projectId: "project-002",
    projectName: "Website Planning",
    clientId: "client-002",
    clientName: "Example Startup",
    title: "Create website intake checklist",
    status: "Todo",
    priority: "Medium",
    dueDate: "2026-06-01",
  },
];