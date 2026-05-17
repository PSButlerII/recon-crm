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

type ServiceRequestDetailPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

 const statusVariants = {
    New: "secondary",
    Reviewing: "default",
    Quoted: "outline",
    Approved: "default",
    Declined: "destructive",
    Converted: "outline",
  } as const;

export default function ServiceRequestDetailPage({ params }: ServiceRequestDetailPageProps) {
  const { requestId } = use(params);

const {
  serviceRequests,
  setServiceRequests,
  projects,
  setProjects,
} = useCrm();

const request = serviceRequests.find(
  (item) => item.id === requestId
);

if (!request) {
  return <div>Request not found.</div>;
}

const relatedProject = projects.find(
  (project) => project.serviceRequestId === request.id
);

function handleConvertToProject() {
  const currentRequest = serviceRequests.find(
    (item) => item.id === requestId
  );

  if (!currentRequest) return;

  setProjects((current) => [
    {
      id: crypto.randomUUID(),
      clientId: currentRequest.clientId ?? "",
      clientName: currentRequest.clientName ?? "Unassigned",
      name: currentRequest.title,
      description: currentRequest.description,
      status: "Planning",
      priority: "Medium",
      progress: 0,
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      serviceRequestId: currentRequest.id,
    },
    ...current,
  ]);

  setServiceRequests((current) =>
    current.map((item) =>
      item.id === currentRequest.id
        ? { ...item, status: "Converted" }
        : item
    )
  );
}

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/service-requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Service Requests
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={request.title} 
          description="Review service request details before converting to a project."
        />

        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[request.status]}>
            {request.status}
          </Badge>

            <Button
              size="sm"
              disabled={request.status === "Converted"}
              onClick={handleConvertToProject}
            >
              {request.status === "Converted" ? "Converted" : "Convert"}
            </Button>
          </div>

      </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
                Review the details of the service request.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Project Type</p>
              <p className="font-medium">{request.category || "General"}</p>
            </div>

            <div>
              <p className="text-slate-500">Description</p>
              <p>{request.description || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Status</p>
              <p>{request.status || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Requested At</p>
              <p>{request.requestedAt || "—"}</p>
            </div>

          </CardContent>
        </Card> 
                {relatedProject && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Related Project</CardTitle>

              <CardDescription>
                This request has been converted into a project.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Link
                href={`/projects/${relatedProject.id}`}
                className="text-sm font-medium hover:underline"
              >
                {relatedProject.name}
              </Link>

              <p className="mt-2 text-sm text-slate-500">
                Status: {relatedProject.status}
              </p>
            </CardContent>
          </Card>
        )}    
    </>
  );
}