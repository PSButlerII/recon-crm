import type { Activity } from "@/types/activity";
import type { Client } from "@/types/client";
import type { IntakeSubmission } from "@/types/intake-submission";
import type { Project } from "@/types/project";
import type { Invoice, Quote } from "@/types/billing";
import type { FileRecord } from "@/types/file-record";
import type { ServiceRequest } from "@/types/service-request";
import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

export type PersistedActivity = Omit<Activity, "clientId" | "projectId"> & {
  clientId: string | null;
  projectId: string | null;
};

export type PersistedClient = Omit<Client, "phone" | "lastContacted"> & {
  phone: string | null;
  lastContacted: string | null;
};


export type PersistedQuote = Omit<
  Quote,
  "clientId" | "projectId" | "projectName" | "issuedDate" | "validUntil"
> & {
  clientId: string | null;
  projectId: string | null;
  projectName: string | null;
  issuedDate: string | null;
  validUntil: string | null;
};

export type PersistedInvoice = Omit<
  Invoice,
  "quoteId" | "clientId" | "projectId" | "projectName" | "issuedDate" | "dueDate" | "paidDate"
> & {
  quoteId: string | null;
  clientId: string | null;
  projectId: string | null;
  projectName: string | null;
  issuedDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
};


export type PersistedFileRecord = Omit<
  FileRecord,
  "clientId" | "clientName" | "projectId" | "projectName" | "uploadedAt"
> & {
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  uploadedAt: string;
};

export type PersistedIntakeSubmission = Omit<
  IntakeSubmission,
  | "phone"
  | "company"
  | "blocker"
  | "budget"
  | "timeline"
  | "preferredContact"
  | "message"
> & {
  phone: string | null;
  company: string | null;
  blocker: string | null;
  budget: string | null;
  timeline: string | null;
  preferredContact: string | null;
  message: string | null;
};


export type PersistedNote = Omit<Note, "clientId" | "projectId"> & {
  clientId: string | null;
  projectId: string | null;
};

export type PersistedTask = Omit<
  Task,
  "clientId" | "clientName" | "description" | "dueDate"
> & {
  clientId: string | null;
  clientName: string | null;
  description: string | null;
  dueDate: string | null;
};

export type PersistedProject = Omit<
  Project,
  "clientId" | "serviceRequestId" | "startDate" | "dueDate"
> & {
  clientId: string | null;
  serviceRequestId: string | null;
  startDate: string | null;
  dueDate: string | null;
};

export type PersistedServiceRequest = Omit<
  ServiceRequest,
  "clientId" | "clientName" | "intakeSubmissionId"
> & {
  clientId: string | null;
  clientName: string | null;
  intakeSubmissionId: string | null;
};

export type ServiceRequestConversionResponse = {
  ok: true;
  createdProject: boolean;
  createdActivity: boolean;
  project: PersistedProject;
  serviceRequest: PersistedServiceRequest;
  activity: PersistedActivity | null;
};

export type CreateServiceRequestResponse = {
  ok: true;
  duplicate?: boolean;
  serviceRequest: PersistedServiceRequest;
};

export function mapActivity(activity: PersistedActivity): Activity {
  return {
    id: activity.id,
    clientId: activity.clientId ?? undefined,
    projectId: activity.projectId ?? undefined,
    type: activity.type,
    message: activity.message,
    createdAt: activity.createdAt,
  };
}

export function mapClient(client: PersistedClient): Client {
  return {
    id: client.id,
    name: client.name,
    contactName: client.contactName,
    email: client.email,
    phone: client.phone ?? undefined,
    status: client.status,
    projectCount: client.projectCount,
    lastContacted: client.lastContacted ?? undefined,
  };
}


export function mapFileRecord(file: PersistedFileRecord): FileRecord {
  return {
    id: file.id,
    clientId: file.clientId ?? undefined,
    clientName: file.clientName ?? undefined,
    projectId: file.projectId ?? undefined,
    projectName: file.projectName ?? undefined,
    name: file.name,
    type: file.type,
    size: file.size,
    uploadedAt: file.uploadedAt,
  };
}

export function mapIntakeSubmission(
  submission: PersistedIntakeSubmission
): IntakeSubmission {
  return {
    id: submission.id,
    inquiryId: submission.inquiryId,
    source: submission.source,
    name: submission.name,
    email: submission.email,
    phone: submission.phone ?? "",
    company: submission.company ?? undefined,
    projectType: submission.projectType,
    goal: submission.goal,
    blocker: submission.blocker ?? undefined,
    budget: submission.budget ?? undefined,
    timeline: submission.timeline ?? undefined,
    preferredContact: submission.preferredContact ?? undefined,
    message: submission.message ?? undefined,
    submittedAt: submission.submittedAt,
    status: submission.status,
    priority: submission.priority,
  };
}


export function mapNote(note: PersistedNote): Note {
  return {
    id: note.id,
    clientId: note.clientId ?? undefined,
    projectId: note.projectId ?? undefined,
    title: note.title,
    body: note.body,
    type: note.type,
    createdAt: note.createdAt,
  };
}

export function mapTask(task: PersistedTask): Task {
  return {
    id: task.id,
    projectId: task.projectId,
    projectName: task.projectName,
    clientId: task.clientId ?? "",
    clientName: task.clientName ?? "",
    title: task.title,
    description: task.description ?? undefined,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? undefined,
  };
}

export function mapProject(project: PersistedProject): Project {
  return {
    id: project.id,
    clientId: project.clientId ?? "",
    clientName: project.clientName,
    serviceRequestId: project.serviceRequestId ?? undefined,
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    startDate: project.startDate ?? undefined,
    dueDate: project.dueDate ?? undefined,
  };
}


export function mapQuote(quote: PersistedQuote): Quote {
  return {
    id: quote.id,
    clientId: quote.clientId ?? "",
    clientName: quote.clientName,
    projectId: quote.projectId ?? undefined,
    projectName: quote.projectName ?? undefined,
    title: quote.title,
    amount: quote.amount,
    status: quote.status,
    issuedDate: quote.issuedDate ?? undefined,
    validUntil: quote.validUntil ?? undefined,
  };
}

export function mapInvoice(invoice: PersistedInvoice): Invoice {
  return {
    id: invoice.id,
    quoteId: invoice.quoteId ?? undefined,
    clientId: invoice.clientId ?? undefined,
    clientName: invoice.clientName,
    projectId: invoice.projectId ?? undefined,
    projectName: invoice.projectName ?? undefined,
    title: invoice.title,
    amount: invoice.amount,
    status: invoice.status,
    issuedDate: invoice.issuedDate ?? "",
    dueDate: invoice.dueDate ?? undefined,
    paidDate: invoice.paidDate ?? undefined,
  };
}

export function mapServiceRequest(
  request: PersistedServiceRequest
): ServiceRequest {
  return {
    id: request.id,
    intakeSubmissionId: request.intakeSubmissionId ?? undefined,
    clientId: request.clientId ?? undefined,
    clientName: request.clientName ?? undefined,
    title: request.title,
    description: request.description,
    category: request.category,
    status: request.status,
    requestedAt: request.requestedAt,
  };
}

export function prependActivity(records: Activity[], activity: Activity) {
  return [activity, ...records];
}

export function upsertById<T extends { id: string }>(records: T[], record: T) {
  if (records.some((item) => item.id === record.id)) {
    return records.map((item) => (item.id === record.id ? record : item));
  }

  return [record, ...records];
}

export function upsertMappedById<Persisted, Mapped extends { id: string }>(
  records: Mapped[],
  persisted: Persisted,
  mapper: (record: Persisted) => Mapped
) {
  return upsertById(records, mapper(persisted));
}
