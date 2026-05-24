export type BillingStatus =
  | "Draft"
  | "Sent"
  | "Accepted"
  | "Declined"
  | "Paid"
  | "Overdue";

export type Quote = {
  id: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  title: string;
  amount: number;
  status: BillingStatus;
  issuedDate?: string;
  validUntil?: string;
};

export type Invoice = {
  id: string;
  quoteId?: string;
  clientId?: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  title: string;
  amount: number;
  status: BillingStatus;
  issuedDate: string;
  dueDate?: string;
  paidDate?: string;
};