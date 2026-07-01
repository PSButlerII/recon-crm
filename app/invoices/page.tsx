"use client"
import Link from "next/link";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { PageActions } from "@/components/page-actions";
import { useCrm } from "@/context/crm-context";
import { logActivity } from "@/lib/log-activity";
import { mapInvoice, upsertById, type PersistedInvoice } from "@/lib/crm-record-mappers";
import type { BillingStatus, Invoice } from "@/types/billing";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"; 
import { Label } from "@/components/ui/label";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BillingStatus>("All"); 
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const {
    invoices,
    setInvoices,
    clients,
    projects,
    setActivity,
    refreshCrmData,
    isLoadingCrm,
  } = useCrm();

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.title.toLowerCase().includes(search.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(search.toLowerCase()) ||
      invoice.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.status.toLowerCase().includes(search.toLowerCase());

      const effectiveStatus = isInvoiceOverdue(invoice)
      ? "Overdue"
      : invoice.status;

    const matchesStatus =
      statusFilter === "All" || effectiveStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalDraft = invoices
    .filter((invoice) => invoice.status === "Draft")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const totalSent = invoices
    .filter((invoice) => invoice.status === "Sent")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const totalPaid = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const totalOutstanding = invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  function formatDate(value?: string) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString();
  }

  async function handleCreateInvoice() {
    const client = clients.find((client) => client.id === clientId);
    const project = projects.find(
      (project) => project.id === projectId && project.clientId === clientId
    );

    if (!client || !title) return;

    const newInvoice = {
      clientId: client.id,
      clientName: client.name,
      projectId: project?.id,
      projectName: project?.name,
      title,
      status: "Draft" as const,
      amount: Number(amount || 0),
      dueDate,
    };

    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newInvoice),
    });

    if (!response.ok) {
      console.error("Failed to create invoice.");
      return;
    }

    const data = await response.json();
    const savedInvoice = data.invoice;

    setInvoices((current) =>
      upsertById(current, mapInvoice(savedInvoice as PersistedInvoice))
    );
    const savedActivity = await logActivity({
      clientId: savedInvoice.clientId ?? undefined,
      projectId: savedInvoice.projectId ?? undefined,
      type: "System",
      message: `Created invoice "${savedInvoice.title}" as a draft.`,
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
    setOpen(false);
    setClientId("");
    setProjectId("");
    setTitle("");
    setAmount("");
    setDueDate("");
  }

  async function handleMarkInvoiceSent(invoiceId: string) {
    const response = await fetch("/api/invoices", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: invoiceId,
        status: "Sent",
        issuedDate: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("Failed to mark invoice as sent.");
      return;
    }

    const data = await response.json();
    const updatedInvoice = data.invoice;

    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === updatedInvoice.id
          ? {
              ...invoice,
              status: updatedInvoice.status,
              issuedDate: updatedInvoice.issuedDate ?? undefined,
            }
          : invoice
      )
    );
    const savedActivity = await logActivity({
      clientId: updatedInvoice.clientId ?? undefined,
      projectId: updatedInvoice.projectId ?? undefined,
      type: "System",
      message: `Marked invoice "${updatedInvoice.title}" as sent.`,
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
  }

  async function handleMarkInvoicePaid(invoiceId: string) {
    const response = await fetch("/api/invoices", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: invoiceId,
        status: "Paid",
        paidDate: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("Failed to mark invoice as paid.");
      return;
    }

    const data = await response.json();
    const updatedInvoice = data.invoice;

    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === updatedInvoice.id
          ? {
              ...invoice,
              status: updatedInvoice.status,
              paidDate: updatedInvoice.paidDate ?? undefined,
            }
          : invoice
      )
    );
    const savedActivity = await logActivity({
      clientId: updatedInvoice.clientId ?? undefined,
      projectId: updatedInvoice.projectId ?? undefined,
      type: "System",
      message: `Marked invoice "${updatedInvoice.title}" as paid.`,
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
  }

  function isInvoiceOverdue(invoice: Invoice) {
    if (invoice.status === "Paid") return false;
    if (!invoice.dueDate) return false;

    return new Date(invoice.dueDate) < new Date();
  }

  return (
    <>
     <Button variant="ghost" asChild>
        <Link href="/">          
          &larr; Back to Dashboard
        </Link>
      </Button>

      <PageActions>
       
        <PageHeader
          title="Invoices"
          description="Track billable work, payment status, and due dates."
        />

        <Button variant="outline" onClick={refreshCrmData}>
          {isLoadingCrm ? "Refreshing..." : "Refresh"}
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "All" | BillingStatus)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Invoice</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice linked to a client project.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice Name</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Client</Label>

                <Select
                  value={clientId}
                  onValueChange={(value) => {
                    setClientId(value);
                    setProjectId("");
                  }}
                >
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
                <Select 
                value={projectId}
                onValueChange={(value)=> setProjectId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project"/>
                  </SelectTrigger>

                  <SelectContent>
                    {projects
                      .filter((project) => project.clientId === clientId)
                      .map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div> 

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>  

              <div className="grid gap-4 sm:grid-cols-2">             
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCreateInvoice}
                disabled={!title || !clientId}
              >
                Save Invoice
              </Button>
            </div>
            
            </DialogContent>
          </Dialog>
      </PageActions>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Draft</CardDescription>
            <CardTitle>{money.format(totalDraft)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Sent</CardDescription>
            <CardTitle>{money.format(totalSent)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Paid</CardDescription>
            <CardTitle>{money.format(totalPaid)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Outstanding</CardDescription>
            <CardTitle>{money.format(totalOutstanding)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>Paid, open, and overdue invoices.</CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium"><Link href={`/invoices/${invoice.id}`} className="hover:underline">
                      {invoice.title}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <Link href={`/clients/${invoice.clientId}`} className="hover:underline">
                      {invoice.clientName}
                    </Link>
                  </TableCell>

                  <TableCell>
                    {invoice.projectId ? (
                      <Link href={`/projects/${invoice.projectId}`} className="hover:underline">
                        {invoice.projectName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {isInvoiceOverdue(invoice) ? "Overdue" : invoice.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{money.format(invoice.amount)}</TableCell>

                  <TableCell>
                    {formatDate(invoice.dueDate)}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      {invoice.status === "Draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkInvoiceSent(invoice.id)}
                        >
                          Mark Sent
                        </Button>
                      )}

                      {invoice.status === "Sent" && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkInvoicePaid(invoice.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
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