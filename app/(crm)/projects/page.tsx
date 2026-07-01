"use client";

import Link from "next/link";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageActions } from "@/components/page-actions"
import { SelectContent, SelectItem, SelectTrigger, SelectValue,Select } from "@/components/ui/select";
import type {
  Project,
  ProjectPriority,
  ProjectStatus,
} from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCrm } from "@/context/crm-context";
import {
  mapProject,
  prependActivity,
  upsertById,
  type PersistedProject,
} from "@/lib/crm-record-mappers";
import { logActivity } from "@/lib/log-activity";
import { useState } from "react";

const statusVariants = {
  Planning: "secondary",
  Active: "default",
  "On Hold": "outline",
  Completed: "default",
  Cancelled: "destructive",
} as const;

const UNASSIGNED_CLIENT_VALUE = "__unassigned__";
const UNASSIGNED_CLIENT_NAME = "Unassigned";

function getProjectClientSelectValue(project: Project) {
  return project.clientId || UNASSIGNED_CLIENT_VALUE;
}


export default function ProjectsPage() {
  const {
    projects,
    setProjects,
    clients,
    setActivity,
    refreshCrmData,
    isLoadingCrm,
  } = useCrm();
  
  const [successMessage, setSuccessMessage] = useState("");
  const [open, setOpen] = useState(false);
  
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(UNASSIGNED_CLIENT_VALUE);
  const [description, setDescription] = useState("");
  const [status, setStatus] =
  useState<ProjectStatus>("Planning");
  
  const [priority, setPriority] =
  useState<ProjectPriority>("Medium");
  
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ProjectStatus>("All");
  
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
    project.name.toLowerCase().includes(search.toLowerCase()) ||
    project.clientName.toLowerCase().includes(search.toLowerCase()) ||
    project.dueDate?.toLowerCase().includes(search.toLowerCase())||
    project.priority.toLowerCase().includes(search.toLowerCase())||
    project.status.toLowerCase().includes(search.toLowerCase())||
    project.progress.toString().includes(search.toLowerCase());
    
    const matchesStatus =
    statusFilter === "All" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
    
  });
  
  async function handleAddProject() {
    const client = clients.find((client) => client.id === clientId);
    const savedName = name;

    const newProject: Project = {
      id: crypto.randomUUID(),
      clientId: client?.id ?? "",
      clientName: client?.name ?? UNASSIGNED_CLIENT_NAME,
      name,
      description,
      status,
      priority,
      progress: 0,
      startDate,
      dueDate,
    };

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProject),
    });

    if (!response.ok) {
      console.error("Failed to persist project.");
      return;
    }

    const data = (await response.json()) as { project: PersistedProject };
    const savedProject = mapProject(data.project);

    setProjects((current) => upsertById(current, savedProject));

    const savedActivity = await logActivity({
      clientId: savedProject.clientId || undefined,
      projectId: savedProject.id,
      type: "Project",
      message: `Created project "${savedProject.name}".`,
    });

    if (savedActivity) {
      setActivity((current) => prependActivity(current, savedActivity));
    }

    setName("");
    setClientId(UNASSIGNED_CLIENT_VALUE);
    setDescription("");
    setStatus("Planning");
    setPriority("Medium");
    setStartDate("");
    setDueDate("");
    setSuccessMessage(`Project "${savedName}" was added.`);
    setOpen(false);
  }

  async function handleUpdateProjectClient(project: Project, nextClientId: string) {
    const selectedClient = clients.find((client) => client.id === nextClientId);
    const shouldDetach = nextClientId === UNASSIGNED_CLIENT_VALUE;
    const previousClientName = project.clientId
      ? project.clientName
      : UNASSIGNED_CLIENT_NAME;
    const nextClientName = selectedClient?.name ?? UNASSIGNED_CLIENT_NAME;

    if ((!project.clientId && shouldDetach) || project.clientId === nextClientId) {
      return;
    }

    if (!selectedClient && !shouldDetach) {
      console.error("Cannot assign project to an unknown client.");
      return;
    }

    const response = await fetch("/api/projects", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: project.id,
        clientId: selectedClient?.id ?? null,
        clientName: nextClientName,
      }),
    });

    if (!response.ok) {
      console.error("Failed to update project client.");
      return;
    }

    const data = (await response.json()) as { project: PersistedProject };
    const savedProject = mapProject(data.project);

    setProjects((current) => upsertById(current, savedProject));

    const savedActivity = await logActivity({
      clientId: savedProject.clientId || undefined,
      projectId: savedProject.id,
      type: "Project",
      message: `Changed project "${savedProject.name}" client from ${previousClientName} to ${nextClientName}.`,
    });

    if (savedActivity) {
      setActivity((current) => prependActivity(current, savedActivity));
    }
  }
  function formatDate(value?: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
}
  
  return (
    <>
      <PageActions>
        <PageHeader
          title="Projects"
          description="Track active work, deadlines, progress, and priorities."
        />

        <Button variant="outline" onClick={refreshCrmData}>
          {isLoadingCrm ? "Refreshing..." : "Refresh"}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={statusFilter}
          onValueChange={(value)  => 
            setStatusFilter(value as "All" | ProjectStatus)
          }
            >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Planning">Planning</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Project</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Create a new project linked to a client.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                    <SelectItem value={UNASSIGNED_CLIENT_VALUE}>
                      Unassigned
                    </SelectItem>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>

                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as ProjectStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>

                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as ProjectPriority)
                    }
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>

                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>

                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleAddProject}
                disabled={!name}
              >
                Save Project
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
          <CardTitle>Project List</CardTitle>
          <CardDescription>
            Current and upcoming work across all clients.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link href={`/projects/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={getProjectClientSelectValue(project)}
                      onValueChange={(value) =>
                        handleUpdateProjectClient(project, value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={UNASSIGNED_CLIENT_VALUE}>
                          Unassigned
                        </SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[project.status]}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.priority}</TableCell>
                  <TableCell>{project.progress}%</TableCell>
                  <TableCell>{formatDate(project.dueDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}