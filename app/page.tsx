import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { mockClients } from "@/data/mock-clients";
import { mockProjects } from "@/data/mock-projects";
import { mockTasks } from "@/data/mock-tasks";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockServiceRequests } from "@/data/mock-service-requests";


const leadClients = mockClients.filter((client) => client.status === "Lead");
const activeClients = mockClients.filter((client) => client.status === "Active");

const activeProjects = mockProjects.filter(
  (project) => project.status === "Active"
);

const openRequests = mockServiceRequests.filter(
  (request) =>
    request.status !== "Declined" &&
    request.status !== "Converted"
);

const openProjects = mockProjects.filter(
  (project) => project.status !== "Completed" && project.status !== "Cancelled"
);

const openTasks = mockTasks.filter((task) => task.status !== "Done");
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

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="At-a-glance view of clients, projects, tasks, and upcoming work."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Active Clients</CardDescription>
            <CardTitle className="text-3xl">
              {mockClients.filter((client) => client.status === "Active").length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Open Requests</CardDescription>
            <CardTitle className="text-2xl">{openRequests.length}</CardTitle>
          </CardHeader>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Leads</CardDescription>
              <CardTitle className="text-2xl">{leadClients.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Active Projects</CardDescription>
              <CardTitle className="text-2xl">{activeProjects.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Overdue Tasks</CardDescription>
              <CardTitle className="text-2xl">{overdueTasks.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Active Clients</CardDescription>
              <CardTitle className="text-2xl">{activeClients.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Open Projects</CardDescription>
            <CardTitle className="text-3xl">{openProjects.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Pending Tasks</CardDescription>
            <CardTitle className="text-3xl">{openTasks.length}</CardTitle>
          </CardHeader>
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
            {upcomingTasks.map((task) => (
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
            ))}
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
            {openRequests.map((request) => (
              <div key={request.id} className="rounded-xl border p-4">
                <p className="font-medium">{request.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {request.category} · {request.status}
                </p>
              </div>
            ))}
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
            {openProjects.map((project) => (
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
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}