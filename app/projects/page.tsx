import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { mockProjects } from "@/data/mock-projects";
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
  Planning: "secondary",
  Active: "default",
  "On Hold": "outline",
  Completed: "default",
  Cancelled: "destructive",
} as const;

export default function ProjectsPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Projects"
          description="Track active work, deadlines, progress, and priorities."
        />

        <Button>Add Project</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project List</CardTitle>
          <CardDescription>
            Current and upcoming work across all clients.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mockProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link href={`/projects/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/clients/${project.clientId}`}
                      className="text-slate-600 hover:underline"
                    >
                      {project.clientName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[project.status]}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.priority}</TableCell>
                  <TableCell>{project.progress}%</TableCell>
                  <TableCell>{project.dueDate ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}