"use client";

import { useState,useEffect } from "react";
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
import { PageActions } from "@/components/page-actions";
import { useCrm } from "@/context/crm-context";
import type { Task, TaskStatus, TaskPriority } from "@/types/task";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logActivity } from "@/lib/log-activity";



export default function TasksPage() {
  
  const statusVariants = {
  Todo: "secondary",
  "In Progress": "default",
  Blocked: "destructive",
  Done: "outline",
  } as const;

  const { tasks, setTasks, projects,setActivity,refreshCrmData } = useCrm();

  const [open, setOpen] = useState(false);
  
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Todo");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const[successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TaskStatus>("All");

  const filteredTasks = tasks.filter((task) => {
  const matchesSearch =
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.projectName.toLowerCase().includes(search.toLowerCase()) ||
    task.clientName.toLowerCase().includes(search.toLowerCase()) ||
    task.priority.toLowerCase().includes(search.toLowerCase()) ||
    task.status.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" || task.status === statusFilter;

  return matchesSearch && matchesStatus;
  });

  async function handleAddTask() {
    const project = projects.find((project) => project.id === projectId);

    if (!project) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      projectId: project.id,
      projectName: project.name,
      clientId: project.clientId,
      clientName: project.clientName,
      title,
      description,
      status,
      priority,
      dueDate,
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

      const savedActivity = await logActivity({
        clientId: newTask.clientId,
        projectId: newTask.projectId,
        type: "Task",
        message: `Created task "${newTask.title}".`,
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

      setTitle("");
      setProjectId("");
      setDescription("");
      setStatus("Todo");
      setPriority("Medium");
      setDueDate("");
      setSuccessMessage(`Task "${title}" was added.`);
      setOpen(false);
  }
  const [isLoading, setIsLoading] = useState(false);

function formatDate(value?: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
}
 
refreshCrmData
  return (
    <>
      <PageActions>
        <PageHeader
          title="Tasks"
          description="Track action items across clients and projects."
        />
        
        <Button variant="outline" onClick={refreshCrmData}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Search clients..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as "All" | TaskStatus)
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                        <SelectItem value="Todo">Todo</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Task</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Create a new task linked to a project.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Project</Label>

                <Select
                  value={projectId}
                  onValueChange={(value) => setProjectId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>

                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
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
                      setStatus(value as TaskStatus)
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
                      setPriority(value as TaskPriority)
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
                onClick={handleAddTask}
                disabled={!title || !projectId}
              >
                Save Task
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
          <CardTitle>Task List</CardTitle>
          <CardDescription>
            Upcoming and active work items across the CRM.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>

                  <TableCell>
                    <Link
                      href={`/projects/${task.projectId}`}
                      className="text-slate-600 hover:underline"
                    >
                      {task.projectName}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/clients/${task.clientId}`}
                      className="text-slate-600 hover:underline"
                    >
                      {task.clientName}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariants[task.status]}>
                      {task.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{task.priority}</TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}