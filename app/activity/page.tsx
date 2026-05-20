"use client";

import { useCrm } from "@/context/crm-context";
import { PageHeader } from "@/components/page-header";
import { WorkspaceItem } from "@/components/workspace-item";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ActivityPage() {
  const { activity } = useCrm();

  const sortedActivity = [...activity].sort((a, b) => {
    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });

  return (
    <>
      <PageHeader
        title="Activity"
        description="Recent CRM actions, updates, and system events."
      />

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Latest changes across clients, projects, tasks, notes, intake, and requests.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="divide-y rounded-xl border">
            {sortedActivity.length > 0 ? (
              sortedActivity.map((item) => (
                <WorkspaceItem
                  key={item.id}
                  title={item.message}
                  description={item.type}
                  metaTop={item.createdAt}
                />
              ))
            ) : (
              <EmptyState message="No activity recorded yet." />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}