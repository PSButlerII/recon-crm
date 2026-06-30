import type { Activity } from "@/types/activity";
import type { Project } from "@/types/project";
import type { ServiceRequest } from "@/types/service-request";

export type PersistedActivity = Omit<Activity, "clientId" | "projectId"> & {
  clientId: string | null;
  projectId: string | null;
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

export function upsertById<T extends { id: string }>(records: T[], record: T) {
  if (records.some((item) => item.id === record.id)) {
    return records.map((item) => (item.id === record.id ? record : item));
  }

  return [record, ...records];
}
