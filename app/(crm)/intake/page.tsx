"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { PageActions } from "@/components/page-actions";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type IntakeResponse = {
  submissions?: PersistedIntakeSubmission[];
  error?: string;
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

function formatSource(value?: string) {
  return value?.trim() || "Unknown";
}

export default function IntakePage() {
  const {
    intakeSubmissions,
    setIntakeSubmissions,
    setServiceRequests,
    setActivity,
    isLoadingCrm,
    refreshCrmData,
  } = useCrm();

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | IntakeSubmissionStatus>("All");
  const [convertingSubmissionId, setConvertingSubmissionId] = useState<
    string | null
  >(null);

  const loadIntake = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/intake");
      const data = (await response.json()) as IntakeResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to load intake.");
      }

      setIntakeSubmissions(
        (data.submissions ?? []).map((item) => mapIntakeSubmission(item))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [setIntakeSubmissions]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadIntake();
    }, 0);

    const interval = window.setInterval(() => {
      void loadIntake();
    }, 3000000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadIntake]);

  const filteredSubmissions = intakeSubmissions.filter((submission) => {
    const matchesSearch =
      submission.name.toLowerCase().includes(search.toLowerCase()) ||
      submission.email.toLowerCase().includes(search.toLowerCase()) ||
      submission.phone.toLowerCase().includes(search.toLowerCase()) ||
      submission.source.toLowerCase().includes(search.toLowerCase()) ||
      submission.inquiryId.toLowerCase().includes(search.toLowerCase()) ||
      submission.company?.toLowerCase().includes(search.toLowerCase()) ||
      submission.projectType?.toLowerCase().includes(search.toLowerCase()) ||
      submission.message?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function handleConvertToRequest(submissionId: string) {
    if (convertingSubmissionId) return;

    const submission = intakeSubmissions.find(
      (item) => item.id === submissionId
    );

    if (!submission || submission.status === "Converted") return;

    const requestTitle = `${
      submission.projectType || "General Inquiry"
    } Request`;

    setConvertingSubmissionId(submission.id);

    try {
      const createResponse = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intakeSubmissionId: submission.id,
          clientName: submission.company || submission.name,
          title: requestTitle,
          description:
            submission.message ||
            submission.goal ||
            "No description provided.",
          category: submission.projectType || "General",
          status: "New",
          requestedAt: submission.submittedAt,
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
          id: submission.id,
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
          message: `Converted intake "${submission.inquiryId}" to service request "${savedRequest.title}".`,
        });

        if (savedActivity) {
          setActivity((current) => upsertById(current, savedActivity));
        }
      }
    } finally {
      setConvertingSubmissionId(null);
    }
  }

  return (
    <>
      <PageActions>
        <PageHeader
          title="Intake"
          description="Incoming inquiries and website contact submissions."
        />

        <Button variant="outline" onClick={refreshCrmData}>
          {isLoadingCrm ? "Refreshing..." : "Refresh"}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search intake..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "All" | IntakeSubmissionStatus)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
              <SelectItem value="Ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageActions>

      {isLoading && (
        <p className="mb-4 text-sm text-slate-500">
          Loading intake submissions...
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Submission Queue</CardTitle>

          <CardDescription>
            Website inquiries and inbound contact submissions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Loaded: {intakeSubmissions.length}</span>
            <span>Showing: {filteredSubmissions.length}</span>
            <Button variant="outline" onClick={loadIntake}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Project Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredSubmissions.map((submission) => {
                const isConverting =
                  convertingSubmissionId === submission.id;

                return (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <span className="font-medium">
                        {formatSource(submission.source)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div>
                        <Link
                          href={`/intake/${submission.id}`}
                          className="hover:underline"
                        >
                          {submission.name}
                        </Link>

                        <p className="text-sm text-slate-500">
                          {submission.email}
                        </p>

                        {submission.company && (
                          <p className="text-xs text-slate-500">
                            {submission.company}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{submission.phone || "-"}</TableCell>

                    <TableCell>
                      {submission.projectType || "General"}
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusVariants[submission.status]}>
                        {submission.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {formatDate(submission.submittedAt)}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          submission.status === "Converted" || isConverting
                        }
                        onClick={() => handleConvertToRequest(submission.id)}
                      >
                        {isConverting
                          ? "Converting..."
                          : submission.status === "Converted"
                            ? "Converted"
                            : "Convert"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
