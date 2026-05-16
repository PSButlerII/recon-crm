"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { mockClients } from "@/data/mock-clients";
import type { Client, ClientStatus } from "@/types/client";
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
import Link from "next/link";
import { PageActions } from "@/components/page-action";

const statusVariants = {
  Lead: "secondary",
  Active: "default",
  Paused: "outline",
  Archived: "destructive",
} as const;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<ClientStatus>("Lead");

  function handleAddClient() {
    const newClient: Client = {
      id: crypto.randomUUID(),
      name,
      contactName,
      email,
      status,
      projectCount: 0,
      lastContacted: new Date().toISOString().split("T")[0],
    };

    setClients((current) => [newClient, ...current]);

    setName("");
    setContactName("");
    setEmail("");
    setStatus("Lead");
    setOpen(false);
  }

  return (
    <>
      <PageActions>
        <PageHeader
          title="Clients"
          description="Manage companies, individuals, and organizations you work with."
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Client</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
              <DialogDescription>
                Create a new client record for your CRM.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Client / Company Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ClientStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleAddClient}
                disabled={!name || !contactName || !email}
              >
                Save Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageActions>

      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            Current clients, leads, and archived relationships.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Last Contact</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.contactName}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[client.status]}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.projectCount}</TableCell>
                  <TableCell>{client.lastContacted ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}