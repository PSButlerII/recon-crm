"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { useCrm } from "@/context/crm-context";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { logActivity } from "@/lib/log-activity";

type InvoiceDetailPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {

  const { invoiceId } = use(params);

  const {
    invoices,
    setInvoices,
    setActivity,
    isLoadingCrm,
    } = useCrm();

  const invoice = invoices.find((item) => item.id === invoiceId);

  if (isLoadingCrm) return <div>Loading invoice...</div>;
  if (!invoice) return <div>Invoice not found.</div>;

    async function handleMarkSent() {
        if(!invoice){
            return;
        }
    const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        id: invoice.id,
        status: "Sent",
        issuedDate: new Date().toISOString(),
        }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const updatedInvoice = data.invoice;

    setInvoices((current) =>
        current.map((item) =>
        item.id === updatedInvoice.id
            ? {
                ...item,
                status: updatedInvoice.status,
                issuedDate: updatedInvoice.issuedDate ?? undefined,
            }
            : item
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

    async function handleMarkPaid() {
        if(!invoice){
            return;
        }
        const response = await fetch("/api/invoices", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            id: invoice.id,
            status: "Paid",
            paidDate: new Date().toISOString(),
            }),
        });

        if (!response.ok) return;

        const data = await response.json();
        const updatedInvoice = data.invoice;

        setInvoices((current) =>
            current.map((item) =>
                item.id === updatedInvoice.id
             ? {
        ...item,
            status: updatedInvoice.status,
            paidDate: updatedInvoice.paidDate ?? undefined,
            }
            : item
            )
        );
    }

  return (
    <>
      <Button variant="ghost" asChild>
        <Link href="/invoices">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Link>
      </Button>

      <PageHeader
        title={invoice.title}
        description="Invoice details, status, and payment tracking."
      />
        <div className="flex gap-2">
            {invoice.status === "Draft" && (
                <Button onClick={handleMarkSent}>Mark Sent</Button>
            )}

            {invoice.status === "Sent" && (
                <Button onClick={handleMarkPaid}>Mark Paid</Button>
            )}
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>{invoice.title}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
            {invoice.clientId && (
                <div>
                    <p className="text-slate-500">Client</p>
                    <Link
                    href={`/clients/${invoice.clientId}`}
                    className="font-medium hover:underline"
                    >
                    {invoice.clientName}
                    </Link>
                </div>
                )}

                {invoice.projectId && (
                <div>
                    <p className="text-slate-500">Project</p>
                    <Link
                    href={`/projects/${invoice.projectId}`}
                    className="font-medium hover:underline"
                    >
                    {invoice.projectName}
                    </Link>
                </div>
                )}
                {invoice.quoteId && (
                <div>
                    <p className="text-slate-500">Source Quote</p>
                    <Link
                    href="/quotes"
                    className="font-medium hover:underline"
                    >
                    View Quote
                    </Link>
                </div>
                )}
          <div>
            <p className="text-slate-500">Status</p>
            <Badge variant="outline">{invoice.status}</Badge>
          </div>

          <div>
            <p className="text-slate-500">Amount</p>
            <p className="font-medium">${invoice.amount.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-slate-500">Issued Date</p>
            <p>{invoice.issuedDate ?? "—"}</p>
          </div>

          <div>
            <p className="text-slate-500">Due Date</p>
            <p>{invoice.dueDate ?? "—"}</p>
          </div>

          <div>
            <p className="text-slate-500">Paid Date</p>
            <p>{invoice.paidDate ?? "—"}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}