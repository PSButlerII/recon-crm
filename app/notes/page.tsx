"use client";
import { useState,useEffect } from "react";
import { PageActions } from "@/components/page-actions";
import { PageHeader } from "@/components/page-header";
import { WorkspaceItem } from "@/components/workspace-item";
import { EmptyState } from "@/components/empty-state";
import type { Note, NoteType } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCrm } from "@/context/crm-context";
import { logActivity } from "@/lib/log-activity";


export default function NotesPage() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"All" | NoteType>("All");

    const { notes, setNotes,clients,projects, setActivity,refreshCrmData } = useCrm();

    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [type, setType] = useState<NoteType>("General");
    const [clientId, setClientId] = useState("");
    const [projectId, setProjectId] = useState("");
    const filteredNotes = notes.filter((note) => {
      const matchesSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.body.toLowerCase().includes(search.toLowerCase()) ||
      note.type.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "All" || note.type === typeFilter;

    return matchesSearch && matchesType;
    });

  async function handleAddNote() {
    const selectedProject = projects.find((project) => project.id === projectId);
    const selectedClient = clients.find((client) => client.id === clientId);

    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      body,
      type,
      clientId: selectedProject?.clientId ?? selectedClient?.id,
      projectId: selectedProject?.id,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newNote),
    });

    if (!response.ok) {
      console.error("Failed to persist note.");
      return;
    }

    const data = await response.json();
    const savedNote = data.note;

    setNotes((current) => [
      {
        id: savedNote.id,
        clientId: savedNote.clientId ?? undefined,
        projectId: savedNote.projectId ?? undefined,
        title: savedNote.title,
        body: savedNote.body,
        type: savedNote.type,
        createdAt: savedNote.createdAt,
      },
      ...current,
    ]);

    const savedActivity = await logActivity({
      clientId: newNote.clientId,
      projectId: newNote.projectId,
      type: "Note",
      message: `Created note "${newNote.title}".`,
    });

    if (savedActivity) {
      setActivity((current) => [
        {
          id: savedActivity.id,
          clientId: savedActivity.clientId ?? undefined,
          projectId: savedActivity.projectId ?? undefined,
          type: savedActivity.type,
          message: savedActivity.message,
          createdAt: savedActivity.createdAt,
        },
        ...current,
      ]);
    }
    setTitle("");
    setBody("");
    setType("General");
    setClientId("");
    setProjectId("");
    setOpen(false);
  }

  const [isLoading] = useState(false);
function formatDate(value?: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
}
  refreshCrmData

  return (
    <>
      <PageActions>
        <PageHeader
          title="Notes"
          description="Capture calls, decisions, reminders, research, and project context."
        />

        <Button variant="outline" onClick={refreshCrmData}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as "All" | NoteType)}
            >
                <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
                </SelectTrigger>

                <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Call">Call</SelectItem>
                <SelectItem value="Decision">Decision</SelectItem>
                <SelectItem value="Reminder">Reminder</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
                </SelectContent>
            </Select>

            {/* Keep your Add Note dialog here */}
            </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Note</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Attach a note to a client, project, or both.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(value) => setType(value as NoteType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Decision">Decision</SelectItem>
                    <SelectItem value="Reminder">Reminder</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Optional project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleAddNote} disabled={!title || !body}>
                Save Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageActions>

      <Card>
        <CardHeader>
          <CardTitle>Note List</CardTitle>
          <CardDescription>Recent notes across clients and projects.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="divide-y rounded-xl border">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <WorkspaceItem
                  key={note.id}
                  title={note.title}
                  description={note.body}
                  metaTop={note.type}
                  metaBottom={formatDate(note.createdAt)}
                />
              ))
            ) : (
              <EmptyState message="No notes yet." />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}