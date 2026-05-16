import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { mockClients } from "@/data/mock-clients";
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
import { mockProjects } from "@/data/mock-projects";
import { mockNotes } from "@/data/mock-notes";
import { mockActivity } from "@/data/mock-activity";
import { mockInvoices, mockQuotes } from "@/data/mock-billing";
import { mockFiles } from "@/data/mock-files";
import { StatCard } from "@/components/stat-card";
import { WorkspaceSection } from "@/components/workspace-section";
import { EmptyState } from "@/components/empty-state";
import { WorkspaceItem } from "@/components/workspace-item";

const statusVariants = {
  Lead: "secondary",
  Active: "default",
  Paused: "outline",
  Archived: "destructive",
} as const;

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const clientNotes = mockNotes.filter((note) => note.clientId === clientId);
  const client = mockClients.find((item) => item.id === clientId);
  const clientActivity = mockActivity.filter(
    (activity) => activity.clientId === clientId
  );
  const clientProjects = mockProjects.filter(
  (project) => project.clientId === clientId
  );
  const clientQuotes = mockQuotes.filter((quote) => quote.clientId === clientId);
  const clientInvoices = mockInvoices.filter(
    (invoice) => invoice.clientId === clientId
  );
  const clientFiles = mockFiles.filter((file) => file.clientId === clientId);

  if (!client) {
    notFound();
  }

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={client.name}
          description="Client profile, project history, notes, and activity."
        />

        <Badge variant={statusVariants[client.status]}>{client.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Info</CardTitle>
            <CardDescription>Primary contact information.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500">Contact</p>
              <p className="font-medium">{client.contactName}</p>
            </div>

            <div>
              <p className="text-slate-500">Email</p>
              <p className="font-medium">{client.email}</p>
            </div>

            <div>
              <p className="text-slate-500">Phone</p>
              <p className="font-medium">{client.phone || "—"}</p>
            </div>

            <div>
              <p className="text-slate-500">Last Contacted</p>
              <p className="font-medium">{client.lastContacted || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Client Workspace</CardTitle>
                <CardDescription>
                Projects, tasks, notes, files, and activity for this client.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border p-4">
                    <p className="text-sm text-slate-500">Projects</p>
                    <p className="mt-2 text-2xl font-bold">{clientProjects.length}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="mt-2 text-2xl font-bold">{clientNotes.length}</p>
                </div>
                <div className="rounded-xl border p-4">
                    <p className="text-sm text-slate-500">Open Tasks</p>
                    <p className="mt-2 text-2xl font-bold">0</p>
                </div>

                <StatCard label="Files" value={clientFiles.length} />
                </div>

                <WorkspaceSection
                  title="Activity Timeline"
                  description="Recent actions and updates related to this client."
                >
                  <div className="divide-y">
                    {clientActivity.length > 0 ? (
                      clientActivity.map((activity) => (
                        <WorkspaceItem
                          key={activity.id} 
                          title={activity.message}
                          description={activity.type}
                          metaTop={activity.createdAt}
                            />
                      ))
                    ) : (
                      <EmptyState message="No activity recorded yet." />
                    )}
                  </div>
                </WorkspaceSection>

                <WorkspaceSection
              title= "Billing"
              description="Quotes and invoices connected to this client."
              >
                 

                  <div className="grid gap-4 p-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Quotes</h4>
                      {clientQuotes.length > 0 ? (
                        <div className="space-y-2">
                          {clientQuotes.map((quote) => (
                            <WorkspaceItem
                              key={quote.id}
                              title={quote.title}
                              description={`$${quote.amount} · ${quote.status}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState message="No quotes yet." />
                      )}
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Invoices</h4>
                      {clientInvoices.length > 0 ? (
                        <div className="space-y-2">
                          {clientInvoices.map((invoice) => (
                            <WorkspaceItem
                              key={invoice.id}
                              title={invoice.title}
                              description={`$${invoice.amount} · ${invoice.status}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState message="No invoices yet." />
                      )}
                    </div>
                  </div>
                </WorkspaceSection>

                <WorkspaceSection
                  title="Projects"
                  description="Work currently attached to this client."
                >
                  <div className="divide-y">
                    {clientProjects.length > 0 ? (
                    clientProjects.map((project) => (
                        <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block p-4 hover:bg-slate-50"
                        >
                        <WorkspaceItem
                            title={project.name}
                            description={project.description}
                            metaTop={`${project.progress}%`}
                            metaBottom={project.status}
                        />
                        </Link>
                    ))
                    ) : (
                    <EmptyState
                      message="No projects attached to this client yet."
                    />
                    )}
                </div>
                </WorkspaceSection>

                <WorkspaceSection
                title= "Files"
                description="Documents, references, and deliverables attached here."
                >

                  <div className="divide-y">
                    {clientFiles.length > 0 ? (
                      clientFiles.map((file) => (
                        <WorkspaceItem
                        key={file.id} 
                        title={file.name}
                        description={file.type}
                        metaTop={file.size}
                        metaBottom={file.uploadedAt}                      
                        />
                      ))
                    ) : (
                      <EmptyState
                        message="No files attached yet."
                      />
                    )}
                  </div>
                </WorkspaceSection>

                <WorkspaceSection
                  title="Notes"
                    description="Relationship notes, decisions, reminders, and project context."
                    >

                    <div className="divide-y">
                      {clientNotes.length > 0 ? (
                        clientNotes.map((note) => (
                          <WorkspaceItem
                            key={note.id}
                            title={note.title}
                            description={note.body}
                            metaTop={note.type}
                            metaBottom={note.createdAt}
                          />
                        ))
                      ) : (
                        <EmptyState
                          message ="No notes attached to this client yet."
                        />
                      )}
                    </div>
                </WorkspaceSection>           
                  
            </CardContent>
        </Card>
      </div>
    </>
  );
}