"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";

import { PageActions } from "@/components/page-actions";
import { PageHeader } from "@/components/page-header";
import { WorkspaceItem } from "@/components/workspace-item";
import { EmptyState } from "@/components/empty-state";

import { mockNotes } from "@/data/mock-notes";
import { mockClients } from "@/data/mock-clients";
import { mockProjects } from "@/data/mock-projects";

import type { Note, NoteType } from "@/types/note";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NoteType>("General");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");

  function handleAddNote() {
    const selectedProject = mockProjects.find((project) => project.id === projectId);
    const selectedClient = mockClients.find((client) => client.id === clientId);

    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      body,
      type,
      clientId: selectedProject?.clientId ?? selectedClient?.id,
      projectId: selectedProject?.id,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setNotes((current) => [newNote, ...current]);

    setTitle("");
    setBody("");
    setType("General");
    setClientId("");
    setProjectId("");
    setOpen(false);
  }

  return (
    <>
      <PageActions>
        <PageHeader
          title="Notes"
          description="Capture calls, decisions, reminders, research, and project context."
        />

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
                    {mockClients.map((client) => (
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
                    {mockProjects.map((project) => (
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
            {notes.length > 0 ? (
              notes.map((note) => (
                <WorkspaceItem
                  key={note.id}
                  title={note.title}
                  description={note.body}
                  metaTop={note.type}
                  metaBottom={note.createdAt}
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