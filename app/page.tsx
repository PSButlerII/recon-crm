"use client"

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
import { useCrm } from "@/context/crm-context";
import { EmptyState } from "@/components/empty-state";
import { StatCard

 } from "@/components/stat-card";
export default function DashboardPage() {
 const {
    clients,
    projects,
    tasks,
    serviceRequests,
    intakeSubmissions,
    activity,
    isLoadingCrm,
    quotes,
  invoices,
    refreshCrmData
  } = useCrm();

  const recentActivity = [...activity]
  .sort((a, b) => {
    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  })
  .slice(0, 5);
  
  const leadClients = clients.filter((client) => client.status === "Lead");
  const activeClients = clients.filter((client) => client.status === "Active");

  const activeProjects = projects.filter(
    (project) => project.status === "Active"
  );

  const openRequests = serviceRequests.filter(
    (request) =>
      request.status !== "Declined" &&
      request.status !== "Converted"
  );

  const openProjects = projects.filter(
    (project) =>
      project.status !== "Completed" &&
      project.status !== "Cancelled"
  );

  const newIntake = intakeSubmissions.filter(
    (submission) => submission.status === "New"
  );

  const openTasks = tasks.filter((task) => task.status !== "Done");

  const overdueTasks = openTasks.filter((task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  });

  const upcomingTasks = [...openTasks]
    .filter((task) => task.dueDate)
    .sort((a, b) => {
      return (
        new Date(a.dueDate ?? "").getTime() -
        new Date(b.dueDate ?? "").getTime()
      );
    })
    .slice(0, 5);

  const acceptedQuoteTotal = quotes
    .filter((quote) => quote.status === "Accepted")
    .reduce((sum, quote) => sum + quote.amount, 0);

  const outstandingInvoiceTotal = invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const paidInvoiceTotal = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

    const money = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="At-a-glance view of clients, projects, tasks, and upcoming work."
      />
        <Button variant="outline" onClick={refreshCrmData}>
          {isLoadingCrm ? "Refreshing..." : "Refresh"}
        </Button>
      <div className="grid gap-4 md:grid-cols-2">
        
        <Card>
          <CardHeader>
            <CardDescription>Active Clients</CardDescription>
            <CardTitle className="text-3xl">
              {clients.filter((client) => client.status === "Active").length}
            
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Open Requests</CardDescription>
            <CardTitle className="text-2xl">{openRequests.length}
             
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Leads</CardDescription>
              <CardTitle className="text-2xl">{leadClients.length}
           
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Active Projects</CardDescription>
              <CardTitle className="text-2xl">{activeProjects.length}
            
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Overdue Tasks</CardDescription>
              <CardTitle className="text-2xl">{overdueTasks.length}
              
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Active Clients</CardDescription>
              <CardTitle className="text-2xl">{activeClients.length}
               
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Open Projects</CardDescription>
            <CardTitle className="text-3xl">{openProjects.length}
            
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>New Intake</CardDescription>
            <CardTitle className="text-2xl">{newIntake.length}
        
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Pending Tasks</CardDescription>
            <CardTitle className="text-3xl">{openTasks.length}
              
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest CRM changes and workflow events.
            </CardDescription>
            
          </CardHeader>

          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <p className="font-medium">{item.message}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.type} · {item.createdAt}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="No recent activity yet." />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle> Billing Totals </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
        <StatCard 
        label="Accepted Quotes"
        value={money.format(acceptedQuoteTotal)}
        />

        <StatCard
          label="Outstanding Invoices"
          value={money.format(outstandingInvoiceTotal)}
        />

        <StatCard
          label="Paid Invoices"
          value={money.format(paidInvoiceTotal)}
        />
        </CardContent>
        </Card>
        </div>
      

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>
              The next few due items across all projects.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {upcomingTasks.length>0?(
            upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-4 rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {task.projectName} · {task.clientName}
                  </p>
                </div>

                <div className="text-right">
                  <Badge variant="outline">{task.priority}</Badge>
                  <p className="mt-2 text-sm text-slate-500">{task.dueDate}</p>
                </div>
              </div>
            ))
            ) : (
            <EmptyState message="No recent activity yet." />
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Service Requests</CardTitle>
            <CardDescription>
              Potential work that has not become a project yet.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {openRequests.length>0?(
              openRequests.map((request) => (
                <div key={request.id} className="rounded-xl border p-4">
                  <p className="font-medium">{request.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {request.category} · {request.status}
                  </p>
                </div>
                ))
                ) : (
                  <EmptyState message="No recent activity yet." />
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Intake</CardTitle>
            <CardDescription>
              Website inquiries that need review.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {newIntake.length>0?(
              newIntake.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/intake/${submission.id}`}
                  className="block rounded-xl border p-4 hover:bg-slate-50"
                >
                  <p className="font-medium">{submission.company || submission.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {submission.projectType} · {submission.priority}
                  </p>
                </Link>
                ))
                ) : (
                  <EmptyState message="No recent activity yet." />
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>
              Current work that needs monitoring.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {openProjects.length>0?(
              openProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-xl border p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {project.clientName}
                      </p>
                    </div>

                    <div className="text-right text-sm">
                      <p className="font-medium">{project.progress}%</p>
                      <p className="text-slate-500">{project.dueDate ?? "—"}</p>
                    </div>
                  </div>
                </Link>
                ))
                ) : (
                  <EmptyState message="No recent activity yet." />
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}