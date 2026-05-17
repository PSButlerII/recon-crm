export type IntakeSubmissionStatus =
  | "New"
  | "Reviewed"
  | "Converted"
  | "Ignored";

export type IntakeSubmission = {
  id: string;
  source: string;
  name: string;
  email: string;
  company?: string;
  projectType?: string;
  goal?: string;
  blocker?: string;
  budget?: string;
  timeline?: string;
  preferredContact?: string;
  message?: string;
  submittedAt: string;
  status: IntakeSubmissionStatus;
};