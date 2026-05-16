import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { mockTasks } from "@/data/mock-tasks";
import { mockProjects } from "@/data/mock-projects";
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
import { mockNotes } from "@/data/mock-notes";

const statusVariants = {
  Planning: "secondary",
  Active: "default",
  "On Hold": "outline",
  Completed: "default",
  Cancelled: "destructive",
} as const;

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const project = mockProjects.find((item) => item.id === projectId);
  const projectTasks = mockTasks.filter((task) => task.projectId === projectId);
  const openTasks = projectTasks.filter((task) => task.status !== "Done");
  const projectNotes = mockNotes.filter((note) => note.projectId === projectId);
  
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
              <div className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">Progress</p>
                <p className="mt-2 text-2xl font-bold">{project.progress}%</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">Open Tasks</p>
                <p className="mt-2 text-2xl font-bold">{openTasks.length}</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">Files</p>
                <p className="mt-2 text-2xl font-bold">{projectNotes.length}</p>
              </div>
            </div>

            <div className="rounded-xl border">
              <div className="border-b p-4">
                <h3 className="font-semibold">Tasks</h3>
                <p className="text-sm text-slate-500">
                  Action items attached to this project.
                </p>
              </div>

              <div className="rounded-xl border">
                <div className="border-b p-4">
                  <h3 className="font-semibold">Notes</h3>
                  <p className="text-sm text-slate-500">
                    Context, decisions, and reminders attached to this project.
                  </p>
                </div>

                <div className="divide-y">
                  {projectNotes.length > 0 ? (
                    projectNotes.map((note) => (
                      <div key={note.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{note.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{note.body}</p>
                          </div>

                          <div className="text-right text-sm">
                            <p className="font-medium">{note.type}</p>
                            <p className="text-slate-500">{note.createdAt}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-slate-500">
                      No notes attached to this project yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="divide-y">
                {projectTasks.length > 0 ? (
                  projectTasks.map((task) => (
                    <div key={task.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="mt-1 text-sm text-slate-500">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="text-right text-sm">
                          <p className="font-medium">{task.status}</p>
                          <p className="text-slate-500">{task.dueDate ?? "No due date"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-500">
                    No tasks attached to this project yet.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}