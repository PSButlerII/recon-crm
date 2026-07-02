"use client";

import Link from "next/link";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageActions } from "@/components/page-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCrm } from "@/context/crm-context";
import {
  mapFileRecord,
  upsertById,
  type PersistedFileRecord,
} from "@/lib/crm-record-mappers";
import type { FileRecordType } from "@/types/file-record";

const NO_ASSOCIATION_VALUE = "__none__";
const FILE_TYPES: FileRecordType[] = [
  "Document",
  "Image",
  "Contract",
  "Invoice",
  "Reference",
  "Deliverable",
];

type UploadFileResponse = {
  file: PersistedFileRecord;
};

export default function FilesPage() {
  const {
    files,
    setFiles,
    clients,
    projects,
    refreshCrmData,
    isLoadingCrm,
  } = useCrm();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileRecordType>("Document");
  const [clientId, setClientId] = useState(NO_ASSOCIATION_VALUE);
  const [projectId, setProjectId] = useState(NO_ASSOCIATION_VALUE);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleUploadFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedFile) {
      setError("Choose a file to upload.");
      return;
    }

    const selectedClient = clients.find((client) => client.id === clientId);
    const selectedProject = projects.find((project) => project.id === projectId);
    const formData = new FormData();

    formData.append("file", selectedFile);
    formData.append("type", fileType);

    if (selectedClient) {
      formData.append("clientId", selectedClient.id);
      formData.append("clientName", selectedClient.name);
    }

    if (selectedProject) {
      formData.append("projectId", selectedProject.id);
      formData.append("projectName", selectedProject.name);
    }

    setIsUploading(true);

    const response = await fetch("/api/files", {
      method: "POST",
      body: formData,
    });

    setIsUploading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Failed to upload file.");
      return;
    }

    const data = (await response.json()) as UploadFileResponse;
    const savedFile = mapFileRecord(data.file);

    setFiles((current) => upsertById(current, savedFile));
    setSuccessMessage(`Uploaded "${savedFile.name}".`);
    setSelectedFile(null);
    setFileType("Document");
    setClientId(NO_ASSOCIATION_VALUE);
    setProjectId(NO_ASSOCIATION_VALUE);
    setOpen(false);
  }

  return (
    <>
      <PageActions>
        <PageHeader
          title="Files"
          description="Documents, references, deliverables, and client/project assets."
        />

        <Button variant="outline" onClick={refreshCrmData}>
          {isLoadingCrm ? "Refreshing..." : "Refresh"}
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Upload File</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Store a local file and optionally connect it to a client or
                project.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleUploadFile}>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={fileType}
                  onValueChange={(value) => setFileType(value as FileRecordType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_ASSOCIATION_VALUE}>No client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_ASSOCIATION_VALUE}>No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button className="w-full" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Save File"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageActions>

      {successMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </div>
      )}

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
                <TableHead>Download</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {files.map((file) => (
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
                  <TableCell>
                    {file.relativePath ? (
                      <a
                        href={`/api/files/${file.id}/download`}
                        className="text-slate-600 hover:underline"
                      >
                        Download
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
