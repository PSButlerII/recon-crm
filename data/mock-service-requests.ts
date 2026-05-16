import type { ServiceRequest } from "@/types/service-request";

export const mockServiceRequests: ServiceRequest[] = [
  {
    id: "request-001",
    clientId: "client-002",
    clientName: "Example Startup",
    title: "Small business website help",
    description: "Needs help planning and building an initial website.",
    category: "Web Development",
    status: "Reviewing",
    requestedAt: "2026-05-15",
  },
  {
    id: "request-002",
    clientId: "client-003",
    clientName: "Tech Innovators Inc.",
    title: "Mobile app consultation",
    description: "Looking for advice on building a mobile app.",
    category: "Mobile App Development",
    status: "New",
    requestedAt: "2026-05-20",
  },
  {
    id: "request-003",
    clientId: "client-004",
    clientName: "Green Energy Solutions",
    title: "SEO and digital marketing",
    description: "Needs help improving online presence and SEO.",
    category: "Digital Marketing",
    status: "Quoted",
    requestedAt: "2026-05-10",
  },
];