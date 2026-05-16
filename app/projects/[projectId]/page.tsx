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
import { mockActivity } from "@/data/mock-activity";
import { mockInvoices, mockQuotes } from "@/data/mock-billing";
import { mockFiles } from "@/data/mock-files";
import { StatCard } from "@/components/stat-card";
import { WorkspaceSection } from "@/components/workspace-section";
import { EmptyState } from "@/components/empty-state";
import { WorkspaceItem } from "@/components/workspace-item";

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
  const projectActivity = mockActivity.filter(
  (activity) => activity.projectId === projectId
  );
  const projectQuotes = mockQuotes.filter(
    (quote) => quote.projectId === projectId
  );
  const projectInvoices = mockInvoices.filter(
    (invoice) => invoice.projectId === projectId
  );
  const projectFiles = mockFiles.filter((file) => file.projectId === projectId);
  
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


            <StatCard label="Files" value={projectFiles.length} />
             <StatCard label="Open Tasks" value={openTasks.length} />
            </div>

            <WorkspaceSection
              title="Tasks"
              description="Action items attached to this project."
            >
              <div className="divide-y">
                {projectTasks.length > 0 ? (
                  projectTasks.map((task) => (
                    <WorkspaceItem
                      key={task.id}
                      title={task.title}
                          description={task.description}
                        metaTop={task.status}
                      metaBottom={task.dueDate ?? "No due date"}
                    />
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
      </div>
    </>
  );
}