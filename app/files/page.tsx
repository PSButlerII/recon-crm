import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { mockFiles } from "@/data/mock-files";
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
import { PageActions } from "@/components/page-actions";

export default function FilesPage() {
  return (
    <>
      <PageActions>
        <PageHeader
          title="Files"
          description="Documents, references, deliverables, and client/project assets."
        />

        <Button>Upload File</Button>
      </PageActions>

      <Card>
        <CardHeader>
          <CardTitle>File Library</CardTitle>
          <CardDescription>
            Files connected to clients and projects.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mockFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.name}</TableCell>

                  <TableCell>
                    <Badge variant="outline">{file.type}</Badge>
                  </TableCell>

                  <TableCell>
                    {file.clientId ? (
                      <Link
                        href={`/clients/${file.clientId}`}
                        className="hover:underline"
                      >
                        {file.clientName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    {file.projectId ? (
                      <Link
                        href={`/projects/${file.projectId}`}
                        className="hover:underline"
                      >
                        {file.projectName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>{file.size}</TableCell>
                  <TableCell>{file.uploadedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}