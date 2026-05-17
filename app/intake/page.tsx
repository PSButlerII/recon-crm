"use client";

import { useState } from "react";

import { useCrm } from "@/context/crm-context";

import type {
  IntakeSubmission,
  IntakeSubmissionStatus,
} from "@/types/intake-submission";

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

const statusVariants = {
  New: "secondary",
  Reviewed: "default",
  Converted: "outline",
  Ignored: "destructive",
} as const;

export default function IntakePage() {
  const {
    intakeSubmissions,
    setIntakeSubmissions,
    serviceRequests,
    setServiceRequests,
  } = useCrm();

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | IntakeSubmissionStatus>("New");

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

  function handleConvertToRequest(submissionId: string) {
    const submission = intakeSubmissions.find(
      (item) => item.id === submissionId
    );

    if (!submission) return;

    setServiceRequests((current) => [
      {
        id: crypto.randomUUID(),
        intakeSubmissionId: submission.id,
        clientName: submission.company || submission.name,
        title: `${submission.projectType || "General Inquiry"} Request`,
        description:
          submission.message ||
          submission.goal ||
          "No description provided.",
        category: submission.projectType || "General",
        status: "New",
        requestedAt: submission.submittedAt,
      },
      ...current,
    ]);

    setIntakeSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id
          ? { ...item, status: "Converted" }
          : item
      )
    );
  }

  return (
    <>
      <PageActions>
        <PageHeader
          title="Intake"
          description="Incoming inquiries and website contact submissions."
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search intake..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button variant="outline">
            {statusFilter}
          </Button>
        </div>
      </PageActions>

      <Card>
        <CardHeader>
          <CardTitle>Submission Queue</CardTitle>

          <CardDescription>
            Website inquiries and inbound contact submissions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Project Type</TableHead>
                <TableHead>Status</TableHead>
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