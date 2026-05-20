"use client";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { useCrm } from "@/context/crm-context";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type IntakeDetailPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};



export default function IntakeDetailPage({ params }: IntakeDetailPageProps) {

  const statusVariants = {
  New: "secondary",
  Reviewed: "default",
  Converted: "outline",
  Ignored: "destructive",
  } as const;

  const { submissionId } = use(params);

  const {
    intakeSubmissions,
    setIntakeSubmissions,
    setServiceRequests,
    setActivity,
  } = useCrm();

  const submission = intakeSubmissions.find(
    (item) => item.id === submissionId
  );

  if (!submission) {
    return <div>Submission not found.</div>;
  }

  async function handleConvertToRequest() {
    const currentSubmission = intakeSubmissions.find(
      (item) => item.id === submissionId
    );

    if (!currentSubmission) return;
    if (!submission) return;

    const newRequest = {
      id: crypto.randomUUID(),
      intakeSubmissionId: submission.id,
      clientName: submission.company || submission.name,
      title: `${submission.projectType || "General Inquiry"} Request`,
      description:
        submission.message ||
        submission.goal ||
        "No description provided.",
      category: submission.projectType || "General",
      status: "New" as const,
      requestedAt: submission.submittedAt,
    };
    
    setServiceRequests((current) => [newRequest, ...current]);

    setActivity((current) => [
      {
        id: crypto.randomUUID(),
        type: "System",
        message: `Converted intake "${submission.inquiryId}" to service request "${newRequest.title}".`,
        createdAt: new Date().toLocaleString(),
      },
      ...current,
    ]);

    setIntakeSubmissions((current) =>
      current.map((item) =>
        item.id === currentSubmission.id
          ? { ...item, status: "Converted" }
          : item
      )
    );
    const response = await fetch("/api/intake", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: currentSubmission.id,
        status: "Converted",
      }),
    });

    if (!response.ok) {
      console.error("Failed to persist intake status update.");
    }
  }

  async function updateSubmissionStatus(status: "Reviewed" | "Ignored") {
    setIntakeSubmissions((current) =>
      current.map((item) =>
        item.id === submissionId ? { ...item, status } : item
      )
    );
    if(!submission)
      return;
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

    if (!response.ok) {
      console.error("Failed to persist intake status update.");
    }
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
            disabled={submission.status === "Converted"}
            onClick={() => updateSubmissionStatus("Reviewed")}
          >
            Mark Reviewed
          </Button>

          <Button
            size="sm"
            variant="destructive"
            disabled={submission.status === "Converted"}
            onClick={() => updateSubmissionStatus("Ignored")}
          >
            Ignore
          </Button>

          <Button
            size="sm"
            disabled={submission.status === "Converted"}
            onClick={handleConvertToRequest}
          >
            {submission.status === "Converted" ? "Converted" : "Convert"}
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
              <p className="font-medium">{submission.company || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Preferred Contact</p>
              <p className="font-medium">
                {submission.preferredContact || "—"}
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
              <p className="font-medium">{submission.submittedAt}</p>
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
              <p className="font-medium">{submission.projectType || "General"}</p>
            </div>

            <div>
              <p className="text-slate-500">Goal</p>
              <p>{submission.goal || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Blocker</p>
              <p>{submission.blocker || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Budget</p>
              <p>{submission.budget || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Timeline</p>
              <p>{submission.timeline || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Message</p>
              <p>{submission.message || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}