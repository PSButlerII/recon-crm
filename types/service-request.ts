export type ServiceRequestStatus =
  | "New"
  | "Reviewing"
  | "Quoted"
  | "Approved"
  | "Declined"
  | "Converted";

export type ServiceRequest = {
  id: string;
  clientId?: string;
  clientName?: string;
  intakeSubmissionId?: string;

  title: string;
  description: string;
  category: string;
  status: ServiceRequestStatus;
  requestedAt: string;
};