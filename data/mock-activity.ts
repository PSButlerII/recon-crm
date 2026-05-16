import type { Activity } from "@/types/activity";

export const mockActivity: Activity[] = [
  {
    id: "activity-001",
    clientId: "client-001",
    projectId: "project-001",
    type: "Project",
    message: "Project status changed to Active.",
    createdAt: "2026-05-10 09:30",
  },
  {
    id: "activity-002",
    clientId: "client-001",
    projectId: "project-001",
    type: "Task",
    message: "Task 'Review account access and 2FA status' moved to In Progress.",
    createdAt: "2026-05-12 13:45",
  },
  {
    id: "activity-003",
    clientId: "client-001",
    projectId: "project-001",
    type: "Note",
    message: "Added note 'Security package scope'.",
    createdAt: "2026-05-13 08:10",
  },
];