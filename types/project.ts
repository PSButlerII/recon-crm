export type ProjectStatus =
  | "Planning"
  | "Active"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export type ProjectPriority = "Low" | "Medium" | "High" | "Urgent";

export type Project = {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  startDate?: string;
  dueDate?: string;
  serviceRequestId?: string;
};