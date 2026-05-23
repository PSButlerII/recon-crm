import type { IntakeSubmission } from "@/types/intake-submission";

export const mockIntakeSubmissions: IntakeSubmission[] = [
{
  id: "intake-001",
  inquiryId: "website-001",
  source: "Recon Dev Website",
  name: "Example Owner",
  email: "owner@example.com",
  phone: "494857690",
  company: "Example Startup",
  projectType: "Web Development",
  goal: "Build a simple business website.",
  blocker: "Not sure where to start.",
  budget: "$500-$1,000",
  timeline: "1-2 months",
  preferredContact: "Email",
  message: "I need help getting my business online.",
  submittedAt: "2026-05-16",
  status: "New",
  priority: "normal",
}
];