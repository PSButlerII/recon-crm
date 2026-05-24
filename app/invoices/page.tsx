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
import { useCrm } from "@/context/crm-context";
import { logActivity } from "@/lib/log-activity";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function InvoicesPage() {

  const { invoices, setInvoices, setActivity } = useCrm();

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

  return (
    <>
      <PageActions>
        <PageHeader
          title="Invoices"
          description="Track billable work, payment status, and due dates."
        />

        <Button>Create Invoice</Button>
        
      </PageActions>

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
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.title}</TableCell>

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
                    <Badge variant="outline">{invoice.status}</Badge>
                  </TableCell>

                  <TableCell>{money.format(invoice.amount)}</TableCell>

                  <TableCell>
                    {invoice.dueDate ?? "—"}
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