export type TaskStatus = "Todo" | "In Progress" | "Blocked" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export type Task = {
  id: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
};