import type { Note } from "@/types/note";

export const mockNotes: Note[] = [
  {
    id: "note-001",
    clientId: "client-001",
    projectId: "project-001",
    title: "Security package scope",
    body: "Client needs ongoing security review, account protection, and device access checks.",
    type: "Decision",
    createdAt: "2026-05-10",
  },
  {
    id: "note-002",
    clientId: "client-002",
    projectId: "project-002",
    title: "Website planning direction",
    body: "Start with intake checklist before deciding full site structure.",
    type: "General",
    createdAt: "2026-05-12",
  },
];