export type ActivityType =
  | "Client"
  | "Project"
  | "Task"
  | "Note"
  | "System";

export type Activity = {
  id: string;
  clientId?: string;
  projectId?: string;
  type: ActivityType;
  message: string;
  createdAt: string;
};