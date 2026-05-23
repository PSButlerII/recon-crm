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
import { PageActions } from "@/components/page-actions";
import { useState } from "react";
import { useCrm } from "@/context/crm-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logActivity } from "@/lib/log-activity";

export default function QuotesPage() {
  
  const { quotes, setQuotes, clients, projects,setActivity,setInvoices  } = useCrm();

  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [issuedDate, setIssuedDate] = useState("");


  async function handleCreateQuote() {
    const client = clients.find((client) => client.id === clientId);
    const project = projects.find((project) => project.id === projectId && project.clientId===clientId);

    if (!client || !title) return;

    const newQuote = {
      clientId: client.id,
      clientName: client.name,
      projectId: project?.id,
      projectName: project?.name,
      title,
      status: "Draft" as const,
      amount: Number(amount || 0),      
      validUntil,
    };

    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newQuote),
    });

    if (!response.ok) {
      console.error("Failed to create quote.");
      return;
    }

    const data = await response.json();
    const savedQuote = data.quote;

    setQuotes((current) => [
      {
        id: savedQuote.id,
        clientId: savedQuote.clientId ?? undefined,
        clientName: savedQuote.clientName,
        projectId: savedQuote.projectId ?? undefined,
        projectName: savedQuote.projectName ?? undefined,
        title: savedQuote.title,
        status: savedQuote.status,
        amount: savedQuote.amount,
        issuedDate: savedQuote.issuedDate ?? undefined,
        validUntil: savedQuote.validUntil ?? undefined,        
      },
      ...current,
    ]);

    const savedActivity = await logActivity({
      clientId: savedQuote.clientId ?? undefined,
      projectId: savedQuote.projectId ?? undefined,
      type: "System",
      message: `Created quote "${savedQuote.title}" as a draft.`,
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

    setClientId("");
    setProjectId("");
    setTitle("");
    setAmount("");
    setValidUntil("");    
    setOpen(false);
  }

  async function handleMarkSent(quoteId: string) {
    const response = await fetch("/api/quotes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: quoteId,
        status: "Sent",
        issuedDate: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("Failed to mark quote as sent.");
      return;
    }

    const data = await response.json();
    const updatedQuote = data.quote;

    setQuotes((current) =>
      current.map((quote) =>
        quote.id === updatedQuote.id
          ? {
              ...quote,
              status: updatedQuote.status,
              issuedDate: updatedQuote.issuedDate ?? undefined,
            }
          : quote
      )
    );
      const savedActivity = await logActivity({
        clientId: updatedQuote.clientId ?? undefined,
        projectId: updatedQuote.projectId ?? undefined,
        type: "System",
        message: `Marked quote "${updatedQuote.title}" as sent.`,
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

  async function handleUpdateQuoteStatus(
    quoteId: string,
    status: "Accepted" | "Declined"
    ) {
    const response = await fetch("/api/quotes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: quoteId,
        status,
      }),
    });

    if (!response.ok) {
      console.error("Failed to update quote.");
      return;
    }

    const data = await response.json();
    const updatedQuote = data.quote;

    setQuotes((current) =>
    current.map((quote) =>
    quote.id === updatedQuote.id
      ? {
          ...quote,
          status: updatedQuote.status,
        }
      : quote
  )
);

  const savedActivity = await logActivity({
    clientId: updatedQuote.clientId ?? undefined,
    projectId: updatedQuote.projectId ?? undefined,
    type: "System",
    message: `Marked quote "${updatedQuote.title}" as ${updatedQuote.status}.`,
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

  async function handleConvertToInvoice(quoteId: string) {
    const quote = quotes.find((quote) => quote.id === quoteId);

    if (!quote || quote.status !== "Accepted") return;

    const newInvoice = {
      quoteId: quote.id,
      clientId: quote.clientId,
      clientName: quote.clientName,
      projectId: quote.projectId,
      projectName: quote.projectName,
      title: quote.title.replace("Quote", "Invoice"),
      status: "Draft" as const,
      amount: quote.amount,
    };

    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newInvoice),
    });

    if (!response.ok) {
      console.error("Failed to create invoice from quote.");
      return;
    }

    const data = await response.json();
    const savedInvoice = data.invoice;

    setInvoices((current) => [
      {
        id: savedInvoice.id,
        quoteId: savedInvoice.quoteId ?? undefined,
        clientId: savedInvoice.clientId ?? undefined,
        clientName: savedInvoice.clientName,
        projectId: savedInvoice.projectId ?? undefined,
        projectName: savedInvoice.projectName ?? undefined,
        title: savedInvoice.title,
        status: savedInvoice.status,
        amount: savedInvoice.amount,
        issuedDate: savedInvoice.issuedDate ?? undefined,
        dueDate: savedInvoice.dueDate ?? undefined,
        paidDate: savedInvoice.paidDate ?? undefined,
      },
      ...current,
    ]);

    const savedActivity = await logActivity({
      clientId: savedInvoice.clientId ?? undefined,
      projectId: savedInvoice.projectId ?? undefined,
      type: "System",
      message: `Created invoice "${savedInvoice.title}" from accepted quote.`,
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

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <>
      <PageActions>
        <PageHeader
          title="Quotes"
          description="Track proposed work, estimates, and accepted offers."
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Quote</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Quote</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
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
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Issued date</Label>
                <Input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateQuote}
                disabled={!clientId || !title}
              >
                Save Quote
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
      </PageActions>

      <Card>
        <CardHeader>
          <CardTitle>Quote List</CardTitle>
          <CardDescription>Open and historical client quotes.</CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Issued Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.title}</TableCell>

                  <TableCell>
                    <Link href={`/clients/${quote.clientId}`} className="hover:underline">
                      {quote.clientName}
                    </Link>
                  </TableCell>

                  <TableCell>
                    {quote.projectId ? (
                      <Link href={`/projects/${quote.projectId}`} className="hover:underline">
                        {quote.projectName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{quote.status}</Badge>

                      {quote.status === "Draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkSent(quote.id)}
                        >
                          Mark Sent
                        </Button>
                      )}
                      {quote.status === "Sent" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateQuoteStatus(quote.id, "Accepted")
                          }
                        >
                          Accept
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleUpdateQuoteStatus(quote.id, "Declined")
                          }
                        >
                          Decline
                        </Button>
                        
                      </>
                      )}
                      {quote.status === "Accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertToInvoice(quote.id)}
                        >
                          Create Invoice
                        </Button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{money.format(quote.amount)}</TableCell>
                  <TableCell>{quote.validUntil ?? "—"}</TableCell>
                  <TableCell>{quote.issuedDate ?? "—"}</TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}