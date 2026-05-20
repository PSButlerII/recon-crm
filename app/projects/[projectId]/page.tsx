"use client";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { StatCard } from "@/components/stat-card";
import { WorkspaceSection } from "@/components/workspace-section";
import { EmptyState } from "@/components/empty-state";
import { WorkspaceItem } from "@/components/workspace-item";
import { use, useState } from "react";

import type { NoteType } from "@/types/note";
import type { TaskPriority, TaskStatus } from "@/types/task";

import { useCrm } from "@/context/crm-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const statusVariants = {
  Planning: "secondary",
  Active: "default",
  "On Hold": "outline",
  Completed: "default",
  Cancelled: "destructive",
  } as const;

  const {
    projects,
    tasks,
    notes,
    setNotes,
    files,
    activity,
    setActivity,
    quotes,
    invoices,
    serviceRequests,
    setTasks,
    setProjects
    } = useCrm();

  const { projectId } = use(params);
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return <div>Project not found.</div>;
  }

  const projectTasks = tasks.filter((task) => task.projectId === projectId);
  const openTasks = projectTasks.filter((task) => task.status !== "Done");

  const projectNotes = notes.filter((note) => note.projectId === projectId);
  const projectFiles = files.filter((file) => file.projectId === projectId);
  const projectActivity = activity.filter(
    (item) => item.projectId === projectId
  );

  const projectQuotes = quotes.filter((quote) => quote.projectId === projectId);
  const projectInvoices = invoices.filter(
    (invoice) => invoice.projectId === projectId
  );

  const relatedRequest = serviceRequests.find(
    (request) => request.id === project.serviceRequestId
  );
  
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("General");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("Todo");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  const completedTasks = projectTasks.filter((task) => task.status === "Done");

  const calculatedProgress = projectTasks.length > 0
      ? Math.round((completedTasks.length / projectTasks.length) * 100)
      : project.progress;

  function handleAddProjectNote() {
  if (!noteTitle || !noteBody) return;

  if (!project) {
    notFound();
  }

  const newNote = {
    
    id: crypto.randomUUID(),
    clientId: project.clientId,
    projectId: project.id,
    title: noteTitle,
    body: noteBody,
    type: noteType,
    createdAt: new Date().toISOString().split("T")[0],
  };

  setNotes((current) => [newNote, ...current]);

  setActivity((current) => [
    {
      id: crypto.randomUUID(),
      clientId: project.clientId,
      projectId: project.id,
      type: "Note",
      message: `Added note "${newNote.title}".`,
      createdAt: new Date().toLocaleString(),
    },
    ...current,
  ]);

  setNoteTitle("");
  setNoteBody("");
  setNoteType("General");
  }

  async function handleAddProjectTask() {
  if (!taskTitle) return;
   if (!project) {
    notFound();
  }
    
  const newTask = {
    id: crypto.randomUUID(),
    projectId: project.id,
    projectName: project.name,
    clientId: project.clientId,
    clientName: project.clientName,
    title: taskTitle,
    description: taskDescription,
    status: taskStatus,
    priority: taskPriority,
    dueDate: taskDueDate,
  };

  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newTask),
  });

  if (!response.ok) {
    console.error("Failed to persist task.");
    return;
  }

  const data = await response.json();
  const savedTask = data.task;

  setTasks((current) => [
    {
      id: savedTask.id,
      projectId: savedTask.projectId,
      projectName: savedTask.projectName,
      clientId: savedTask.clientId ?? undefined,
      clientName: savedTask.clientName ?? undefined,
      title: savedTask.title,
      description: savedTask.description ?? undefined,
      status: savedTask.status,
      priority: savedTask.priority,
      dueDate: savedTask.dueDate ?? undefined,
    },
    ...current,
  ]);

  setActivity((current) => [
    {
      id: crypto.randomUUID(),
      clientId: project.clientId,
      projectId: project.id,
      type: "Task",
      message: `Added task "${newTask.title}".`,
      createdAt: new Date().toLocaleString(),
    },
    ...current,
  ]);

  setTaskTitle("");
  setTaskDescription("");
  setTaskStatus("Todo");
  setTaskPriority("Medium");
  setTaskDueDate("");
  }

  async function handleUpdateTaskStatus(taskId: string, status: TaskStatus) {
    const task = tasks.find((task) => task.id === taskId);
    if (!project) {
      notFound();
    }
    if (!task) return;

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, status } : task
      )
    );
    
    const response = await fetch("/api/tasks", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: taskId,
        status,
      }),
    });

    if (!response.ok) {
      console.error("Failed to persist task status update.");
    }

    setProjects((current) =>
      current.map((item) => {
        if (item.id !== project.id) return item;

        const updatedTasks = tasks.map((task) =>
          task.id === taskId ? { ...task, status } : task
        );

        const projectUpdatedTasks = updatedTasks.filter(
          (task) => task.projectId === project.id
        );

        const doneTasks = projectUpdatedTasks.filter(
          (task) => task.status === "Done"
        );

        const nextProgress =
          projectUpdatedTasks.length > 0
            ? Math.round((doneTasks.length / projectUpdatedTasks.length) * 100)
            : item.progress;

        return {
          ...item,
          progress: nextProgress,
        };
      })
    );

    setActivity((current) => [
      {
        id: crypto.randomUUID(),
        clientId: task.clientId,
        projectId: task.projectId,
        type: "Task",
        message: `Task "${task.title}" moved to ${status}.`,
        createdAt: new Date().toLocaleString(),
      },
      ...current,
    ]);
  }

  if (!project) {
    notFound();
  }

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={project.name}
          description={project.description}
        />

        <Badge variant={statusVariants[project.status]}>
          {project.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Project Info</CardTitle>
            <CardDescription>Core tracking details.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500">Client</p>
              <Link
                href={`/clients/${project.clientId}`}
                className="font-medium hover:underline"
              >
                {project.clientName}
              </Link>
            </div>

            <div>
              <p className="text-slate-500">Priority</p>
              <p className="font-medium">{project.priority}</p>
            </div>

            <div>
              <p className="text-slate-500">Start Date</p>
              <p className="font-medium">{project.startDate ?? "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Due Date</p>
              <p className="font-medium">{project.dueDate ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Workspace</CardTitle>
            <CardDescription>
              Tasks, notes, files, milestones, and project activity.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Progress" value={`${calculatedProgress}%`} />
              <StatCard label="Open Tasks" value={openTasks.length} />
              <StatCard label="Notes" value={projectNotes.length} />
              <StatCard label="Files" value={projectFiles.length} />
            </div>

            <WorkspaceSection            
              title="Tasks"
              description="Action items attached to this project."
            >
              <div className="space-y-3 border-b p-4">
                <Input
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />

                <Input
                  placeholder="Task description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <Select
                    value={taskStatus}
                    onValueChange={(value) => setTaskStatus(value as TaskStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Todo">Todo</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={taskPriority}
                    onValueChange={(value) => setTaskPriority(value as TaskPriority)}
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

                  <Input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>

                <Button onClick={handleAddProjectTask}>
                  Add Project Task
                </Button>
              </div>

              <div className="divide-y">
                {projectTasks.length > 0 ? (
                  projectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-4 p-4"
                    >
                      <div>
                        <p className="font-medium">{task.title}</p>

                        {task.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Select
                          value={task.status}
                          onValueChange={(value) =>
                            handleUpdateTaskStatus(task.id, value as TaskStatus)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="Todo">Todo</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Blocked">Blocked</SelectItem>
                            <SelectItem value="Done">Done</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="text-right text-sm text-slate-500">
                          <p>{task.priority}</p>
                          <p>{task.dueDate || "No due date"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState message="No tasks attached to this project yet." />
                )}
              </div>
            </WorkspaceSection>
          
            <WorkspaceSection
              title="Notes"
              description="Context, decisions, and reminders attached to this project."
            >
              <div className="space-y-3 border-b p-4">
                <Input
                  placeholder="Note title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />

                <Textarea
                  placeholder="Note body"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />

                <Select
                  value={noteType}
                  onValueChange={(value) => setNoteType(value as NoteType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Decision">Decision</SelectItem>
                    <SelectItem value="Reminder">Reminder</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleAddProjectNote}>
                  Add Project Note
                </Button>
              </div>
              <div className="divide-y">
                {projectNotes.length > 0 ? (
                  projectNotes.map((note) => (
                    <WorkspaceItem  key={note.id}
                      title={note.title}
                      description=  {note.body}
                      metaTop={note.type}
                      metaBottom={note.createdAt}                         
                    />
                  ))
                ) : (
                  <EmptyState message="No notes attached to this project yet." />
                )}
              </div>
            </WorkspaceSection>

            <WorkspaceSection
                title="Activity Timeline"
                description="Recent actions and updates related to this project."
                >
              

              <div className="divide-y">
                {projectActivity.length > 0 ? (
                  projectActivity.map((activity) => (
                    <WorkspaceItem
                      key={activity.id}
                      title={activity.message}
                      description={activity.type}
                      metaTop={activity.createdAt}
                      
                    />
                  ))
                ) : (
                  <EmptyState message="No activity recorded for this project yet." />
                )}
              </div>
            </WorkspaceSection>
            
            <WorkspaceSection
              title="Billing"
              description="Quotes and invoices connected to this client."
            >

              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold italic underline">Quotes</h4>
                  {projectQuotes.length > 0 ? (
                    <div className="space-y-2">
                      {projectQuotes.map((quote) => (
                        <WorkspaceItem 
                          key={quote.id}
                          title={quote.title}
                          description={`$${quote.amount} · ${quote.status}`}                            
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No quotes yet.</p>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold italic underline">Invoices</h4>
                  {projectInvoices.length > 0 ? (
                    <div className="space-y-2">
                      {projectInvoices.map((invoice) => (
                        <div key={invoice.id} className="rounded-xl border p-3 text-sm">
                          <p className="font-medium">{invoice.title}</p>
                          <p className="text-slate-500">
                            ${invoice.amount} · {invoice.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No invoices yet." />
                  )}
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              title="Files"
              description="Documents, references, and deliverables attached here."
            >
              <div className="divide-y">
                {projectFiles.length > 0 ? (
                  projectFiles.map((file) => (
                    <WorkspaceItem  key={file.id}
                      title={file.name}
                      description={file.type}
                      metaTop={file.size}
                      metaBottom={file.uploadedAt}
                    />
                  ))
                ) : (
                  <EmptyState message="No files attached to this project yet." />
                  
                )}
              </div>
            </WorkspaceSection>

          </CardContent>
        </Card>
        {relatedRequest && (
          <div>
            <p className="text-slate-500">Source Request</p>
            <Link
              href={`/service-requests/${relatedRequest.id}`}
              className="font-medium hover:underline"
            >
              {relatedRequest.title}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}