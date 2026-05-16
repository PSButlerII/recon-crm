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

                <div className="rounded-xl border">
                <div className="border-b p-4">
                    <h3 className="font-semibold">Projects</h3>
                    <p className="text-sm text-slate-500">
                    Work currently attached to this client.
                    </p>
                </div>

                <div className="rounded-xl border">
                  <div className="border-b p-4">
                    <h3 className="font-semibold">Activity Timeline</h3>
                    <p className="text-sm text-slate-500">
                      Recent actions and updates related to this client.
                    </p>
                  </div>

                  <div className="divide-y">
                    {clientActivity.length > 0 ? (
                      clientActivity.map((activity) => (
                        <div key={activity.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">{activity.message}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {activity.type}
                              </p>
                            </div>

                            <div className="text-right text-sm text-slate-500">
                              {activity.createdAt}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-slate-500">
                        No activity recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border">
                  <div className="border-b p-4">
                    <h3 className="font-semibold">Billing</h3>
                    <p className="text-sm text-slate-500">
                      Quotes and invoices connected to this client.
                    </p>
                  </div>

                  <div className="grid gap-4 p-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Quotes</h4>
                      {clientQuotes.length > 0 ? (
                        <div className="space-y-2">
                          {clientQuotes.map((quote) => (
                            <div key={quote.id} className="rounded-xl border p-3 text-sm">
                              <p className="font-medium">{quote.title}</p>
                              <p className="text-slate-500">
                                ${quote.amount} · {quote.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No quotes yet.</p>
                      )}
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Invoices</h4>
                      {clientInvoices.length > 0 ? (
                        <div className="space-y-2">
                          {clientInvoices.map((invoice) => (
                            <div key={invoice.id} className="rounded-xl border p-3 text-sm">
                              <p className="font-medium">{invoice.title}</p>
                              <p className="text-slate-500">
                                ${invoice.amount} · {invoice.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No invoices yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                    {clientProjects.length > 0 ? (
                    clientProjects.map((project) => (
                        <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block p-4 hover:bg-slate-50"
                        >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                                {project.description}
                            </p>
                            </div>

                            <div className="text-right text-sm">
                            <p className="font-medium">{project.progress}%</p>
                            <p className="text-slate-500">{project.status}</p>
                            </div>
                        </div>
                        </Link>
                    ))
                    ) : (
                    <div className="p-4 text-sm text-slate-500">
                        No projects attached to this client yet.
                    </div>
                    )}
                </div>
                
                <div className="rounded-xl border">
                  <div className="border-b p-4">
                    <h3 className="font-semibold">Files</h3>
                    <p className="text-sm text-slate-500">
                      Documents, references, and deliverables attached here.
                    </p>
                  </div>

                  <div className="divide-y">
                    {clientFiles.length > 0 ? (
                      clientFiles.map((file) => (
                        <div key={file.id} className="flex items-start justify-between gap-4 p-4">
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{file.type}</p>
                          </div>

                          <div className="text-right text-sm text-slate-500">
                            <p>{file.size}</p>
                            <p>{file.uploadedAt}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-slate-500">
                        No files attached yet.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border">
                    <div className="border-b p-4">
                      <h3 className="font-semibold">Notes</h3>
                      <p className="text-sm text-slate-500">
                        Relationship notes, decisions, reminders, and project context.
                      </p>
                    </div>

                    <div className="divide-y">
                      {clientNotes.length > 0 ? (
                        clientNotes.map((note) => (
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
                          No notes attached to this client yet.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}