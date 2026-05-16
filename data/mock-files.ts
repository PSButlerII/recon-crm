import type { FileRecord } from "@/types/file-record";

export const mockFiles: FileRecord[] = [
  {
    id: "file-001",
    clientId: "client-001",
    clientName: "Digicon Ventures",
    projectId: "project-001",
    projectName: "Security Optimization Package",
    name: "security-review-summary.pdf",
    type: "Document",
    size: "420 KB",
    uploadedAt: "2026-05-14",
  },
  {
    id: "file-002",
    clientId: "client-002",
    clientName: "Example Startup",
    projectId: "project-002",
    projectName: "Website Planning",
    name: "website-intake-notes.md",
    type: "Reference",
    size: "18 KB",
    uploadedAt: "2026-05-15",
  },
];