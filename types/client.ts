export type ClientStatus = "Lead" | "Active" | "Paused" | "Archived";

export type Client = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone?: string;
  company?: string;
  status: ClientStatus;
  projectCount: number;
  lastContacted?: string;
};