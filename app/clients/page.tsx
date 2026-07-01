"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
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
import { PageActions } from "@/components/page-actions";
import { useCrm } from "@/context/crm-context";
import { logActivity } from "@/lib/log-activity";
import {
  mapClient,
  upsertById,
  type PersistedClient,
} from "@/lib/crm-record-mappers";

type ClientResponse = {
  client: PersistedClient;
};

type ClientUpdatePayload = {
  id: string;
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string | null;
  status?: ClientStatus;
  lastContacted?: string | null;
};

const CLIENT_STATUSES: ClientStatus[] = [
  "Lead",
  "Active",
  "Paused",
  "Archived",
];

export default function ClientsPage() {
  const statusVariants = {
  Lead: "secondary",
  Active: "default",
  Paused: "outline",
  Archived: "destructive",
} as const;

  const {
    clients,
    setClients,
    projects,
    setActivity,
    refreshCrmData,
    isLoadingCrm,
  } = useCrm();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone]= useState("");
  const [status, setStatus] = useState<ClientStatus>("Lead");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ClientStatus>("All");
  const [updatingStatusClientId, setUpdatingStatusClientId] = useState<
    string | null
  >(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState("");
  const [editName, setEditName] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<ClientStatus>("Lead");
  const [editLastContacted, setEditLastContacted] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const filteredClients = clients.filter((client) => {
  const matchesSearch =
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.contactName.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" || client.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  function dateInputValue(value?: string) {
    if (!value) return "";

    const datePrefix = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

    if (datePrefix) return datePrefix;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
  }

  async function updateClient(payload: ClientUpdatePayload) {
    const response = await fetch("/api/clients", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Failed to update client.");
      return null;
    }

    const data = (await response.json()) as ClientResponse;
    const savedClient = mapClient(data.client);

    setClients((current) => upsertById(current, savedClient));

    return savedClient;
  }

  async function logClientStatusChange(
    clientId: string,
    clientName: string,
    previousStatus: ClientStatus,
    nextStatus: ClientStatus
  ) {
    if (previousStatus === nextStatus) return;

    const savedActivity = await logActivity({
      clientId,
      type: "Client",
      message: `Updated client "${clientName}" status from ${previousStatus} to ${nextStatus}.`,
    });

    if (savedActivity) {
      setActivity((current) =>
        current.some((item) => item.id === savedActivity.id)
          ? current
          : [savedActivity, ...current]
      );
    }
  }

  async function handleClientStatusChange(
    client: Client,
    nextStatus: ClientStatus
  ) {
    if (client.status === nextStatus || updatingStatusClientId) return;

    setUpdatingStatusClientId(client.id);

    try {
      const savedClient = await updateClient({
        id: client.id,
        status: nextStatus,
      });

      if (savedClient) {
        await logClientStatusChange(
          savedClient.id,
          savedClient.name,
          client.status,
          savedClient.status
        );
      }
    } finally {
      setUpdatingStatusClientId(null);
    }
  }

  function openEditClient(client: Client) {
    setEditingClientId(client.id);
    setEditName(client.name);
    setEditContactName(client.contactName);
    setEditEmail(client.email);
    setEditPhone(client.phone ?? "");
    setEditStatus(client.status);
    setEditLastContacted(dateInputValue(client.lastContacted));
    setEditOpen(true);
  }

  function resetEditClient() {
    setEditingClientId("");
    setEditName("");
    setEditContactName("");
    setEditEmail("");
    setEditPhone("");
    setEditStatus("Lead");
    setEditLastContacted("");
  }

  async function handleUpdateClient() {
    const originalClient = clients.find(
      (client) => client.id === editingClientId
    );

    if (!originalClient) return;

    setIsSavingEdit(true);

    try {
      const savedClient = await updateClient({
        id: originalClient.id,
        name: editName,
        contactName: editContactName,
        email: editEmail,
        phone: editPhone || null,
        status: editStatus,
        lastContacted: editLastContacted || null,
      });

      if (!savedClient) return;

      await logClientStatusChange(
        savedClient.id,
        savedClient.name,
        originalClient.status,
        savedClient.status
      );

      setEditOpen(false);
      resetEditClient();
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleAddClient() {
    const newClient = {
      name,
      contactName,
      email,
      phone: phone || undefined,
      status,
      projectCount: 0,
      lastContacted: new Date().toISOString().split("T")[0],
    };

    const response = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newClient),
    });

    if (!response.ok) {
      console.error("Failed to persist client.");
      return;
    }

    const data = (await response.json()) as ClientResponse;
    const savedClient = mapClient(data.client);

    setClients((current) => upsertById(current, savedClient));

    const savedActivity = await logActivity({
      clientId: savedClient.id,
      type: "Client",
      message: `Created client "${savedClient.name}".`,
    });

    if (savedActivity) {
      setActivity((current) =>
        current.some((item) => item.id === savedActivity.id)
          ? current
          : [savedActivity, ...current]
      );
    }

    setName("");
    setContactName("");
    setEmail("");
    setPhone("");
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
        <Button variant="outline" onClick={refreshCrmData}>
          {isLoadingCrm ? "Refreshing..." : "Refresh"}
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "All" | ClientStatus)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {CLIENT_STATUSES.map((clientStatus) => (
                  <SelectItem key={clientStatus} value={clientStatus}>
                    {clientStatus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <Label>Phone Number</Label>
                <Input
                  type="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                    {CLIENT_STATUSES.map((clientStatus) => (
                      <SelectItem key={clientStatus} value={clientStatus}>
                        {clientStatus}
                      </SelectItem>
                    ))}
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
        </div>
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
                <TableHead>Actions</TableHead>
                <TableHead>Last Contact</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredClients.map((client) => {
              const clientProjectCount = projects.filter(
                (project) => project.clientId === client.id
              ).length;

              return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.contactName}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <Select
                      value={client.status}
                      disabled={updatingStatusClientId === client.id}
                      onValueChange={(value) =>
                        handleClientStatusChange(
                          client,
                          value as ClientStatus
                        )
                      }
                    >
                      <SelectTrigger className="w-[132px]">
                        <Badge variant={statusVariants[client.status]}>
                          {updatingStatusClientId === client.id
                            ? "Saving..."
                            : client.status}
                        </Badge>
                      </SelectTrigger>

                      <SelectContent>
                        {CLIENT_STATUSES.map((clientStatus) => (
                          <SelectItem key={clientStatus} value={clientStatus}>
                            {clientStatus}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{clientProjectCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditClient(client)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                  <TableCell>{client.lastContacted ?? "—"}</TableCell>
                </TableRow>
  );
})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen);

          if (!nextOpen) {
            resetEditClient();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client record and current relationship status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client / Company Name</Label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input
                value={editContactName}
                onChange={(event) => setEditContactName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                type="phone"
                value={editPhone}
                onChange={(event) => setEditPhone(event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(value) =>
                    setEditStatus(value as ClientStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>

                  <SelectContent>
                    {CLIENT_STATUSES.map((clientStatus) => (
                      <SelectItem key={clientStatus} value={clientStatus}>
                        {clientStatus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Last Contact</Label>
                <Input
                  type="date"
                  value={editLastContacted}
                  onChange={(event) =>
                    setEditLastContacted(event.target.value)
                  }
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleUpdateClient}
              disabled={
                isSavingEdit || !editName || !editContactName || !editEmail
              }
            >
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
