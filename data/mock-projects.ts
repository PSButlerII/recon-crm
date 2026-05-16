import type { Project } from "@/types/project";

export const mockProjects: Project[] = [
  {
    id: "project-001",
    clientId: "client-001",
    clientName: "Digicon Ventures",
    name: "Security Optimization Package",
    description: "Ongoing security review, device access control, and account protection.",
    status: "Active",
    priority: "High",
    progress: 65,
    startDate: "2026-01-01",
    dueDate: "2026-12-31",
  },
  {
    id: "project-002",
    clientId: "client-002",
    clientName: "Example Startup",
    name: "Website Planning",
    description: "Initial discovery and planning for a small business website.",
    status: "Planning",
    priority: "Medium",
    progress: 15,
    startDate: "2026-05-10",
    dueDate: "2026-06-15",
  },
  {
    id: "project-003",
    clientId: "client-003",
    clientName: "Rah's Twisted Kitchen",
    name: "Website Development",
    description: "Development of the company's new website.",
    status: "Active",
    priority: "High",
    progress: 40,
    startDate: "2026-05-14",
    dueDate: "2026-08-15",
  }
];