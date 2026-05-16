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

  const client = mockClients.find((item) => item.id === clientId);

  const clientProjects = mockProjects.filter(
  (project) => project.clientId === clientId
);

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
                <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4">
                    <p className="text-sm text-slate-500">Projects</p>
                    <p className="mt-2 text-2xl font-bold">{clientProjects.length}</p>
                </div>

                <div className="rounded-xl border p-4">
                    <p className="text-sm text-slate-500">Open Tasks</p>
                    <p className="mt-2 text-2xl font-bold">0</p>
                </div>

                <div className="rounded-xl border p-4">
                    <p className="text-sm text-slate-500">Files</p>
                    <p className="mt-2 text-2xl font-bold">0</p>
                </div>
                </div>

                <div className="rounded-xl border">
                <div className="border-b p-4">
                    <h3 className="font-semibold">Projects</h3>
                    <p className="text-sm text-slate-500">
                    Work currently attached to this client.
                    </p>
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
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}