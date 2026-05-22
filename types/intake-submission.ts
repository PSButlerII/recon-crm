export type IntakeSubmissionStatus =
  | "New"
  | "Reviewed"
  | "Converted"
  | "Ignored";

export type IntakePriority = "low" | "normal" | "high" | "urgent";

export type IntakeSubmission = {
  id: string;
  inquiryId: string;

  source: string;
  name: string;
  email: string;
  phone:string;
  company?: string;

  projectType: string;
  goal: string;
  blocker?: string;
  budget?: string;
  timeline?: string;
  preferredContact?: string;
  message?: string;

  submittedAt: string;
  status: IntakeSubmissionStatus;
  priority: IntakePriority;
};