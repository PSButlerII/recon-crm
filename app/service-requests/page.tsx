"use client";

import { useEffect, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCrm } from "@/context/crm-context";
import { ProjectPriority } from "@/types/project";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ServiceRequest, ServiceRequestStatus } from "@/types/service-request";
 

export default function ServiceRequestsPage() {
  const [statusFilter, setStatusFilter] =
  useState<"All" | ServiceRequestStatus>("All");

  const statusVariants = {
    New: "secondary",
    Reviewing: "default",
    Quoted: "outline",
    Approved: "default",
    Declined: "destructive",
    Converted: "outline",
  } as const;

  const {
  serviceRequests,
  setServiceRequests,
  projects,
  setProjects,
  clients,
  } = useCrm();

  
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ServiceRequestStatus>("New");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("Medium");
  const [successMessage, setSuccessMessage] = useState("");
  const [dueDate, setDueDate] = useState("");

  const filteredRequests = serviceRequests.filter((request) => {
      const matchesSearch =
      statusFilter === "All" || request.status === statusFilter;
    return (
      request.title.toLowerCase().includes(search.toLowerCase()) ||
      request.description.toLowerCase().includes(search.toLowerCase()) ||
      request.category.toLowerCase().includes(search.toLowerCase()) ||
      request.status.toLowerCase().includes(search.toLowerCase())
    ) && matchesSearch;
  });

  function handleConvertRequest() {
    const request = serviceRequests.find(
      (request) => request.id === selectedRequestId
    );

  if (!request) return;

  const newProject = {
    id: crypto.randomUUID(),
    clientId: request.clientId ?? "",
    clientName: request.clientName ?? "Unassigned",
    name: request.title,
    description: request.description,
    status: "Planning" as const,
    priority,
    progress: 0,
    startDate: new Date().toISOString().split("T")[0],
    dueDate,
    serviceRequestId: request.id,
  };

  setProjects((current) => [newProject, ...current]);

  setServiceRequests((current) =>
    current.map((item) =>
      item.id === request.id ? { ...item, status: "Converted" } : item
    )
  );

  setSelectedRequestId("");
  setPriority("Medium");
  setDueDate("");
  setSuccessMessage(`Request "${request.title}" was converted to a project.`);
  setConvertOpen(false);  
  }

  async function handleAddRequest() {
  const client = clients.find((client) => client.id === clientId);

  const newRequest: ServiceRequest = {
    id: crypto.randomUUID(),
    clientId: client?.id,
    clientName: client?.name,
    title,
    description,
    category,
    status,
    requestedAt: new Date().toISOString().split("T")[0],
  };

  const response = await fetch("/api/service-requests", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(newRequest),
});

if (!response.ok) {
  console.error("Failed to persist service request.");
  return;
}

const data = await response.json();
const savedRequest = data.serviceRequest;

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

  setTitle("");
  setDescription("");
  setCategory("");
  setClientId("");
  setStatus("New");
  setOpen(false);
  }

  const [isLoading, setIsLoading] = useState(false);

  async function loadServiceRequests() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/service-requests");
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load service requests.");
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load service requests.");
      }

      setServiceRequests(
        data.serviceRequests.map((item: any) => ({
          id: item.id,
          intakeSubmissionId: item.intakeSubmissionId ?? undefined,
          clientId: item.clientId ?? undefined,
          clientName: item.clientName ?? undefined,
          title: item.title,
          description: item.description,
          category: item.category,
          status: item.status,
          requestedAt: item.requestedAt,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadServiceRequests();
  }, []);
  return (
    <>
      <PageActions>
        <PageHeader
          title="Service Requests"
          description="Track incoming work before it becomes a project."
        />

        

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "All" | ServiceRequestStatus)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Reviewing">Reviewing</SelectItem>
            <SelectItem value="Quoted">Quoted</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
            <SelectItem value="Converted">Converted</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadServiceRequests}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Request</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Service Request</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Request Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={clientId}
                  onValueChange={(value) => setClientId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>

                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>



              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ServiceRequestStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Reviewing">Reviewing</SelectItem>
                    <SelectItem value="Quoted">Quoted</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleAddRequest}
                disabled={!title || !clientId}
              >
                Add Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </PageActions>

      {successMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request List</CardTitle>
          <CardDescription>
            Incoming needs, leads, and potential project work.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/service-requests/${request.id}`}
                      className="hover:underline"
                    >
                      {request.title}
                    </Link>
                  </TableCell>

                  <TableCell>
                    {request.clientId ? (
                      <Link
                        href={`/clients/${request.clientId}`}
                        className="hover:underline"
                      >
                        {request.clientName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>{request.category}</TableCell>

                  <TableCell>
                    <Badge variant={statusVariants[request.status]}>
                      {request.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{request.requestedAt}</TableCell>

                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={request.status === "Converted"}
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setConvertOpen(true);
                      }}
                    >
                      {request.status === "Converted" ? "Converted" : "Convert"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Convert Request to Project</DialogTitle>
      <DialogDescription>
        This will create a project from the selected service request.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={priority}
          onValueChange={(value) => setPriority(value as ProjectPriority)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Due Date</Label>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <Button className="w-full" onClick={handleConvertRequest}>
        Create Project
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </>
  );
}