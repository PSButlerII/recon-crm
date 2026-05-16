import type { Invoice, Quote } from "@/types/billing";

export const mockQuotes: Quote[] = [
  {
    id: "quote-001",
    clientId: "client-002",
    clientName: "Example Startup",
    projectId: "project-002",
    projectName: "Website Planning",
    title: "Website Planning & Discovery",
    amount: 350,
    status: "Sent",
    issuedDate: "2026-05-12",
    validUntil: "2026-06-12",
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "invoice-001",
    clientId: "client-001",
    clientName: "Digicon Ventures",
    projectId: "project-001",
    projectName: "Security Optimization Package",
    title: "Advanced Security Package",
    amount: 768,
    status: "Paid",
    issuedDate: "2026-01-01",
    dueDate: "2026-01-15",
    paidDate: "2026-01-01",
  },
];