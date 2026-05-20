import type { ActivityType } from "@/types/activity";

type LogActivityInput = {
  clientId?: string;
  projectId?: string;
  type: ActivityType;
  message: string;
};

export async function logActivity(input: LogActivityInput) {
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

  const data = await response.json();

  return data.activity;
}