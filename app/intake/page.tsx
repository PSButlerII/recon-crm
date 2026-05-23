"use client";

import { useCrm } from "@/context/crm-context";
import type {  IntakeSubmissionStatus } from "@/types/intake-submission";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { logActivity } from "@/lib/log-activity";

export default function IntakePage() {
  const statusVariants = {
  New: "secondary",
  Reviewed: "default",
  Converted: "outline",
  Ignored: "destructive",
  } as const;

  const {
    intakeSubmissions,
    setIntakeSubmissions,
    setServiceRequests,
    setActivity,
    isLoadingCrm,
    refreshCrmData
  } = useCrm();
  
async function loadIntake() {
  setIsLoading(true);

  try {
    const response = await fetch("/api/intake");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load intake.");
    }

    setIntakeSubmissions(
      data.submissions.map((item: any) => ({
        id: item.id,
        inquiryId: item.inquiryId,
        source: item.source,
        name: item.name,
        email: item.email,
        company: item.company ?? undefined,
        projectType: item.projectType,
        goal: item.goal,
        blocker: item.blocker ?? undefined,
        budget: item.budget ?? undefined,
        timeline: item.timeline ?? undefined,
        preferredContact: item.preferredContact ?? undefined,
        message: item.message ?? undefined,
        submittedAt: item.submittedAt,
        status: item.status,
        priority: item.priority,
      }))
    );
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false);
  }
}
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    loadIntake();
  async function loadIntake() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/intake");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load intake.");
      }

      setIntakeSubmissions(
        data.submissions.map((item: any) => ({
          id: item.id,
          inquiryId: item.inquiryId,
          source: item.source,
          name: item.name,
          email: item.email,
          company: item.company ?? undefined,
          projectType: item.projectType,
          goal: item.goal,
          blocker: item.blocker ?? undefined,
          budget: item.budget ?? undefined,
          timeline: item.timeline ?? undefined,
          preferredContact: item.preferredContact ?? undefined,
          message: item.message ?? undefined,
          submittedAt: item.submittedAt,
          status: item.status,
          priority: item.priority,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

    loadIntake();
     const interval = window.setInterval(() => {
    loadIntake();
  }, 3000000);
   return () => window.clearInterval(interval);
},[setIntakeSubmissions]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | IntakeSubmissionStatus>("All");

  const filteredSubmissions = intakeSubmissions.filter((submission) => {
    const matchesSearch =
      submission.name.toLowerCase().includes(search.toLowerCase()) ||
      submission.email.toLowerCase().includes(search.toLowerCase()) ||
      submission.company?.toLowerCase().includes(search.toLowerCase()) ||
      submission.projectType?.toLowerCase().includes(search.toLowerCase()) ||
      submission.message?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function handleConvertToRequest(submissionId: string) {
    const submission = intakeSubmissions.find(
      (item) => item.id === submissionId
    );

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
    const createResponse = await fetch("/api/service-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newRequest),
    });

    if (!createResponse.ok) {
      console.error("Failed to persist service request.");
      return;
    }

    const createData = await createResponse.json();
    const savedRequest = createData.serviceRequest;

    setServiceRequests((current) => [
      {
        id: savedRequest.id,
        intakeSubmissionId: savedRequest.intakeSubmissionId ?? undefined,
        clientId: savedRequest.clientId ?? undefined,
        clientName: savedRequest.clientName ?? undefined,
        title: savedRequest.title,
        description: savedRequest.description,
        category: savedRequest.category,
        status: savedRequest.status,
        requestedAt: savedRequest.requestedAt,
      },
      ...current,
    ]);

    const savedActivity = await logActivity({
      type: "System",
      message: `Converted intake "${submission.inquiryId}" to service request "${newRequest.title}".`,
    });

    if (savedActivity) {
      setActivity((current) => [
        {
          id: savedActivity.id,
          clientId: savedActivity.clientId ?? undefined,
          projectId: savedActivity.projectId ?? undefined,
          type: savedActivity.type,
          message: savedActivity.message,
          createdAt: savedActivity.createdAt,
        },
        ...current,
      ]);
    }

    setIntakeSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id
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
        id: submission.id,
        status: "Converted",
      }),
    });

    if (!response.ok) {
      console.error("Failed to persist intake status update.");
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
            onChange={(e) => setSearch(e.target.value)}
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
        <div>
            {isLoading && (
                  <p className="mb-4 text-sm text-slate-500">
                    Loading intake submissions...
                  </p>
                )}
        </div>
     
      <Card>
        <CardHeader>
          <CardTitle>Submission Queue</CardTitle>

          <CardDescription>
            Website inquiries and inbound contact submissions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-4 text-sm text-slate-500">
            Loaded: {intakeSubmissions.length} |
            Showing: {filteredSubmissions.length}
            <Button variant="outline" onClick={loadIntake}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Project Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                        <Link href={`/intake/${submission.id}`} className="hover:underline">
                            {submission.name}
                        </Link>

                      <p className="text-sm text-slate-500">
                        {submission.email}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {submission.company || "—"}
                  </TableCell>

                  <TableCell>
                    {submission.projectType || "General"}
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariants[submission.status]}>
                      {submission.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{submission.priority}</TableCell>

                  <TableCell>
                    {submission.submittedAt}
                  </TableCell>

                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={submission.status === "Converted"}
                      onClick={() =>
                        handleConvertToRequest(submission.id)
                      }
                    >
                      {submission.status === "Converted"
                        ? "Converted"
                        : "Convert"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}