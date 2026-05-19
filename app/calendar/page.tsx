"use client"

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCrm } from "@/context/crm-context";

export default function CalendarPage() {
  const { projects, tasks } = useCrm();

  const calendarItems = [
    ...projects
      .filter((project) => project.dueDate)
      .map((project) => ({
        id: project.id,
        type: "Project Due",
        title: project.name,
        date: project.dueDate!,
        href: `/projects/${project.id}`,
        subtitle: project.clientName,
        priority: project.priority,
      })),
    ...tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task.id,
        type: "Task Due",
        title: task.title,
        date: task.dueDate!,
        href: `/projects/${task.projectId}`,
        subtitle: `${task.projectName} · ${task.clientName}`,
        priority: task.priority,
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Upcoming task and project dates across the CRM."
      />

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Schedule</CardTitle>
          <CardDescription>
            A lightweight project calendar based on due dates.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {calendarItems.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.href}
              className="block rounded-xl border p-4 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge>{item.priority}</Badge>
                  </div>

                  <p className="mt-3 font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.subtitle}
                  </p>
                </div>

                <div className="text-right text-sm font-medium">
                  {item.date}
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}