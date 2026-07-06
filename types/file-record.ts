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
  originalName?: string;
  mimeType?: string;
  type: FileRecordType;
  size: string;
  sizeBytes?: number;
  storagePath?: string;
  relativePath?: string;
  uploadedAt: string;
};