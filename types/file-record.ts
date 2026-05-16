export type FileRecordType =
  | "Document"
  | "Image"
  | "Contract"
  | "Invoice"
  | "Reference"
  | "Deliverable";

export type FileRecord = {
  id: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  name: string;
  type: FileRecordType;
  size: string;
  uploadedAt: string;
};