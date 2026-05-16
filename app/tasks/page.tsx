import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { mockTasks } from "@/data/mock-tasks";
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

const statusVariants = {
  Todo: "secondary",
  "In Progress": "default",
  Blocked: "destructive",
  Done: "outline",
} as const;

export default function TasksPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Tasks"
          description="Track action items across clients and projects."
        />

        <Button>Add Task</Button>
      </div>

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
              {mockTasks.map((task) => (
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
                  <TableCell>{task.dueDate ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}