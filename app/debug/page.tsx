"use client";

import { useCrm } from "@/context/crm-context";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const crm = useCrm();

  return (
    <>
      <PageHeader
        title="Debug"
        description="Temporary CRM state inspection page."
      />

      <Card>
        <CardHeader>
          <CardTitle>CRM Context State</CardTitle>
        </CardHeader>

        <CardContent>
          <pre className="max-h-[700px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(crm, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </>
  );
}