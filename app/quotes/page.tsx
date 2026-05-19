import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { mockQuotes } from "@/data/mock-billing";
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


export default function QuotesPage() {
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

        <Button>Create Quote</Button>
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
              </TableRow>
            </TableHeader>

            <TableBody>
              {mockQuotes.map((quote) => (
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
                    <Badge variant="outline">{quote.status}</Badge>
                  </TableCell>

                  <TableCell>{money.format(quote.amount)}</TableCell>
                  <TableCell>{quote.validUntil ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}