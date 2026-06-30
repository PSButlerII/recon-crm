"use client";

import Link from "next/link";
import { use, useState } from "react";
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
import {
  mapActivity,
  mapProject,
  mapServiceRequest,
  upsertById,
  type ServiceRequestConversionResponse,
} from "@/lib/crm-record-mappers";


type ServiceRequestDetailPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};


export default function ServiceRequestDetailPage({ params }: ServiceRequestDetailPageProps) {
   const statusVariants = {
    New: "secondary",
    Reviewing: "default",
    Quoted: "outline",
    Approved: "default",
    Declined: "destructive",
    Converted: "outline",
  } as const;
  
  const { requestId } = use(params);

  const {
    serviceRequests,
    setServiceRequests,
    projects,
    setProjects,
    setActivity,
    isLoadingCrm
  } = useCrm();

  const [isConverting, setIsConverting] = useState(false);

  const request = serviceRequests.find(
    (item) => item.id === requestId
  );

  if(isLoadingCrm){
    return <div>Loading requests...</div>
  }
  
  if (!request) {
    return <div>Request not found.</div>;
  }


  const relatedProject = projects.find(
    (project) => project.serviceRequestId === request.id
  );

  async function handleConvertToProject() {
    if (isConverting) return;

    const currentRequest = serviceRequests.find(
      (item) => item.id === requestId
    );

    if (!currentRequest || currentRequest.status === "Converted") return;

    setIsConverting(true);

    try {
      const response = await fetch("/api/service-requests/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentRequest.id,
          priority: "Medium",
        }),
      });

      if (!response.ok) {
        console.error("Failed to convert service request.");
        return;
      }

      const data = (await response.json()) as ServiceRequestConversionResponse;
      const savedProject = mapProject(data.project);
      const savedRequest = mapServiceRequest(data.serviceRequest);

      setProjects((current) => upsertById(current, savedProject));
      setServiceRequests((current) => upsertById(current, savedRequest));

      if (data.activity) {
        const savedActivity = mapActivity(data.activity);

        setActivity((current) =>
          current.some((item) => item.id === savedActivity.id)
            ? current
            : [savedActivity, ...current]
        );
      }
    } finally {
      setIsConverting(false);
    }
}
function formatDate(value?: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
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
              disabled={isConverting || request.status === "Converted"}
              onClick={handleConvertToProject}
            >
              {isConverting
                ? "Converting..."
                : request.status === "Converted"
                  ? "Converted"
                  : "Convert"}
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
              <p>{formatDate(request.requestedAt)}</p>
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
