"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCrm } from "@/context/crm-context";
import {
  mapIntakeSubmission,
  mapServiceRequest,
  upsertById,
  type CreateServiceRequestResponse,
  type PersistedIntakeSubmission,
} from "@/lib/crm-record-mappers";
import { logActivity } from "@/lib/log-activity";
import type { IntakeSubmissionStatus } from "@/types/intake-submission";

type IntakeDetailPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

type IntakePatchResponse = {
  submission?: PersistedIntakeSubmission;
  error?: string;
};

type ServiceRequestPostResponse = CreateServiceRequestResponse & {
  error?: string;
};

const statusVariants = {
  New: "secondary",
  Reviewed: "default",
  Converted: "outline",
  Ignored: "destructive",
} as const;

function formatDate(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString();
}

export default function IntakeDetailPage({ params }: IntakeDetailPageProps) {
  const { submissionId } = use(params);

  const {
    intakeSubmissions,
    setIntakeSubmissions,
    setServiceRequests,
    setActivity,
    isLoadingCrm,
  } = useCrm();

  const [isConverting, setIsConverting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const submission = intakeSubmissions.find(
    (item) => item.id === submissionId
  );

  async function handleConvertToRequest() {
    if (isConverting) return;

    const currentSubmission = intakeSubmissions.find(
      (item) => item.id === submissionId
    );

    if (!currentSubmission || currentSubmission.status === "Converted") {
      return;
    }

    const requestTitle = `${
      currentSubmission.projectType || "General Inquiry"
    } Request`;

    setIsConverting(true);

    try {
      const createResponse = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intakeSubmissionId: currentSubmission.id,
          clientName: currentSubmission.company || currentSubmission.name,
          title: requestTitle,
          description:
            currentSubmission.message ||
            currentSubmission.goal ||
            "No description provided.",
          category: currentSubmission.projectType || "General",
          status: "New",
          requestedAt: currentSubmission.submittedAt,
        }),
      });
      const createData =
        (await createResponse.json()) as ServiceRequestPostResponse;

      if (!createResponse.ok) {
        console.error(
          createData.error || "Failed to persist service request."
        );
        return;
      }

      const savedRequest = mapServiceRequest(createData.serviceRequest);

      setServiceRequests((current) => upsertById(current, savedRequest));

      const intakeResponse = await fetch("/api/intake", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentSubmission.id,
          status: "Converted",
        }),
      });
      const intakeData = (await intakeResponse.json()) as IntakePatchResponse;

      if (!intakeResponse.ok || !intakeData.submission) {
        console.error(
          intakeData.error || "Failed to persist intake status update."
        );
        return;
      }

      const savedSubmission = mapIntakeSubmission(intakeData.submission);

      setIntakeSubmissions((current) =>
        upsertById(current, savedSubmission)
      );

      if (!createData.duplicate) {
        const savedActivity = await logActivity({
          type: "System",
          message: `Converted intake "${currentSubmission.inquiryId}" to service request "${savedRequest.title}".`,
        });

        if (savedActivity) {
          setActivity((current) => upsertById(current, savedActivity));
        }
      }
    } finally {
      setIsConverting(false);
    }
  }

  async function updateSubmissionStatus(
    status: Extract<IntakeSubmissionStatus, "Reviewed" | "Ignored">
  ) {
    if (isUpdatingStatus || !submission) return;

    setIsUpdatingStatus(true);

    try {
      const response = await fetch("/api/intake", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: submission.id,
          status,
        }),
      });
      const data = (await response.json()) as IntakePatchResponse;

      if (!response.ok || !data.submission) {
        console.error(data.error || "Failed to persist intake status update.");
        return;
      }

      const savedSubmission = mapIntakeSubmission(data.submission);

      setIntakeSubmissions((current) =>
        upsertById(current, savedSubmission)
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (isLoadingCrm) {
    return <div>Loading intake submissions...</div>;
  }

  if (!submission) {
    return <div>Submission not found.</div>;
  }

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/intake">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Intake
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={submission.company || submission.name}
          description="Review inbound inquiry details before converting."
        />

        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[submission.status]}>
            {submission.status}
          </Badge>

          <Button
            size="sm"
            variant="outline"
            disabled={
              isUpdatingStatus || submission.status === "Converted"
            }
            onClick={() => updateSubmissionStatus("Reviewed")}
          >
            Mark Reviewed
          </Button>

          <Button
            size="sm"
            variant="destructive"
            disabled={
              isUpdatingStatus || submission.status === "Converted"
            }
            onClick={() => updateSubmissionStatus("Ignored")}
          >
            Ignore
          </Button>

          <Button
            size="sm"
            disabled={isConverting || submission.status === "Converted"}
            onClick={handleConvertToRequest}
          >
            {isConverting
              ? "Converting..."
              : submission.status === "Converted"
                ? "Converted"
                : "Convert"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Sender information.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500">Name</p>
              <p className="font-medium">{submission.name}</p>
            </div>

            <div>
              <p className="text-slate-500">Email</p>
              <p className="font-medium">{submission.email}</p>
            </div>

            <div>
              <p className="text-slate-500">Company</p>
              <p className="font-medium">{submission.company || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Preferred Contact</p>
              <p className="font-medium">
                {submission.preferredContact || "-"}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Inquiry ID</p>
              <p className="font-medium">{submission.inquiryId}</p>
            </div>

            <div>
              <p className="text-slate-500">Source</p>
              <p className="font-medium">{submission.source}</p>
            </div>

            <div>
              <p className="text-slate-500">Priority</p>
              <p className="font-medium">{submission.priority}</p>
            </div>

            <div>
              <p className="text-slate-500">Submitted At</p>
              <p className="font-medium">
                {formatDate(submission.submittedAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inquiry Details</CardTitle>
            <CardDescription>
              Project type, goal, blocker, budget, timeline, and message.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Project Type</p>
              <p className="font-medium">
                {submission.projectType || "General"}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Goal</p>
              <p>{submission.goal || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Blocker</p>
              <p>{submission.blocker || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Budget</p>
              <p>{submission.budget || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Timeline</p>
              <p>{submission.timeline || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Message</p>
              <p>{submission.message || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
