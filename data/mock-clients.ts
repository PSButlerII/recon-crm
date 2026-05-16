import type { Client } from "@/types/client";

export const mockClients: Client[] = [
  {
    id: "client-001",
    name: "Digicon Ventures",
    contactName: "Kristal",
    email: "kristal@example.com",
    phone: "",
    company: "Digicon Ventures",
    status: "Active",
    projectCount: 1,
    lastContacted: "2026-05-01",
  },
  {
    id: "client-002",
    name: "Example Startup",
    contactName: "Owner",
    email: "owner@example.com",
    phone: "",
    company: "Example Startup",
    status: "Lead",
    projectCount: 0,
    lastContacted: "2026-05-10",
  },
   {
    id: "client-003",
    name: "Rah's Twisted Kitchen",
    contactName: "Robin Reaves",
    email: "rl.reaves@outlook.com",
    phone: "404-528-8158",
    company: "Example Startup",
    status: "Active",
    projectCount: 1,
    lastContacted: "2026-05-14",
  },
];