export type NoteType = "General" | "Call" | "Decision" | "Reminder" | "Research";

export type Note = {
  id: string;
  clientId?: string;
  projectId?: string;
  title: string;
  body: string;
  type: NoteType;
  createdAt: string;
};