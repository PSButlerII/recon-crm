import type { Activity, ActivityType } from "@/types/activity";
import {
  mapActivity,
  type PersistedActivity,
} from "@/lib/crm-record-mappers";

type LogActivityInput = {
  clientId?: string;
  projectId?: string;
  type: ActivityType;
  message: string;
};

type LogActivityResponse = {
  activity: PersistedActivity;
};

export async function logActivity(
  input: LogActivityInput
): Promise<Activity | null> {
  const response = await fetch("/api/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    console.error("Failed to persist activity log.");
    return null;
  }

  const data = (await response.json()) as LogActivityResponse;

  return mapActivity(data.activity);
}
