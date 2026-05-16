import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { mockInvoices } from "@/data/mock-billing";
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

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function InvoicesPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Invoices"
          description="Track billable work, payment status, and due dates."
        />

        <Button>Create Invoice</Button>
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
              </TableRow>
            </TableHeader>

            <TableBody>
              {mockInvoices.map((invoice) => (
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
                  <TableCell>{invoice.dueDate ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}